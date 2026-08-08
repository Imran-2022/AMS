using AMS.Application.Contracts;
using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using AMS.Domain.Shared;

namespace AMS.Application.Services;

public class AcademicYearAppService : IAcademicYearAppService
{
    private readonly IAcademicYearRepository _academicYearRepository;

    public AcademicYearAppService(IAcademicYearRepository academicYearRepository)
    {
        _academicYearRepository = academicYearRepository;
    }

    public async Task<IReadOnlyList<AcademicYearDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var years = await _academicYearRepository.GetAllAsync(cancellationToken);
        return years.Select(ToDto).ToList();
    }

    public async Task<AcademicYearDto?> GetActiveAsync(CancellationToken cancellationToken = default)
    {
        var year = await _academicYearRepository.GetActiveAsync(cancellationToken);
        return year is null ? null : ToDto(year);
    }

    public async Task<AcademicYearDto> CreateAsync(CreateAcademicYearDto input, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        if (currentUserRole != nameof(UserRole.Admin))
            throw new ForbiddenException("Only admins can create academic years.");

        var year = new AcademicYear(Guid.NewGuid(), input.Name, input.StartDate, input.EndDate, input.IsActive);
        await _academicYearRepository.AddAsync(year, cancellationToken);
        return ToDto(year);
    }

    public async Task<AcademicYearDto> ActivateAsync(Guid id, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        if (currentUserRole != nameof(UserRole.Admin))
            throw new ForbiddenException("Only admins can activate academic years.");

        var year = await _academicYearRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Academic year not found.");

        year.Activate();
        await _academicYearRepository.UpdateAsync(year, cancellationToken);
        return ToDto(year);
    }

    private static AcademicYearDto ToDto(AcademicYear year) => new()
    {
        Id = year.Id,
        Name = year.Name,
        StartDate = year.StartDate,
        EndDate = year.EndDate,
        IsActive = year.IsActive
    };
}

public interface IAcademicYearAppService
{
    Task<IReadOnlyList<AcademicYearDto>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<AcademicYearDto?> GetActiveAsync(CancellationToken cancellationToken = default);
    Task<AcademicYearDto> CreateAsync(CreateAcademicYearDto input, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default);
    Task<AcademicYearDto> ActivateAsync(Guid id, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default);
}

public class AcademicYearDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsActive { get; set; }
}

public class CreateAcademicYearDto
{
    public string Name { get; set; } = null!;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsActive { get; set; }
}
