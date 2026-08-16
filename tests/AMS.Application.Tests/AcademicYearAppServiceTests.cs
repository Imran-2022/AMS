using AMS.Application.Services;
using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using AMS.Domain.Shared;
using Xunit;

namespace AMS.Application.Tests;

public class AcademicYearAppServiceTests
{
    [Fact]
    public async Task CreateAsync_Should_Deactivate_Previous_Active_Year_When_New_One_Is_Activated()
    {
        var previousYear = new AcademicYear(Guid.NewGuid(), "2025-2026", new DateTime(2025, 9, 1, 0, 0, 0, DateTimeKind.Utc), new DateTime(2026, 8, 31, 23, 59, 59, DateTimeKind.Utc), isActive: true);
        var repository = new FakeAcademicYearRepository(previousYear);
        var service = new AcademicYearAppService(
            repository,
            Moq.Mock.Of<IClassCourseRepository>(),
            Moq.Mock.Of<IClassDefinitionRepository>(),
            Moq.Mock.Of<IGroupRepository>());

        var created = await service.CreateAsync(
            new CreateAcademicYearDto
            {
                Name = "2026-2027",
                StartDate = new DateTime(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc),
                EndDate = new DateTime(2027, 8, 31, 23, 59, 59, DateTimeKind.Utc),
                IsActive = true
            },
            Guid.NewGuid(),
            nameof(UserRole.Admin));

        Assert.True(created.IsActive);
        Assert.False(previousYear.IsActive);
        Assert.Contains(repository.Years, x => x.Id == created.Id && x.IsActive);
    }

    [Fact]
    public async Task ActivateAsync_Should_Deactivate_Previous_Active_Year_When_Another_Year_Is_Activated()
    {
        var previousYear = new AcademicYear(Guid.NewGuid(), "2025-2026", new DateTime(2025, 9, 1, 0, 0, 0, DateTimeKind.Utc), new DateTime(2026, 8, 31, 23, 59, 59, DateTimeKind.Utc), isActive: true);
        var nextYear = new AcademicYear(Guid.NewGuid(), "2026-2027", new DateTime(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc), new DateTime(2027, 8, 31, 23, 59, 59, DateTimeKind.Utc), isActive: false);
        var repository = new FakeAcademicYearRepository(previousYear, nextYear);
        var service = new AcademicYearAppService(
            repository,
            Moq.Mock.Of<IClassCourseRepository>(),
            Moq.Mock.Of<IClassDefinitionRepository>(),
            Moq.Mock.Of<IGroupRepository>());

        var activated = await service.ActivateAsync(
            nextYear.Id,
            Guid.NewGuid(),
            nameof(UserRole.Admin));

        Assert.True(activated.IsActive);
        Assert.False(previousYear.IsActive);
        Assert.True(nextYear.IsActive);
        Assert.Contains(repository.Years, x => x.Id == nextYear.Id && x.IsActive);
    }

    private sealed class FakeAcademicYearRepository : IAcademicYearRepository
    {
        public FakeAcademicYearRepository(params AcademicYear[] years)
        {
            Years = years.ToList();
        }

        public List<AcademicYear> Years { get; }

        public Task AddAsync(AcademicYear academicYear, CancellationToken cancellationToken = default)
        {
            Years.Add(academicYear);
            return Task.CompletedTask;
        }

        public Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
        {
            Years.RemoveAll(x => x.Id == id);
            return Task.CompletedTask;
        }

        public Task<IReadOnlyList<AcademicYear>> GetAllAsync(CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<AcademicYear>>(Years);

        public Task<AcademicYear?> GetActiveAsync(CancellationToken cancellationToken = default)
            => Task.FromResult(Years.FirstOrDefault(x => x.IsActive));

        public Task<AcademicYear?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
            => Task.FromResult(Years.FirstOrDefault(x => x.Id == id));

        public Task UpdateAsync(AcademicYear academicYear, CancellationToken cancellationToken = default)
        {
            var index = Years.FindIndex(x => x.Id == academicYear.Id);
            if (index >= 0)
            {
                Years[index] = academicYear;
            }

            if (academicYear.IsActive)
            {
                foreach (var year in Years.Where(x => x.Id != academicYear.Id && x.IsActive))
                {
                    year.Deactivate();
                }
            }

            return Task.CompletedTask;
        }
    }
}
