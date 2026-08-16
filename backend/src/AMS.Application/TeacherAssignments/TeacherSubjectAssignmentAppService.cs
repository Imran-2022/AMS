using AMS.Application.Contracts;
using AMS.Application.Contracts.Dtos;
using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using AMS.Domain.Shared;

namespace AMS.Application.Services;

public class TeacherSubjectAssignmentAppService : ITeacherSubjectAssignmentAppService
{
    private readonly ITeacherSubjectAssignmentRepository _assignmentRepository;
    private readonly IUserRepository _userRepository;
    private readonly ISubjectRepository _subjectRepository;
    private readonly IClassCourseRepository _classCourseRepository;
    private readonly IAcademicYearRepository _academicYearRepository;

    public TeacherSubjectAssignmentAppService(
        ITeacherSubjectAssignmentRepository assignmentRepository,
        IUserRepository userRepository,
        ISubjectRepository subjectRepository,
        IClassCourseRepository classCourseRepository,
        IAcademicYearRepository academicYearRepository)
    {
        _assignmentRepository = assignmentRepository;
        _userRepository = userRepository;
        _subjectRepository = subjectRepository;
        _classCourseRepository = classCourseRepository;
        _academicYearRepository = academicYearRepository;
    }

    public async Task<IReadOnlyList<TeacherSubjectAssignmentDto>> GetAllAsync(Guid currentUserId, string currentUserRole, bool includeAllAcademicYears = false, CancellationToken cancellationToken = default)
    {
        var assignments = currentUserRole switch
        {
            nameof(UserRole.Admin) => await _assignmentRepository.GetAllAsync(cancellationToken),
            nameof(UserRole.Teacher) => await _assignmentRepository.GetByTeacherAsync(currentUserId, cancellationToken),
            _ => throw new ForbiddenException("Only admins and teachers can view teacher assignments.")
        };

        var activeYear = await _academicYearRepository.GetActiveAsync(cancellationToken);
        var filteredAssignments = new List<TeacherSubjectAssignment>();

        foreach (var assignment in assignments)
        {
            var subject = await _subjectRepository.GetByIdAsync(assignment.SubjectId, cancellationToken);
            if (subject is null) continue;

            var classCourse = await _classCourseRepository.GetByIdAsync(subject.ClassCourseId, cancellationToken);
            if (classCourse is null) continue;

            // If includeAllAcademicYears is true, include all years; otherwise only include active year
            if (includeAllAcademicYears || activeYear is null || classCourse.AcademicYearId == activeYear.Id)
            {
                filteredAssignments.Add(assignment);
            }
        }

        var result = new List<TeacherSubjectAssignmentDto>();
        var teacherCache = new Dictionary<Guid, User>();

        foreach (var assignment in filteredAssignments)
        {
            if (!teacherCache.TryGetValue(assignment.TeacherId, out var teacher))
            {
                teacher = await _userRepository.GetByIdAsync(assignment.TeacherId, cancellationToken) ?? throw new NotFoundException("Teacher not found.");
                teacherCache[assignment.TeacherId] = teacher;
            }

            var subject = await _subjectRepository.GetByIdAsync(assignment.SubjectId, cancellationToken) ?? throw new NotFoundException("Subject not found.");
            var classCourse = await _classCourseRepository.GetByIdAsync(subject.ClassCourseId, cancellationToken) ?? throw new NotFoundException("Class/course not found.");

            result.Add(new TeacherSubjectAssignmentDto
            {
                TeacherId = assignment.TeacherId,
                TeacherName = teacher.FullName,
                SubjectId = assignment.SubjectId,
                SubjectName = subject.Name,
                ClassCourseId = subject.ClassCourseId,
                ClassCourseName = classCourse.Name
            });
        }

        return result;
    }

