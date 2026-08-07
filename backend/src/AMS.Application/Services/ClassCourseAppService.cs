using AMS.Application.Contracts;
using AMS.Application.Contracts.Dtos;
using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using AMS.Domain.Shared;

namespace AMS.Application.Services;

public class ClassCourseAppService : IClassCourseAppService
{
    private readonly IClassCourseRepository _classCourseRepository;
    private readonly ITeacherSubjectAssignmentRepository _teacherSubjectAssignmentRepository;

    public ClassCourseAppService(IClassCourseRepository classCourseRepository, ITeacherSubjectAssignmentRepository teacherSubjectAssignmentRepository)
    {
        _classCourseRepository = classCourseRepository;
        _teacherSubjectAssignmentRepository = teacherSubjectAssignmentRepository;
    }

    public async Task<IReadOnlyList<ClassCourseDto>> GetAllAsync(Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        if (currentUserRole == nameof(UserRole.Admin))
        {
            var classes = await _classCourseRepository.GetAllAsync(cancellationToken);
            return classes.Select(ToDto).ToList();
        }

        if (currentUserRole == nameof(UserRole.Teacher))
        {
            var assignments = await _teacherSubjectAssignmentRepository.GetByTeacherAsync(currentUserId, cancellationToken);
            var classIds = assignments.Select(x => x.ClassCourseId).Distinct().ToHashSet();
            var classes = await _classCourseRepository.GetAllAsync(cancellationToken);
            return classes.Where(x => classIds.Contains(x.Id)).Select(ToDto).ToList();
        }

        throw new ForbiddenException("Only admins and teachers can view classes.");
    }

    public async Task<ClassCourseDto?> GetByIdAsync(Guid id, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        var entity = await _classCourseRepository.GetByIdAsync(id, cancellationToken);
        if (entity is null) return null;

        if (currentUserRole == nameof(UserRole.Admin)) return ToDto(entity);
        if (currentUserRole == nameof(UserRole.Teacher))
        {
            var assignments = await _teacherSubjectAssignmentRepository.GetByTeacherAsync(currentUserId, cancellationToken);
            if (!assignments.Any(x => x.ClassCourseId == id)) throw new ForbiddenException("You are not assigned to this class.");
            return ToDto(entity);
        }

        throw new ForbiddenException("Only admins and teachers can view classes.");
    }

    public async Task<ClassCourseDto> CreateAsync(CreateClassCourseDto input, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        if (currentUserRole != nameof(UserRole.Admin)) throw new ForbiddenException("Only admins can manage classes.");
        var entity = new ClassCourse(Guid.NewGuid(), input.Name, input.Section, input.AcademicYear);
        await _classCourseRepository.AddAsync(entity, cancellationToken);
        return ToDto(entity);
    }

    public async Task<ClassCourseDto> UpdateAsync(Guid id, UpdateClassCourseDto input, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        if (currentUserRole != nameof(UserRole.Admin)) throw new ForbiddenException("Only admins can manage classes.");
        var entity = await _classCourseRepository.GetByIdAsync(id, cancellationToken) ?? throw new NotFoundException("Class not found.");
        var updated = new ClassCourse(entity.Id, input.Name ?? entity.Name, input.Section ?? entity.Section, input.AcademicYear ?? entity.AcademicYear);
        await _classCourseRepository.UpdateAsync(updated, cancellationToken);
        return ToDto(updated);
    }

    public async Task DeleteAsync(Guid id, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        if (currentUserRole != nameof(UserRole.Admin)) throw new ForbiddenException("Only admins can manage classes.");
        await _classCourseRepository.DeleteAsync(id, cancellationToken);
    }

    private static ClassCourseDto ToDto(ClassCourse entity) => new()
    {
        Id = entity.Id,
        Name = entity.Name,
        Section = entity.Section,
        AcademicYear = entity.AcademicYear
    };
}
