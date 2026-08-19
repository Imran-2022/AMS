using AMS.Application.Services;
using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using AMS.Domain.Shared;
using Moq;
using Xunit;

namespace AMS.Application.Tests;

public class SubjectAppServiceTests
{
    [Fact]
    public async Task GetAllAsync_AsAdmin_ReturnsAllSubjects()
    {
        var subjects = new List<Subject>
        {
            new Subject(Guid.NewGuid(), "Mathematics", "MATH101", Guid.NewGuid())
        };

        var subjectRepo = new Mock<ISubjectRepository>(MockBehavior.Strict);
        subjectRepo.Setup(r => r.GetByAcademicYearAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync(subjects);
        subjectRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(subjects);
        var assignmentRepo = new Mock<ITeacherSubjectAssignmentRepository>(MockBehavior.Strict);

        var academicYearRepo = new Mock<IAcademicYearRepository>(MockBehavior.Strict);
        academicYearRepo.Setup(r => r.GetActiveAsync(It.IsAny<CancellationToken>())).ReturnsAsync(new AcademicYear(Guid.NewGuid(), "2026-2027", DateTime.UtcNow, DateTime.UtcNow.AddYears(1), true));

        var service = new SubjectAppService(subjectRepo.Object, assignmentRepo.Object, academicYearRepo.Object);

        var result = await service.GetAllAsync(Guid.NewGuid(), nameof(UserRole.Admin));

        Assert.Single(result);
        Assert.Equal(subjects[0].Name, result[0].Name);
    }

    [Fact]
    public async Task GetAllAsync_AsAdmin_WithIncludeAllAcademicYears_DoesNotRequireActiveYear()
    {
        var subjects = new List<Subject>
        {
            new Subject(Guid.NewGuid(), "Mathematics", "MATH101", Guid.NewGuid()),
            new Subject(Guid.NewGuid(), "History", "HIST101", Guid.NewGuid())
        };

        var subjectRepo = new Mock<ISubjectRepository>(MockBehavior.Strict);
        subjectRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(subjects);

        var assignmentRepo = new Mock<ITeacherSubjectAssignmentRepository>(MockBehavior.Strict);
        var academicYearRepo = new Mock<IAcademicYearRepository>(MockBehavior.Strict);
        academicYearRepo.Setup(r => r.GetActiveAsync(It.IsAny<CancellationToken>())).ReturnsAsync((AcademicYear?)null);

        var service = new SubjectAppService(subjectRepo.Object, assignmentRepo.Object, academicYearRepo.Object);

        var result = await service.GetAllAsync(Guid.NewGuid(), nameof(UserRole.Admin), includeAllAcademicYears: true);

        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task GetAllAsync_AsTeacher_Returns_AssignedSubjectsOnly()
    {
        var teacherId = Guid.NewGuid();
        var subjectId = Guid.NewGuid();
        var subjects = new List<Subject>
        {
            new Subject(subjectId, "History", "HIST101", Guid.NewGuid()),
            new Subject(Guid.NewGuid(), "Physics", "PHYS101", Guid.NewGuid())
        };

        var subjectRepo = new Mock<ISubjectRepository>(MockBehavior.Strict);
        subjectRepo.Setup(r => r.GetByAcademicYearAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync(subjects);
        subjectRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(subjects);

        var assignmentRepo = new Mock<ITeacherSubjectAssignmentRepository>(MockBehavior.Strict);
        assignmentRepo.Setup(r => r.GetByTeacherAsync(teacherId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[] { new TeacherSubjectAssignment(teacherId, subjectId) });

        var academicYearRepo = new Mock<IAcademicYearRepository>(MockBehavior.Strict);
        academicYearRepo.Setup(r => r.GetActiveAsync(It.IsAny<CancellationToken>())).ReturnsAsync(new AcademicYear(Guid.NewGuid(), "2026-2027", DateTime.UtcNow, DateTime.UtcNow.AddYears(1), true));

        var service = new SubjectAppService(subjectRepo.Object, assignmentRepo.Object, academicYearRepo.Object);

        var result = await service.GetAllAsync(teacherId, nameof(UserRole.Teacher));

        Assert.Single(result);
        Assert.Equal(subjectId, result[0].Id);
    }

    [Fact]
    public async Task GetByIdAsync_AsTeacher_Throws_When_Not_Assigned()
    {
        var teacherId = Guid.NewGuid();
        var subjectId = Guid.NewGuid();
        var subject = new Subject(subjectId, "Biology", "BIO101", Guid.NewGuid());

        var subjectRepo = new Mock<ISubjectRepository>(MockBehavior.Strict);
        subjectRepo.Setup(r => r.GetByIdAsync(subjectId, It.IsAny<CancellationToken>())).ReturnsAsync(subject);

        var assignmentRepo = new Mock<ITeacherSubjectAssignmentRepository>(MockBehavior.Strict);
        assignmentRepo.Setup(r => r.GetByTeacherAsync(teacherId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<TeacherSubjectAssignment>());

        var academicYearRepo = new Mock<IAcademicYearRepository>(MockBehavior.Strict);
        academicYearRepo.Setup(r => r.GetActiveAsync(It.IsAny<CancellationToken>())).ReturnsAsync((AcademicYear?)null);

        var service = new SubjectAppService(subjectRepo.Object, assignmentRepo.Object, academicYearRepo.Object);

        await Assert.ThrowsAsync<ForbiddenException>(() => service.GetByIdAsync(subjectId, teacherId, nameof(UserRole.Teacher)));
    }

    [Fact]
    public async Task CreateAsync_Should_Throw_When_Not_Admin()
    {
        var subjectRepo = new Mock<ISubjectRepository>(MockBehavior.Strict);
        var assignmentRepo = new Mock<ITeacherSubjectAssignmentRepository>(MockBehavior.Strict);
        var academicYearRepo = new Mock<IAcademicYearRepository>(MockBehavior.Strict);
        academicYearRepo.Setup(r => r.GetActiveAsync(It.IsAny<CancellationToken>())).ReturnsAsync((AcademicYear?)null);

        var service = new SubjectAppService(subjectRepo.Object, assignmentRepo.Object, academicYearRepo.Object);

        await Assert.ThrowsAsync<ForbiddenException>(() => service.CreateAsync(new AMS.Application.Contracts.Dtos.CreateSubjectDto
        {
            Name = "French",
            Code = "FREN101",
            ClassCourseId = Guid.NewGuid()
        }, Guid.NewGuid(), nameof(UserRole.Teacher)));
    }
}
