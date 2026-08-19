using AMS.Application.Contracts;
using AMS.Application.Contracts.Dtos;
using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using AMS.Domain.Shared;

namespace AMS.Application.Services;

public class StudentEnrollmentAppService : IEnrollmentAppService
{
    private readonly IStudentEnrollmentRepository _enrollmentRepository;
    private readonly IUserRepository _userRepository;
    private readonly IClassCourseRepository _classCourseRepository;
    private readonly ITeacherSubjectAssignmentRepository _teacherSubjectAssignmentRepository;
    private readonly ISubjectRepository _subjectRepository;
    private readonly IAcademicYearRepository _academicYearRepository;

    public StudentEnrollmentAppService(
        IStudentEnrollmentRepository enrollmentRepository,
        IUserRepository userRepository,
        IClassCourseRepository classCourseRepository,
        ITeacherSubjectAssignmentRepository teacherSubjectAssignmentRepository,
        ISubjectRepository subjectRepository,
        IAcademicYearRepository academicYearRepository)
    {
        _enrollmentRepository = enrollmentRepository;
        _userRepository = userRepository;
        _classCourseRepository = classCourseRepository;
        _teacherSubjectAssignmentRepository = teacherSubjectAssignmentRepository;
        _subjectRepository = subjectRepository;
        _academicYearRepository = academicYearRepository;
    }

    public async Task<IReadOnlyList<StudentEnrollmentDto>> GetAllAsync(Guid currentUserId, string currentUserRole, bool includeAllAcademicYears = false, CancellationToken cancellationToken = default)
    {
        var enrollments = currentUserRole switch
        {
            nameof(UserRole.Admin) => includeAllAcademicYears
                ? await _enrollmentRepository.GetAllAsync(cancellationToken)
                : await LoadAdminEnrollmentsForActiveYearAsync(cancellationToken),
            nameof(UserRole.Teacher) => await LoadTeacherEnrollmentsAsync(currentUserId, cancellationToken),
            _ => throw new ForbiddenException("Only admins and teachers can manage enrollments.")
        };

        var result = new List<StudentEnrollmentDto>();

        foreach (var enrollment in enrollments)
        {
            var student = await _userRepository.GetByIdAsync(enrollment.StudentId, cancellationToken) ?? throw new NotFoundException("Student not found.");
            if (student.Role != UserRole.Student) continue;
            var classCourse = await _classCourseRepository.GetByIdAsync(enrollment.ClassCourseId, cancellationToken) ?? throw new NotFoundException("Class/course not found.");

            result.Add(new StudentEnrollmentDto
            {
                StudentId = enrollment.StudentId,
                StudentName = student.FullName,
                ClassCourseId = enrollment.ClassCourseId,
                ClassCourseName = classCourse.Name,
                RollNumber = enrollment.RollNumber,
                ParentMobile = student.ParentMobile,
                PhoneNumber = student.PhoneNumber,
                AvatarUrl = student.AvatarUrl,
                IsActive = student.IsActive
            });
        }

        return result;
    }

    private async Task<IReadOnlyList<Domain.Entities.StudentEnrollment>> LoadAdminEnrollmentsForActiveYearAsync(CancellationToken cancellationToken)
    {
        var activeYear = await _academicYearRepository.GetActiveAsync(cancellationToken);
        if (activeYear == null) throw new NotFoundException("No active academic year found.");

        return await _enrollmentRepository.GetByAcademicYearAsync(activeYear.Id, cancellationToken);
    }

    private async Task<IReadOnlyList<Domain.Entities.StudentEnrollment>> LoadTeacherEnrollmentsAsync(Guid teacherId, CancellationToken cancellationToken)
    {
        var activeYear = await _academicYearRepository.GetActiveAsync(cancellationToken);
        if (activeYear == null) throw new NotFoundException("No active academic year found.");

        var assignments = await _teacherSubjectAssignmentRepository.GetByTeacherAsync(teacherId, cancellationToken);
        var subjectIds = assignments.Select(a => a.SubjectId).Distinct().ToList();
        var classIds = new HashSet<Guid>();
        foreach (var sid in subjectIds)
        {
            var subject = await _subjectRepository.GetByIdAsync(sid, cancellationToken);
            if (subject is not null) classIds.Add(subject.ClassCourseId);
        }

        var enrollments = new List<Domain.Entities.StudentEnrollment>();
        foreach (var classId in classIds)
        {
            var classEnrollments = await _enrollmentRepository.GetByClassCourseAsync(classId, cancellationToken);
            enrollments.AddRange(classEnrollments.Where(e => e.AcademicYearId == activeYear.Id));
        }

        return enrollments;
    }

