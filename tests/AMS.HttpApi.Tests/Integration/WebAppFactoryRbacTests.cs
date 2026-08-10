using System.Net;
using System.Net.Http.Headers;
using System.Security.Claims;
using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace AMS.HttpApi.Tests.Integration;

public class WebAppFactoryRbacTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public WebAppFactoryRbacTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Student_Cannot_Access_Others_Submission_Over_Http()
    {
        var submissionId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();
        var otherId = Guid.NewGuid();

        var submission = new Submission(submissionId, Guid.NewGuid(), ownerId, "", null, DateTime.UtcNow, false, AMS.Domain.Shared.SubmissionStatus.Submitted);

        var submissionRepo = new Mock<ISubmissionRepository>();
        submissionRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync((Guid id, CancellationToken _) => id == submissionId ? submission : null);

        var client = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureTestServices(services =>
            {
                services.AddSingleton<ISubmissionRepository>(submissionRepo.Object);
                services.AddSingleton<AMS.Application.Contracts.ICurrentUserService>(new TestCurrentUser(otherId, "Student"));

                services.AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = "Test";
                    options.DefaultChallengeScheme = "Test";
                })
                .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>("Test", _ => { });
            });
        }).CreateClient();

        var request = new HttpRequestMessage(HttpMethod.Get, $"/api/submissions/{submissionId}");
        request.Headers.Add("X-User-Id", otherId.ToString());
        request.Headers.Add("X-User-Role", "Student");

        var res = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.Forbidden, res.StatusCode);
    }

    [Fact]
    public async Task Teacher_Can_Access_Submission_Over_Http()
    {
        var submissionId = Guid.NewGuid();
        var assignmentId = Guid.NewGuid();
        var teacherId = Guid.NewGuid();

        var submission = new Submission(submissionId, assignmentId, Guid.NewGuid(), "", null, DateTime.UtcNow, false, AMS.Domain.Shared.SubmissionStatus.Submitted);
        var assignment = new Domain.Entities.Assignment(assignmentId, "t", "d", Guid.NewGuid(), Guid.NewGuid(), teacherId, DateTime.UtcNow.AddDays(1), 100, AMS.Domain.Shared.AssignmentStatus.Published, true, true, DateTime.UtcNow);

        var submissionRepo = new Mock<ISubmissionRepository>();
        submissionRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync((Guid id, CancellationToken _) => id == submissionId ? submission : null);
        var assignmentRepo = new Mock<IAssignmentRepository>();
        assignmentRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync((Guid id, CancellationToken _) => id == assignmentId ? assignment : null);

        var client = CreateTestClient(teacherId, "Teacher", services =>
        {
            services.AddSingleton<ISubmissionRepository>(submissionRepo.Object);
            services.AddSingleton<IAssignmentRepository>(assignmentRepo.Object);

            var userRepo = new Mock<AMS.Domain.Repositories.IUserRepository>();
            userRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync(new AMS.Domain.Entities.AppUser(Guid.NewGuid(), "Student Name", "s@example.com", "hash", AMS.Domain.Shared.UserRole.Student));
            services.AddSingleton<AMS.Domain.Repositories.IUserRepository>(userRepo.Object);

            var classCourseRepo = new Mock<AMS.Domain.Repositories.IClassCourseRepository>();
            classCourseRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync(new AMS.Domain.Entities.ClassCourse(assignment.ClassCourseId, "Class", "A", "2025"));
            services.AddSingleton<AMS.Domain.Repositories.IClassCourseRepository>(classCourseRepo.Object);
        });

        var request = new HttpRequestMessage(HttpMethod.Patch, $"/api/submissions/{submissionId}/grade");
        request.Headers.Add("X-User-Id", teacherId.ToString());
        request.Headers.Add("X-User-Role", "Teacher");
        request.Content = new StringContent(System.Text.Json.JsonSerializer.Serialize(new { marks = 10, feedback = "ok" }));
        request.Content.Headers.ContentType = new MediaTypeHeaderValue("application/json");

        var res = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
    }

    [Fact]
    public async Task Student_Can_Download_Own_Submission_Attachment_Over_Http()
    {
        var storedFileName = "submission_attachment.pdf";
        var ownerId = Guid.NewGuid();
        var assignmentId = Guid.NewGuid();
        var submissionId = Guid.NewGuid();
        var attachmentId = Guid.NewGuid();
        var attachment = new Attachment(attachmentId, "Submission", submissionId, "report.pdf", storedFileName, "application/pdf", 42, ownerId, DateTime.UtcNow);
        var submission = new Submission(submissionId, assignmentId, ownerId, "", null, DateTime.UtcNow, false, AMS.Domain.Shared.SubmissionStatus.Submitted);

        var attachmentRepo = new Mock<IAttachmentRepository>();
        attachmentRepo.Setup(r => r.GetByStoredFileNameAsync(It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync((string fileName, CancellationToken _) => fileName == storedFileName ? attachment : null);

        var submissionRepo = new Mock<ISubmissionRepository>();
        submissionRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync((Guid id, CancellationToken _) => id == submissionId ? submission : null);

        var fileAppService = new Mock<AMS.Application.Contracts.IFileAppService>();
        var fileBytes = new byte[] { 1, 2, 3, 4 };
        fileAppService.Setup(s => s.OpenFileAsync(storedFileName)).ReturnsAsync((Stream: new MemoryStream(fileBytes), OriginalFileName: attachment.OriginalFileName));

        var client = CreateTestClient(ownerId, "Student", services =>
        {
            services.AddSingleton<IAttachmentRepository>(attachmentRepo.Object);
            services.AddSingleton<ISubmissionRepository>(submissionRepo.Object);
            services.AddSingleton<AMS.Application.Contracts.IFileAppService>(fileAppService.Object);
        });

        var request = new HttpRequestMessage(HttpMethod.Get, $"/api/files/download/{storedFileName}");
        request.Headers.Add("X-User-Id", ownerId.ToString());
        request.Headers.Add("X-User-Role", "Student");

        var res = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var body = await res.Content.ReadAsByteArrayAsync();
        Assert.Equal(fileBytes, body);
        Assert.Equal("application/pdf", res.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task Student_Cannot_Download_Others_Submission_Attachment_Over_Http()
    {
        var storedFileName = "submission_attachment.pdf";
        var ownerId = Guid.NewGuid();
        var otherId = Guid.NewGuid();
        var assignmentId = Guid.NewGuid();
        var submissionId = Guid.NewGuid();
        var attachmentId = Guid.NewGuid();
        var attachment = new Attachment(attachmentId, "Submission", submissionId, "report.pdf", storedFileName, "application/pdf", 42, ownerId, DateTime.UtcNow);
        var submission = new Submission(submissionId, assignmentId, ownerId, "", null, DateTime.UtcNow, false, AMS.Domain.Shared.SubmissionStatus.Submitted);

        var attachmentRepo = new Mock<IAttachmentRepository>();
        attachmentRepo.Setup(r => r.GetByStoredFileNameAsync(It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync((string fileName, CancellationToken _) => fileName == storedFileName ? attachment : null);

        var submissionRepo = new Mock<ISubmissionRepository>();
        submissionRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync((Guid id, CancellationToken _) => id == submissionId ? submission : null);

        var client = CreateTestClient(otherId, "Student", services =>
        {
            services.AddSingleton<IAttachmentRepository>(attachmentRepo.Object);
            services.AddSingleton<ISubmissionRepository>(submissionRepo.Object);
        });

        var request = new HttpRequestMessage(HttpMethod.Get, $"/api/files/download/{storedFileName}");
        request.Headers.Add("X-User-Id", otherId.ToString());
        request.Headers.Add("X-User-Role", "Student");

        var res = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.Forbidden, res.StatusCode);
    }

    [Fact]
    public async Task Creating_Submission_With_Invalid_Request_Returns_ProblemDetails()
    {
        var studentId = Guid.NewGuid();

        var client = CreateTestClient(studentId, "Student", services => { });

        var request = new HttpRequestMessage(HttpMethod.Post, "/api/submissions");
        request.Headers.Add("X-User-Id", studentId.ToString());
        request.Headers.Add("X-User-Role", "Student");
        request.Content = new StringContent("{}", System.Text.Encoding.UTF8, "application/json");

        var res = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
        Assert.Equal("application/problem+json", res.Content.Headers.ContentType?.MediaType);

        var json = await res.Content.ReadAsStringAsync();
        using var doc = System.Text.Json.JsonDocument.Parse(json);
        Assert.True(doc.RootElement.TryGetProperty("title", out var title));
        Assert.Equal("One or more validation errors occurred.", title.GetString());
        Assert.True(doc.RootElement.TryGetProperty("errors", out _));
    }

    private HttpClient CreateTestClient(Guid userId, string role, Action<IServiceCollection> configureServices)
    {
        return _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureTestServices(services =>
            {
                configureServices(services);
                services.AddSingleton<AMS.Application.Contracts.ICurrentUserService>(new TestCurrentUser(userId, role));

                services.AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = "Test";
                    options.DefaultChallengeScheme = "Test";
                })
                .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>("Test", _ => { });
            });
        }).CreateClient();
    }

    private class TestAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
    {
#pragma warning disable CS0618
        public TestAuthHandler(IOptionsMonitor<AuthenticationSchemeOptions> options, ILoggerFactory logger, System.Text.Encodings.Web.UrlEncoder encoder, ISystemClock clock)
            : base(options, logger, encoder, clock)
        {
        }
#pragma warning restore CS0618

        protected override Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            var req = Request;
            if (!req.Headers.TryGetValue("X-User-Id", out var idValues) || !req.Headers.TryGetValue("X-User-Role", out var roleValues))
            {
                return Task.FromResult(AuthenticateResult.NoResult());
            }

            if (!Guid.TryParse(idValues.FirstOrDefault(), out var id)) return Task.FromResult(AuthenticateResult.NoResult());
            var role = roleValues.FirstOrDefault() ?? "Student";

            var claims = new[] { new Claim(ClaimTypes.NameIdentifier, id.ToString()), new Claim(ClaimTypes.Role, role) };
            var identity = new ClaimsIdentity(claims, "Test");
            var principal = new ClaimsPrincipal(identity);
            var ticket = new AuthenticationTicket(principal, Scheme.Name);
            return Task.FromResult(AuthenticateResult.Success(ticket));
        }
    }

    private class TestCurrentUser : AMS.Application.Contracts.ICurrentUserService
    {
        private readonly Guid _userId;
        private readonly string _role;

        public TestCurrentUser(Guid userId, string role)
        {
            _userId = userId;
            _role = role;
        }

        public Guid UserId => _userId;

        public string Role => _role;

        public bool IsInRole(string role) => string.Equals(role, _role, StringComparison.OrdinalIgnoreCase);
    }
}
