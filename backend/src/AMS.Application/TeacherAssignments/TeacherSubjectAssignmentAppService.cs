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

    public TeacherSubjectAssignmentAppService(
        ITeacherSubjectAssignmentRepository assignmentRepository,
        IUserRepository userRepository,
        ISubjectRepository subjectRepository,
        IClassCourseRepository classCourseRepository)
    {
        _assignmentRepository = assignmentRepository;
        _userRepository = userRepository;
        _subjectRepository = subjectRepository;
        _classCourseRepository = classCourseRepository;
    }

    public async Task<IReadOnlyList<TeacherSubjectAssignmentDto>> GetAllAsync(Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        var assignments = currentUserRole switch
        {
            nameof(UserRole.Admin) => await _assignmentRepository.GetAllAsync(cancellationToken),
            nameof(UserRole.Teacher) => await _assignmentRepository.GetByTeacherAsync(currentUserId, cancellationToken),
            _ => throw new ForbiddenException("Only admins and teachers can view teacher assignments.")
        };

        var result = new List<TeacherSubjectAssignmentDto>();
        var teacherCache = new Dictionary<Guid, User>();

        foreach (var assignment in assignments)
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
}
