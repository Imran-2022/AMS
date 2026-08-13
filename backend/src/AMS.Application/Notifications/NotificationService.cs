using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using AMS.Domain.Shared;

namespace AMS.Application.Services;

public interface INotificationService
{
    Task NotifyAssignmentPublishedAsync(Assignment assignment, CancellationToken cancellationToken = default);
    Task NotifySubmissionReceivedAsync(Submission submission, Assignment assignment, CancellationToken cancellationToken = default);
    Task NotifySubmissionGradedAsync(Submission submission, Assignment assignment, CancellationToken cancellationToken = default);
    Task NotifyResubmissionRequestedAsync(Submission submission, Assignment assignment, CancellationToken cancellationToken = default);
    Task NotifySubmissionResubmittedAsync(Submission submission, Assignment assignment, CancellationToken cancellationToken = default);
    Task NotifySubmissionResubmissionGradedAsync(Submission submission, Assignment assignment, CancellationToken cancellationToken = default);
}

public class NotificationService : INotificationService
{
    private readonly INotificationRepository _notificationRepository;
    private readonly INotificationPreferenceRepository _notificationPreferenceRepository;
    private readonly IStudentEnrollmentRepository _studentEnrollmentRepository;
    private readonly IUserRepository _userRepository;
    private readonly ISubjectRepository _subjectRepository;

    public NotificationService(
        INotificationRepository notificationRepository,
        INotificationPreferenceRepository notificationPreferenceRepository,
        IStudentEnrollmentRepository studentEnrollmentRepository,
        IUserRepository userRepository,
        ISubjectRepository subjectRepository)
    {
        _notificationRepository = notificationRepository;
        _notificationPreferenceRepository = notificationPreferenceRepository;
        _studentEnrollmentRepository = studentEnrollmentRepository;
        _userRepository = userRepository;
        _subjectRepository = subjectRepository;
    }

    public async Task NotifyAssignmentPublishedAsync(Assignment assignment, CancellationToken cancellationToken = default)
    {
        var subject = await _subjectRepository.GetByIdAsync(assignment.SubjectId, cancellationToken);
        if (subject is null) return;

        var enrollments = await _studentEnrollmentRepository.GetByClassCourseAsync(subject.ClassCourseId, cancellationToken);
        foreach (var enrollment in enrollments.Where(x => x.IsActive))
        {
            await CreateIfEnabledAsync(
                enrollment.StudentId,
                NotificationType.AssignmentPublished,
                "Assignment published",
                $"The assignment '{assignment.Title}' has been published.",
                "Assignment",
                assignment.Id,
                cancellationToken);
        }
    }

    public async Task NotifySubmissionReceivedAsync(Submission submission, Assignment assignment, CancellationToken cancellationToken = default)
    {
        await CreateIfEnabledAsync(
            assignment.TeacherId,
            NotificationType.SubmissionReceived,
            "Submission received",
            $"A new submission was received for '{assignment.Title}'.",
            "Submission",
            submission.Id,
            cancellationToken);
    }

    public async Task NotifySubmissionGradedAsync(Submission submission, Assignment assignment, CancellationToken cancellationToken = default)
    {
        await CreateIfEnabledAsync(
            submission.StudentId,
            NotificationType.SubmissionGraded,
            "Submission graded",
            $"Your submission for '{assignment.Title}' has been graded.",
            "Submission",
            submission.Id,
            cancellationToken);
    }

    public async Task NotifyResubmissionRequestedAsync(Submission submission, Assignment assignment, CancellationToken cancellationToken = default)
    {
        await CreateIfEnabledAsync(
            submission.StudentId,
            NotificationType.ResubmissionRequested,
            "Resubmission requested",
            $"The teacher has requested a resubmission for '{assignment.Title}'.",
            "Submission",
            submission.Id,
            cancellationToken);
    }

    public async Task NotifySubmissionResubmittedAsync(Submission submission, Assignment assignment, CancellationToken cancellationToken = default)
    {
        await CreateIfEnabledAsync(
            assignment.TeacherId,
            NotificationType.SubmissionResubmitted,
            "Submission resubmitted",
            $"A student has resubmitted work for '{assignment.Title}'.",
            "Submission",
            submission.Id,
            cancellationToken);
    }

    public async Task NotifySubmissionResubmissionGradedAsync(Submission submission, Assignment assignment, CancellationToken cancellationToken = default)
    {
        await CreateIfEnabledAsync(
            submission.StudentId,
            NotificationType.SubmissionResubmissionGraded,
            "Resubmission graded",
            $"Your resubmission for '{assignment.Title}' has been graded.",
            "Submission",
            submission.Id,
            cancellationToken);
    }

    private async Task<bool> IsEnabledAsync(Guid userId, NotificationType type, CancellationToken cancellationToken = default)
    {
        var preference = await _notificationPreferenceRepository.GetAsync(userId, type, cancellationToken);
        return preference?.IsEnabled ?? true;
    }

    private async Task CreateIfEnabledAsync(Guid userId, NotificationType type, string title, string message, string relatedEntityType, Guid relatedEntityId, CancellationToken cancellationToken)
    {
        if (userId == Guid.Empty) return;
        if (!await IsEnabledAsync(userId, type, cancellationToken)) return;

        var existingUser = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (existingUser is null) return;

        var notification = new Notification(Guid.NewGuid(), userId, type, title, message, relatedEntityType, relatedEntityId);
        await _notificationRepository.AddAsync(notification, cancellationToken);
    }
}
