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

    public StudentEnrollmentAppService(
        IStudentEnrollmentRepository enrollmentRepository,
        IUserRepository userRepository,
        IClassCourseRepository classCourseRepository,
        ITeacherSubjectAssignmentRepository teacherSubjectAssignmentRepository)
    {
        _enrollmentRepository = enrollmentRepository;
        _userRepository = userRepository;
        _classCourseRepository = classCourseRepository;
        _teacherSubjectAssignmentRepository = teacherSubjectAssignmentRepository;
    }

    public async Task<IReadOnlyList<StudentEnrollmentDto>> GetAllAsync(Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        var enrollments = currentUserRole switch
        {
            nameof(UserRole.Admin) => await _enrollmentRepository.GetAllAsync(cancellationToken),
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
                ClassCourseName = classCourse.Name
            });
        }

        return result;
    }

    private async Task<IReadOnlyList<Domain.Entities.StudentEnrollment>> LoadTeacherEnrollmentsAsync(Guid teacherId, CancellationToken cancellationToken)
    {
        var assignments = await _teacherSubjectAssignmentRepository.GetByTeacherAsync(teacherId, cancellationToken);
        var classIds = assignments.Select(a => a.ClassCourseId).Distinct().ToList();
        var enrollments = new List<Domain.Entities.StudentEnrollment>();

        foreach (var classId in classIds)
        {
            var classEnrollments = await _enrollmentRepository.GetByClassCourseAsync(classId, cancellationToken);
            enrollments.AddRange(classEnrollments);
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

        var enrollment = new StudentEnrollment(input.StudentId, input.ClassCourseId);
        await _enrollmentRepository.AddAsync(enrollment, cancellationToken);

        return new StudentEnrollmentDto
        {
            StudentId = enrollment.StudentId,
            StudentName = student.FullName,
            ClassCourseId = enrollment.ClassCourseId,
            ClassCourseName = classCourse.Name
        };
    }

    public async Task DeleteAsync(Guid studentId, Guid classCourseId, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        if (currentUserRole != nameof(UserRole.Admin)) throw new ForbiddenException("Only admins can manage enrollments.");

        await _enrollmentRepository.DeleteAsync(studentId, classCourseId, cancellationToken);
    }
}
