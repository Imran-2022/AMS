using AMS.Application.Contracts;
using AMS.Application.Contracts.Dtos;
using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using AMS.Domain.Shared;

namespace AMS.Application.Services;

public class SubjectAppService : ISubjectAppService
{
    private readonly ISubjectRepository _subjectRepository;
    private readonly ITeacherSubjectAssignmentRepository _teacherSubjectAssignmentRepository;
    private readonly IAcademicYearRepository _academicYearRepository;

    public SubjectAppService(
        ISubjectRepository subjectRepository,
        ITeacherSubjectAssignmentRepository teacherSubjectAssignmentRepository,
        IAcademicYearRepository academicYearRepository)
    {
        _subjectRepository = subjectRepository;
        _teacherSubjectAssignmentRepository = teacherSubjectAssignmentRepository;
        _academicYearRepository = academicYearRepository;
    }

    public async Task<IReadOnlyList<SubjectDto>> GetAllAsync(Guid currentUserId, string currentUserRole, bool includeAllAcademicYears = false, CancellationToken cancellationToken = default)
    {
        // Get active academic year
        var activeYear = await _academicYearRepository.GetActiveAsync(cancellationToken);
        if (activeYear == null) throw new NotFoundException("No active academic year found.");

        if (currentUserRole == nameof(UserRole.Admin))
        {
            IReadOnlyList<Subject> subjects;
            if (includeAllAcademicYears)
            {
                // Get all subjects from all years
                subjects = await _subjectRepository.GetAllAsync(cancellationToken) ?? new List<Subject>();
            }
            else
            {
                // Get only subjects from the active year
                subjects = await _subjectRepository.GetByAcademicYearAsync(activeYear.Id, cancellationToken);
            }
            return subjects.Select(ToDto).ToList();
        }

        if (currentUserRole == nameof(UserRole.Teacher))
        {
            var assigned = await _teacherSubjectAssignmentRepository.GetByTeacherAsync(currentUserId, cancellationToken);
            var subjectIds = assigned.Select(x => x.SubjectId).Distinct().ToHashSet();
            
            IReadOnlyList<Subject> subjects;
            if (includeAllAcademicYears)
            {
                subjects = await _subjectRepository.GetAllAsync(cancellationToken) ?? new List<Subject>();
            }
            else
            {
                subjects = await _subjectRepository.GetByAcademicYearAsync(activeYear.Id, cancellationToken);
            }
            return subjects.Where(x => subjectIds.Contains(x.Id)).Select(ToDto).ToList();
        }

        throw new ForbiddenException("Only admins and teachers can view subjects.");
    }

    public async Task<SubjectDto?> GetByIdAsync(Guid id, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        var entity = await _subjectRepository.GetByIdAsync(id, cancellationToken);
        if (entity is null) return null;

        if (currentUserRole == nameof(UserRole.Admin)) return ToDto(entity);
        if (currentUserRole == nameof(UserRole.Teacher))
        {
            var assigned = await _teacherSubjectAssignmentRepository.GetByTeacherAsync(currentUserId, cancellationToken);
            if (!assigned.Any(x => x.SubjectId == id)) throw new ForbiddenException("You are not assigned to this subject.");
            return ToDto(entity);
        }

        throw new ForbiddenException("Only admins and teachers can view subjects.");
    }

    public async Task<SubjectDto> CreateAsync(CreateSubjectDto input, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        if (currentUserRole != nameof(UserRole.Admin)) throw new ForbiddenException("Only admins can manage subjects.");
        var entity = new Subject(Guid.NewGuid(), input.Name, input.Code, input.ClassCourseId);
        await _subjectRepository.AddAsync(entity, cancellationToken);
        return ToDto(entity);
    }

    public async Task<SubjectDto> UpdateAsync(Guid id, UpdateSubjectDto input, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        if (currentUserRole != nameof(UserRole.Admin)) throw new ForbiddenException("Only admins can manage subjects.");
        var entity = await _subjectRepository.GetByIdAsync(id, cancellationToken) ?? throw new NotFoundException("Subject not found.");
        entity.Update(input.Name, input.Code, input.ClassCourseId);
        await _subjectRepository.UpdateAsync(entity, cancellationToken);
        return ToDto(entity);
    }

    public async Task DeleteAsync(Guid id, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        if (currentUserRole != nameof(UserRole.Admin)) throw new ForbiddenException("Only admins can manage subjects.");
        await _subjectRepository.DeleteAsync(id, cancellationToken);
    }

    private static SubjectDto ToDto(Subject entity) => new()
    {
        Id = entity.Id,
        Name = entity.Name,
        Code = entity.Code,
        ClassCourseId = entity.ClassCourseId
    };
}