    public async Task<TeacherSubjectAssignmentDto> CreateAsync(CreateTeacherSubjectAssignmentDto input, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        if (currentUserRole != nameof(UserRole.Admin)) throw new ForbiddenException("Only admins can manage teacher assignments.");

        var teacher = await _userRepository.GetByIdAsync(input.TeacherId, cancellationToken) ?? throw new NotFoundException("Teacher not found.");
        if (teacher.Role != UserRole.Teacher) throw new ValidationException("Selected user is not a teacher.");

        var classCourse = await _classCourseRepository.GetByIdAsync(input.ClassCourseId, cancellationToken) ?? throw new NotFoundException("Class/course not found.");
        var subject = await _subjectRepository.GetByIdAsync(input.SubjectId, cancellationToken) ?? throw new NotFoundException("Subject not found.");
        if (subject.ClassCourseId != input.ClassCourseId) throw new ValidationException("Selected subject does not belong to the chosen class.");

        var assignment = new TeacherSubjectAssignment(input.TeacherId, input.SubjectId);
        await _assignmentRepository.AddAsync(assignment, cancellationToken);

        return new TeacherSubjectAssignmentDto
        {
            TeacherId = assignment.TeacherId,
            TeacherName = teacher.FullName,
            SubjectId = assignment.SubjectId,
            SubjectName = subject.Name,
            ClassCourseId = subject.ClassCourseId,
            ClassCourseName = classCourse.Name
        };
    }

    public async Task DeleteAsync(Guid teacherId, Guid subjectId, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        if (currentUserRole != nameof(UserRole.Admin)) throw new ForbiddenException("Only admins can manage teacher assignments.");

        await _assignmentRepository.DeleteAsync(teacherId, subjectId, cancellationToken);
    }

    public async Task<TeacherSubjectAssignmentDto> ReassignTeacherAsync(ReassignTeacherDto input, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        if (currentUserRole != nameof(UserRole.Admin)) throw new ForbiddenException("Only admins can reassign teachers.");

        var teacher = await _userRepository.GetByIdAsync(input.TeacherId, cancellationToken) ?? throw new NotFoundException("Teacher not found.");
        var toSubject = await _subjectRepository.GetByIdAsync(input.ToSubjectId, cancellationToken) ?? throw new NotFoundException("Target subject not found.");
        var toClass = await _classCourseRepository.GetByIdAsync(toSubject.ClassCourseId, cancellationToken) ?? throw new NotFoundException("Target class not found.");

        // Delete old assignment
        await _assignmentRepository.DeleteAsync(input.TeacherId, input.FromSubjectId, cancellationToken);

        // Create new assignment
        var newAssignment = new TeacherSubjectAssignment(input.TeacherId, input.ToSubjectId);
        await _assignmentRepository.AddAsync(newAssignment, cancellationToken);

        return new TeacherSubjectAssignmentDto
        {
            TeacherId = newAssignment.TeacherId,
            TeacherName = teacher.FullName,
            SubjectId = newAssignment.SubjectId,
            SubjectName = toSubject.Name,
            ClassCourseId = toSubject.ClassCourseId,
            ClassCourseName = toClass.Name
        };
    }

    public async Task<IReadOnlyList<TeacherSubjectAssignmentDto>> BulkReassignTeachersAsync(BulkReassignTeachersDto input, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        if (currentUserRole != nameof(UserRole.Admin)) throw new ForbiddenException("Only admins can reassign teachers.");

        var toSubject = await _subjectRepository.GetByIdAsync(input.ToSubjectId, cancellationToken) ?? throw new NotFoundException("Target subject not found.");
        var result = new List<TeacherSubjectAssignmentDto>();

        foreach (var teacherId in input.TeacherIds)
        {
            try
            {
                var reassigned = await ReassignTeacherAsync(
                    new ReassignTeacherDto
                    {
                        TeacherId = teacherId,
                        FromSubjectId = input.FromSubjectId,
                        ToSubjectId = input.ToSubjectId
                    },
                    currentUserId,
                    currentUserRole,
                    cancellationToken);
                result.Add(reassigned);
            }
            catch
            {
                // Continue with next teacher even if one fails
            }
        }

        return result;
    }
}
