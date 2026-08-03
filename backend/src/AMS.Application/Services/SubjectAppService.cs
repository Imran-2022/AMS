using AMS.Application.Contracts;
using AMS.Application.Contracts.Dtos;
using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using AMS.Domain.Shared;

namespace AMS.Application.Services;

public class SubjectAppService : ISubjectAppService
{
    private readonly ISubjectRepository _subjectRepository;

    public SubjectAppService(ISubjectRepository subjectRepository)
    {
        _subjectRepository = subjectRepository;
    }

    public async Task<IReadOnlyList<SubjectDto>> GetAllAsync(Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        if (currentUserRole != nameof(UserRole.Admin)) throw new ForbiddenException("Only admins can manage subjects.");
        var subjects = await _subjectRepository.GetAllAsync(cancellationToken);
        return subjects.Select(ToDto).ToList();
    }

    public async Task<SubjectDto?> GetByIdAsync(Guid id, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        if (currentUserRole != nameof(UserRole.Admin)) throw new ForbiddenException("Only admins can manage subjects.");
        var entity = await _subjectRepository.GetByIdAsync(id, cancellationToken);
        return entity is null ? null : ToDto(entity);
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
        var updated = new Subject(entity.Id, input.Name ?? entity.Name, input.Code ?? entity.Code, input.ClassCourseId ?? entity.ClassCourseId);
        await _subjectRepository.UpdateAsync(updated, cancellationToken);
        return ToDto(updated);
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