    public async Task<StudentEnrollmentDto> CreateAsync(CreateStudentEnrollmentDto input, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        if (currentUserRole != nameof(UserRole.Admin)) throw new ForbiddenException("Only admins can manage enrollments.");

        var student = await _userRepository.GetByIdAsync(input.StudentId, cancellationToken) ?? throw new NotFoundException("Student not found.");
        if (student.Role != UserRole.Student) throw new ValidationException("Selected user is not a student.");

        var classCourse = await _classCourseRepository.GetByIdAsync(input.ClassCourseId, cancellationToken) ?? throw new NotFoundException("Class/course not found.");
        var existing = await _enrollmentRepository.GetAsync(input.StudentId, input.ClassCourseId, cancellationToken);
        if (existing is not null) throw new ValidationException("Student is already enrolled in this class.");

        var studentEnrollments = await _enrollmentRepository.GetByStudentAsync(input.StudentId, cancellationToken);
        foreach (var studentEnrollment in studentEnrollments)
        {
            var enrolledClass = await _classCourseRepository.GetByIdAsync(studentEnrollment.ClassCourseId, cancellationToken);
            if (enrolledClass is not null && enrolledClass.AcademicYearId == classCourse.AcademicYearId)
            {
                throw new ValidationException("A student can only be enrolled in one class per academic year.");
            }
        }

        var enrollment = new StudentEnrollment(input.StudentId, input.ClassCourseId, classCourse.AcademicYearId, input.RollNumber);
        await _enrollmentRepository.AddAsync(enrollment, cancellationToken);

        return new StudentEnrollmentDto
        {
            StudentId = enrollment.StudentId,
            StudentName = student.FullName,
            ClassCourseId = enrollment.ClassCourseId,
            ClassCourseName = classCourse.Name,
            RollNumber = enrollment.RollNumber,
            ParentMobile = student.ParentMobile,
            PhoneNumber = student.PhoneNumber,
            IsActive = student.IsActive
        };
    }

    public async Task DeleteAsync(Guid studentId, Guid classCourseId, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        if (currentUserRole != nameof(UserRole.Admin)) throw new ForbiddenException("Only admins can manage enrollments.");

        await _enrollmentRepository.DeleteAsync(studentId, classCourseId, cancellationToken);
    }

    public async Task<StudentEnrollmentDto> PromoteStudentAsync(PromoteStudentDto input, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        if (currentUserRole != nameof(UserRole.Admin)) throw new ForbiddenException("Only admins can promote students.");

        var student = await _userRepository.GetByIdAsync(input.StudentId, cancellationToken) ?? throw new NotFoundException("Student not found.");
        var fromClass = await _classCourseRepository.GetByIdAsync(input.FromClassCourseId, cancellationToken) ?? throw new NotFoundException("Source class not found.");
        var toClass = await _classCourseRepository.GetByIdAsync(input.ToClassCourseId, cancellationToken) ?? throw new NotFoundException("Target class not found.");

        // Validate sequential class progression (next class only)
        await ValidateSequentialClassPromotionAsync(fromClass, toClass, cancellationToken);

        var existingTargetEnrollment = await _enrollmentRepository.GetAsync(input.StudentId, input.ToClassCourseId, cancellationToken);
        if (existingTargetEnrollment is not null)
        {
            throw new ValidationException("Student is already enrolled in the target class for this academic year.");
        }

        // Keep the previous academic-year enrollment intact for historical visibility.
        // A promotion creates a new enrollment instance for the target academic year.
        var newEnrollment = new StudentEnrollment(input.StudentId, input.ToClassCourseId, toClass.AcademicYearId, input.NewRollNumber);
        await _enrollmentRepository.AddAsync(newEnrollment, cancellationToken);

        return new StudentEnrollmentDto
        {
            StudentId = newEnrollment.StudentId,
            StudentName = student.FullName,
            ClassCourseId = newEnrollment.ClassCourseId,
            ClassCourseName = toClass.Name,
            RollNumber = newEnrollment.RollNumber,
            ParentMobile = student.ParentMobile,
            PhoneNumber = student.PhoneNumber,
            IsActive = student.IsActive
        };
    }

