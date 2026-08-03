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

    public StudentEnrollmentAppService(
        IStudentEnrollmentRepository enrollmentRepository,
        IUserRepository userRepository,
        IClassCourseRepository classCourseRepository)
    {
        _enrollmentRepository = enrollmentRepository;
        _userRepository = userRepository;
        _classCourseRepository = classCourseRepository;
    }

    public async Task<IReadOnlyList<StudentEnrollmentDto>> GetAllAsync(Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        if (currentUserRole != nameof(UserRole.Admin)) throw new ForbiddenException("Only admins can manage enrollments.");

        var enrollments = await _enrollmentRepository.GetAllAsync(cancellationToken);
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
