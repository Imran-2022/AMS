using AMS.Application.Contracts;
using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using AMS.Domain.Shared;

namespace AMS.Application.Services;

public class AcademicYearAppService : IAcademicYearAppService
{
    private readonly IAcademicYearRepository _academicYearRepository;
    private readonly IClassCourseRepository _classCourseRepository;
    private readonly IClassDefinitionRepository _classDefinitionRepository;
    private readonly IGroupRepository _groupRepository;

    public AcademicYearAppService(
        IAcademicYearRepository academicYearRepository,
        IClassCourseRepository classCourseRepository,
        IClassDefinitionRepository classDefinitionRepository,
        IGroupRepository groupRepository)
    {
        _academicYearRepository = academicYearRepository;
        _classCourseRepository = classCourseRepository;
        _classDefinitionRepository = classDefinitionRepository;
        _groupRepository = groupRepository;
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

        var activeYear = input.IsActive ? await _academicYearRepository.GetActiveAsync(cancellationToken) : null;
        var year = new AcademicYear(Guid.NewGuid(), input.Name, input.StartDate, input.EndDate, input.IsActive);

        if (activeYear is not null && activeYear.Id != year.Id)
        {
            activeYear.Deactivate();
            await _academicYearRepository.UpdateAsync(activeYear, cancellationToken);
        }

        await _academicYearRepository.AddAsync(year, cancellationToken);
        return ToDto(year);
    }

    public async Task<AcademicYearDto> ActivateAsync(Guid id, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        if (currentUserRole != nameof(UserRole.Admin))
            throw new ForbiddenException("Only admins can activate academic years.");

        var year = await _academicYearRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Academic year not found.");

        var activeYear = await _academicYearRepository.GetActiveAsync(cancellationToken);
        if (activeYear is not null && activeYear.Id != year.Id)
        {
            activeYear.Deactivate();
            await _academicYearRepository.UpdateAsync(activeYear, cancellationToken);
        }

        year.Activate();
        await _academicYearRepository.UpdateAsync(year, cancellationToken);
        
        // Auto-seed classes for the newly activated year if they don't exist
        await EnsureClassesExistForYearAsync(year.Id, cancellationToken);
        
        return ToDto(year);
    }

    private async Task EnsureClassesExistForYearAsync(Guid academicYearId, CancellationToken cancellationToken)
    {
        var classDefs = await _classDefinitionRepository.GetAllAsync(cancellationToken);
        var existingCourses = await _classCourseRepository.GetAllAsync(cancellationToken);
        
        // If either is null, skip seeding (e.g., in tests with incomplete mocks)
        if (classDefs is null || existingCourses is null) return;
        
        var lowerClasses = new[] { "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight" };
        var higherClasses = new[] { "Nine", "Ten", "Eleven", "Twelve" };
        var sectionGroupMap = new[] { ("A", "Science"), ("B", "Arts"), ("C", "Commerce") };

        bool AlreadyExists(Guid classDefinitionId, Guid? groupId, string section)
            => existingCourses.Any(c =>
                c.ClassDefinitionId == classDefinitionId &&
                c.AcademicYearId == academicYearId &&
                c.GroupId == groupId &&
                string.Equals(c.Section, section, StringComparison.OrdinalIgnoreCase));

        // Seed Classes One..Eight: single section "A", no group
        foreach (var def in classDefs.Where(d => lowerClasses.Contains(d.Name)))
        {
            if (AlreadyExists(def.Id, null, "A")) continue;
            var course = new ClassCourse(Guid.NewGuid(), def.Name, "A", academicYearId, def.Id, null);
            await _classCourseRepository.AddAsync(course, cancellationToken);
        }

        // Seed Classes Nine..Twelve: 3 sections, each paired with a group
        foreach (var def in classDefs.Where(d => higherClasses.Contains(d.Name)))
        {
            var groups = await _groupRepository.GetByClassDefinitionAsync(def.Id, cancellationToken);
            if (groups is null) continue;
            
            foreach (var (section, groupName) in sectionGroupMap)
            {
                var group = groups.FirstOrDefault(g => string.Equals(g.Name, groupName, StringComparison.OrdinalIgnoreCase));
                if (group is null) continue;
                if (AlreadyExists(def.Id, group.Id, section)) continue;
                
                var course = new ClassCourse(Guid.NewGuid(), def.Name, section, academicYearId, def.Id, group.Id);
                await _classCourseRepository.AddAsync(course, cancellationToken);
            }
        }
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
