using AMS.Application.Contracts.Dtos;
using AMS.Application.Services;
using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using AMS.Domain.Shared;
using Xunit;

namespace AMS.Application.Tests;

public class ClassCourseAppServiceTests
{
    [Fact]
    public async Task CreateAsync_Should_Throw_When_Duplicate_Class_Exists()
    {
        var repo = new FakeClassCourseRepository(new[]
        {
            new ClassCourse(Guid.NewGuid(), "Grade 10", "A", "2026 – 2027", Guid.NewGuid(), Guid.NewGuid())
        });
        var service = new ClassCourseAppService(repo, new FakeTeacherAssignmentRepository());

        var ex = await Assert.ThrowsAsync<DomainException>(() => service.CreateAsync(new CreateClassCourseDto
        {
            Name = "Grade 10",
            Section = "A",
            AcademicYear = "2026 – 2027",
            ClassDefinitionId = repo.Classes[0].ClassDefinitionId,
            GroupId = repo.Classes[0].GroupId
        }, Guid.NewGuid(), nameof(UserRole.Admin)));

        Assert.Contains("same academic year", ex.Message);
    }

    private sealed class FakeClassCourseRepository : IClassCourseRepository
    {
        public FakeClassCourseRepository(IEnumerable<ClassCourse> classes)
        {
            Classes = classes.ToList();
        }

        public List<ClassCourse> Classes { get; }

        public Task AddAsync(ClassCourse classCourse, CancellationToken cancellationToken = default)
        {
            Classes.Add(classCourse);
            return Task.CompletedTask;
        }

        public Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
        {
            Classes.RemoveAll(c => c.Id == id);
            return Task.CompletedTask;
        }

        public Task<IReadOnlyList<ClassCourse>> GetAllAsync(CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<ClassCourse>>(Classes);

        public Task<ClassCourse?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
            => Task.FromResult(Classes.FirstOrDefault(c => c.Id == id));

        public Task UpdateAsync(ClassCourse classCourse, CancellationToken cancellationToken = default)
        {
            var index = Classes.FindIndex(c => c.Id == classCourse.Id);
            if (index >= 0) Classes[index] = classCourse;
            return Task.CompletedTask;
        }
    }

    private sealed class FakeTeacherAssignmentRepository : ITeacherSubjectAssignmentRepository
    {
        public Task<TeacherSubjectAssignment?> GetAsync(Guid teacherId, Guid subjectId, CancellationToken cancellationToken = default)
            => Task.FromResult<TeacherSubjectAssignment?>(null);
        public Task AddAsync(TeacherSubjectAssignment assignment, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task DeleteAsync(Guid teacherId, Guid subjectId, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task<IReadOnlyList<TeacherSubjectAssignment>> GetAllAsync(CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<TeacherSubjectAssignment>>(Array.Empty<TeacherSubjectAssignment>());
        public Task<IReadOnlyList<TeacherSubjectAssignment>> GetByTeacherAsync(Guid teacherId, CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<TeacherSubjectAssignment>>(Array.Empty<TeacherSubjectAssignment>());
        public Task<IReadOnlyList<TeacherSubjectAssignment>> GetBySubjectAsync(Guid subjectId, CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<TeacherSubjectAssignment>>(Array.Empty<TeacherSubjectAssignment>());
    }
}