    public async Task<IReadOnlyList<StudentEnrollmentDto>> BulkPromoteStudentsAsync(BulkPromoteStudentsDto input, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        if (currentUserRole != nameof(UserRole.Admin)) throw new ForbiddenException("Only admins can promote students.");

        var toClass = await _classCourseRepository.GetByIdAsync(input.ToClassCourseId, cancellationToken) ?? throw new NotFoundException("Target class not found.");
        var fromClass = await _classCourseRepository.GetByIdAsync(input.FromClassCourseId, cancellationToken) ?? throw new NotFoundException("Source class not found.");

        // Validate sequential class progression once
        await ValidateSequentialClassPromotionAsync(fromClass, toClass, cancellationToken);

        // Support cross-year promotion by creating a new enrollment record for the target year.
        // The source-year enrollment remains untouched for back-and-forth historical visibility.
        var result = new List<StudentEnrollmentDto>();

        foreach (var studentItem in input.Students)
        {
            try
            {
                var promoted = await PromoteStudentAsync(
                    new PromoteStudentDto
                    {
                        StudentId = studentItem.StudentId,
                        FromClassCourseId = input.FromClassCourseId,
                        ToClassCourseId = input.ToClassCourseId,
                        NewRollNumber = studentItem.NewRollNumber
                    },
                    currentUserId,
                    currentUserRole,
                    cancellationToken);
                result.Add(promoted);
            }
            catch
            {
                // Continue with next student even if one fails
            }
        }

        return result;
    }

    private async Task ValidateSequentialClassPromotionAsync(ClassCourse fromClass, ClassCourse toClass, CancellationToken cancellationToken)
    {
        // Preserve the normal promotion flow for the active academic year and allow
        // class-to-class moves while the old year is still in use.
        // The year-transition guard should not block valid old-year promotions.

        // For now, we simply validate that the class levels are sequential by their names
        // Class 6 -> Class 7, Class 7 -> Class 8, etc.
        // Extract class level from name (e.g., "Class 6", "Grade 7")
        var fromLevel = ExtractClassLevel(fromClass.Name);
        var toLevel = ExtractClassLevel(toClass.Name);

        if (toLevel != fromLevel + 1)
            throw new ValidationException($"Students can only be promoted to the next class level. From {fromClass.Name} to the next class.");
    }

    private static int ExtractClassLevel(string className)
    {
        if (string.IsNullOrWhiteSpace(className))
            throw new ValidationException("Class name is required for promotion validation.");

        var digits = System.Text.RegularExpressions.Regex.Matches(className, @"\d+");
        if (digits.Count > 0 && int.TryParse(digits[0].Value, out var numericLevel))
            return numericLevel;

        var normalized = className.Trim();
        normalized = normalized.Replace("Class", "", StringComparison.OrdinalIgnoreCase).Trim();
        normalized = normalized.Replace("Grade", "", StringComparison.OrdinalIgnoreCase).Trim();

        if (int.TryParse(normalized, out var parsedLevel))
            return parsedLevel;

        return normalized.ToLowerInvariant() switch
        {
            "one" => 1,
            "two" => 2,
            "three" => 3,
            "four" => 4,
            "five" => 5,
            "six" => 6,
            "seven" => 7,
            "eight" => 8,
            "nine" => 9,
            "ten" => 10,
            "eleven" => 11,
            "twelve" => 12,
            _ => throw new ValidationException($"Cannot determine class level from name '{className}'. Use names like 'Class 6', 'Six', or 'Grade 7'.")
        };
    }
}
