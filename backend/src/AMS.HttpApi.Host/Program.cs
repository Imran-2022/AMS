using AMS.Application;
using AMS.Application.Contracts;
using AMS.Application.Services;
using AMS.Domain.Repositories;
using AMS.EntityFrameworkCore;
using AMS.EntityFrameworkCore.Repositories;
using AMS.Infrastructure.Auth;
using AMS.Infrastructure.Files;
using AppValidationException = AMS.Application.ValidationException;
using FluentValidation;
using FluentValidation.AspNetCore;
using Hellang.Middleware.ProblemDetails;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Microsoft.Extensions.FileProviders;
using System.Security.Claims;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<AMS.Application.Validators.CreateSubmissionDtoValidator>();

builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var problemDetails = new ValidationProblemDetails(context.ModelState)
        {
            Title = "One or more validation errors occurred.",
            Status = StatusCodes.Status400BadRequest
        };

        return new BadRequestObjectResult(problemDetails)
        {
            ContentTypes = { "application/problem+json", "application/problem+xml" }
        };
    };
});

builder.Services.AddProblemDetails(options =>
{
    options.Map<AppValidationException>(ex => new ValidationProblemDetails(new Dictionary<string, string[]>
    {
        { "ValidationError", new[] { ex.Message } }
    })
    {
        Title = "Validation failed",
        Detail = ex.Message,
        Status = StatusCodes.Status400BadRequest
    });

    options.Map<FluentValidation.ValidationException>(ex => new ValidationProblemDetails(ex.Errors.GroupBy(e => e.PropertyName)
        .ToDictionary(g => string.IsNullOrEmpty(g.Key) ? "ValidationError" : g.Key,
            g => g.Select(e => e.ErrorMessage).ToArray()))
    {
        Title = "Validation failed",
        Detail = "One or more validation errors occurred.",
        Status = StatusCodes.Status400BadRequest
    });

    options.Map<ForbiddenException>(ex => new ProblemDetails
    {
        Title = "Forbidden",
        Detail = ex.Message,
        Status = StatusCodes.Status403Forbidden
    });

    options.Map<NotFoundException>(ex => new ProblemDetails
    {
        Title = "Not Found",
        Detail = ex.Message,
        Status = StatusCodes.Status404NotFound
    });

    options.Map<Exception>(ex => new ProblemDetails
    {
        Title = "An unexpected error occurred.",
        Detail = builder.Environment.IsDevelopment() ? ex.Message : "An unexpected error occurred.",
        Status = StatusCodes.Status500InternalServerError
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter 'Bearer {token}' to authenticate."
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            new string[] {}
        }
    });
});

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? "Host=localhost;Port=5432;Database=amsdb1;Username=postgres;Password=root";
builder.Services.AddDbContext<AmsDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddScoped<IAcademicYearRepository, AcademicYearRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IClassCourseRepository, ClassCourseRepository>();
builder.Services.AddScoped<IClassDefinitionRepository, ClassDefinitionRepository>();
builder.Services.AddScoped<IGroupRepository, GroupRepository>();
builder.Services.AddScoped<ISubjectRepository, SubjectRepository>();
builder.Services.AddScoped<IAssignmentRepository, AssignmentRepository>();
builder.Services.AddScoped<ISubmissionRepository, SubmissionRepository>();
builder.Services.AddScoped<ITeacherSubjectAssignmentRepository, TeacherSubjectAssignmentRepository>();
builder.Services.AddScoped<IStudentEnrollmentRepository, StudentEnrollmentRepository>();
builder.Services.AddScoped<IAttachmentRepository, AttachmentRepository>();
builder.Services.AddScoped<INotificationRepository, NotificationRepository>();
builder.Services.AddScoped<INotificationPreferenceRepository, NotificationPreferenceRepository>();

builder.Services.AddScoped<IAcademicYearAppService, AcademicYearAppService>();
builder.Services.AddScoped<IAuthAppService, AuthAppService>();
builder.Services.AddScoped<IUserAppService, UserAppService>();
builder.Services.AddScoped<IClassCourseAppService, ClassCourseAppService>();
builder.Services.AddScoped<ISubjectAppService, SubjectAppService>();
builder.Services.AddScoped<IAssignmentAppService, AssignmentAppService>();
builder.Services.AddScoped<ISubmissionAppService, SubmissionAppService>();
builder.Services.AddScoped<ITeacherSubjectAssignmentAppService, TeacherSubjectAssignmentAppService>();
builder.Services.AddScoped<IEnrollmentAppService, StudentEnrollmentAppService>();
builder.Services.AddScoped<IDashboardAppService, DashboardAppService>();
builder.Services.AddScoped<IFileAppService, FileAppService>();
builder.Services.AddScoped<IAttachmentAppService, AttachmentAppService>();
builder.Services.AddScoped<INotificationAppService, NotificationAppService>();
builder.Services.AddScoped<INotificationService, NotificationService>();

// Current user access
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserAccessor>();
builder.Services.AddScoped<ICurrentUserAccessor, CurrentUserAccessor>();

builder.Services.AddScoped<IFileStorageService, LocalFileStorageService>();

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    var jwtKey = builder.Configuration["Jwt:Key"];
    var jwtIssuer = builder.Configuration["Jwt:Issuer"];
    var jwtAudience = builder.Configuration["Jwt:Audience"];

    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey ?? string.Empty)),
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(AmsPermissions.ManageUsers, policy => policy.RequireRole(AmsPermissions.Admin));
    options.AddPolicy(AmsPermissions.ManageClasses, policy => policy.RequireRole(AmsPermissions.Admin, AmsPermissions.Teacher));
    options.AddPolicy(AmsPermissions.ManageSubjects, policy => policy.RequireRole(AmsPermissions.Admin, AmsPermissions.Teacher));
    options.AddPolicy(AmsPermissions.ManageAssignments, policy => policy.RequireRole(AmsPermissions.Admin, AmsPermissions.Teacher));
    options.AddPolicy(AmsPermissions.ManageSubmissions, policy => policy.RequireRole(AmsPermissions.Admin, AmsPermissions.Teacher, AmsPermissions.Student));

    // Convenience policies
    options.AddPolicy("StudentsOnly", p => p.RequireRole(AmsPermissions.Student));
    options.AddPolicy("TeachersOrAdmins", p => p.RequireRole(AmsPermissions.Teacher, AmsPermissions.Admin));
    options.AddPolicy("AdminsOnly", p => p.RequireRole(AmsPermissions.Admin));
});

builder.Services.AddCors(options =>
{
    var frontendUrl = builder.Configuration["FrontendUrl"] ?? "http://localhost:3000";
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(frontendUrl)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Register authorization handlers
builder.Services.AddScoped<IAuthorizationHandler, AMS.Application.Authorization.SubmissionAuthorizationHandler>();
builder.Services.AddScoped<IAuthorizationHandler, AMS.Application.Authorization.AttachmentAuthorizationHandler>();

var app = builder.Build();

app.UseProblemDetails();

// Serve uploaded files publicly from /uploads (maps to App_Data/Uploads)
var _uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "App_Data", "Uploads");
Directory.CreateDirectory(_uploadsPath);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(_uploadsPath),
    RequestPath = "/uploads"
});

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseHttpsRedirection();
}

app.UseCors();
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
// Root: redirect to API health endpoint so '/' returns useful JSON in production
app.MapGet("/", () => Results.Redirect("/api/health"));
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));

app.Run();
