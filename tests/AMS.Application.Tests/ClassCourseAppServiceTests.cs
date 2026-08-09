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
        var service = new ClassCourseAppService(repo, new FakeTeacherAssignmentRepository(), new FakeClassDefinitionRepository(Array.Empty<ClassDefinition>()));

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

    [Fact]
    public async Task CreateAsync_Should_Throw_When_Group_Is_Required_For_Higher_Secondary_Classes()
    {
        var repo = new FakeClassCourseRepository(Array.Empty<ClassCourse>());
        var classDefinition = new ClassDefinition(Guid.NewGuid(), "Nine");
        var service = new ClassCourseAppService(repo, new FakeTeacherAssignmentRepository(), new FakeClassDefinitionRepository(new[] { classDefinition }));

        var ex = await Assert.ThrowsAsync<DomainException>(() => service.CreateAsync(new CreateClassCourseDto
        {
            Name = "Nine",
            Section = "A",
            AcademicYear = "2026 – 2027",
            ClassDefinitionId = classDefinition.Id,
            GroupId = null
        }, Guid.NewGuid(), nameof(UserRole.Admin)));

        Assert.Contains("select a group", ex.Message);
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

    private sealed class FakeClassDefinitionRepository : IClassDefinitionRepository
    {
        private readonly IReadOnlyList<ClassDefinition> _definitions;

        public FakeClassDefinitionRepository(IEnumerable<ClassDefinition> definitions)
        {
            _definitions = definitions.ToList();
        }

        public Task<ClassDefinition?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
            => Task.FromResult(_definitions.FirstOrDefault(x => x.Id == id));

        public Task<IReadOnlyList<ClassDefinition>> GetAllAsync(CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<ClassDefinition>>(_definitions.ToList());

        public Task AddAsync(ClassDefinition classDefinition, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task UpdateAsync(ClassDefinition classDefinition, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task DeleteAsync(Guid id, CancellationToken cancellationToken = default) => Task.CompletedTask;
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
