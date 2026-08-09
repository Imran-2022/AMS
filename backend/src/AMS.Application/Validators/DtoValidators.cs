using AMS.Application.Contracts.Dtos;
using FluentValidation;

namespace AMS.Application.Validators;

public class CreateSubmissionDtoValidator : AbstractValidator<CreateSubmissionDto>
{
    public CreateSubmissionDtoValidator()
    {
        RuleFor(x => x.AssignmentId).NotEmpty();
        RuleFor(x => x.ContentText)
            .MaximumLength(5000)
            .When(x => !string.IsNullOrWhiteSpace(x.ContentText));

        RuleFor(x => x)
            .Must(x => !string.IsNullOrWhiteSpace(x.ContentText) || !string.IsNullOrWhiteSpace(x.FileUrl))
            .WithMessage("Submission must include content text or a file URL.");
    }
}

public class UpdateSubmissionDtoValidator : AbstractValidator<UpdateSubmissionDto>
{
    public UpdateSubmissionDtoValidator()
    {
        RuleFor(x => x.ContentText)
            .MaximumLength(5000)
            .When(x => !string.IsNullOrWhiteSpace(x.ContentText));

        RuleFor(x => x.FileName)
            .MaximumLength(255)
            .When(x => !string.IsNullOrWhiteSpace(x.FileName));
    }
}

public class GradeSubmissionDtoValidator : AbstractValidator<GradeSubmissionDto>
{
    public GradeSubmissionDtoValidator()
    {
        RuleFor(x => x.Marks).GreaterThanOrEqualTo(0);
        RuleFor(x => x.Feedback)
            .MaximumLength(2000)
            .When(x => !string.IsNullOrWhiteSpace(x.Feedback));
    }
}

public class CreateUserDtoValidator : AbstractValidator<CreateUserDto>
{
    public CreateUserDtoValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(200);
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8);
        RuleFor(x => x.Role).NotEmpty();
        RuleFor(x => x.Gender)
            .Must(g => string.IsNullOrWhiteSpace(g) || g.Equals("male", StringComparison.OrdinalIgnoreCase) || g.Equals("female", StringComparison.OrdinalIgnoreCase))
            .WithMessage("Gender must be Male or Female when provided.");
        RuleFor(x => x.StudentId)
            .MaximumLength(50)
            .When(x => !string.IsNullOrWhiteSpace(x.StudentId));
    }
}

public class UpdateUserDtoValidator : AbstractValidator<UpdateUserDto>
{
    public UpdateUserDtoValidator()
    {
        RuleFor(x => x.Email)
            .EmailAddress()
            .When(x => !string.IsNullOrWhiteSpace(x.Email));

        RuleFor(x => x.Password)
            .MinimumLength(8)
            .When(x => !string.IsNullOrWhiteSpace(x.Password));

        RuleFor(x => x.Gender)
            .Must(g => string.IsNullOrWhiteSpace(g) || g.Equals("male", StringComparison.OrdinalIgnoreCase) || g.Equals("female", StringComparison.OrdinalIgnoreCase))
            .WithMessage("Gender must be Male or Female when provided.");
    }
}

public class CreateAssignmentDtoValidator : AbstractValidator<CreateAssignmentDto>
{
    public CreateAssignmentDtoValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).NotEmpty().MaximumLength(2000);
        RuleFor(x => x.ClassCourseId).NotEmpty();
        RuleFor(x => x.SubjectId).NotEmpty();
        RuleFor(x => x.MaxMarks).GreaterThan(0);
        RuleFor(x => x.Deadline).GreaterThan(DateTime.UtcNow.AddMinutes(-1)).WithMessage("Deadline must be in the future.");
    }
}

public class UpdateAssignmentDtoValidator : AbstractValidator<UpdateAssignmentDto>
{
    public UpdateAssignmentDtoValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty()
            .When(x => x.Title is not null)
            .MaximumLength(200);

        RuleFor(x => x.Description)
            .NotEmpty()
            .When(x => x.Description is not null)
            .MaximumLength(2000);

        RuleFor(x => x.MaxMarks)
            .GreaterThan(0)
            .When(x => x.MaxMarks.HasValue);

        RuleFor(x => x.Deadline)
            .GreaterThan(DateTime.UtcNow.AddMinutes(-1))
            .When(x => x.Deadline.HasValue)
            .WithMessage("Deadline must be in the future.");
    }
}

public class CreateSubjectDtoValidator : AbstractValidator<CreateSubjectDto>
{
    public CreateSubjectDtoValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Code).NotEmpty().MaximumLength(50);
        RuleFor(x => x.ClassCourseId).NotEmpty();
    }
}

public class UpdateSubjectDtoValidator : AbstractValidator<UpdateSubjectDto>
{
    public UpdateSubjectDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .When(x => x.Name is not null)
            .MaximumLength(200);

        RuleFor(x => x.Code)
            .NotEmpty()
            .When(x => x.Code is not null)
            .MaximumLength(50);
    }
}

public class CreateClassCourseDtoValidator : AbstractValidator<CreateClassCourseDto>
{
    public CreateClassCourseDtoValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Section).NotEmpty().MaximumLength(50);
        RuleFor(x => x.AcademicYear).NotEmpty().MaximumLength(50);
    }
}

public class UpdateClassCourseDtoValidator : AbstractValidator<UpdateClassCourseDto>
{
    public UpdateClassCourseDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .When(x => x.Name is not null)
            .MaximumLength(200);

        RuleFor(x => x.Section)
            .NotEmpty()
            .When(x => x.Section is not null)
            .MaximumLength(50);

        RuleFor(x => x.AcademicYear)
            .NotEmpty()
            .When(x => x.AcademicYear is not null)
            .MaximumLength(50);
    }
}

public class CreateStudentEnrollmentDtoValidator : AbstractValidator<CreateStudentEnrollmentDto>
{
    public CreateStudentEnrollmentDtoValidator()
    {
        RuleFor(x => x.StudentId).NotEmpty();
        RuleFor(x => x.ClassCourseId).NotEmpty();
    }
}

public class CreateTeacherSubjectAssignmentDtoValidator : AbstractValidator<CreateTeacherSubjectAssignmentDto>
{
    public CreateTeacherSubjectAssignmentDtoValidator()
    {
        RuleFor(x => x.TeacherId).NotEmpty();
        RuleFor(x => x.ClassCourseId).NotEmpty();
        RuleFor(x => x.SubjectId).NotEmpty();
    }
}
