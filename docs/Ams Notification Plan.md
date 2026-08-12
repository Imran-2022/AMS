You are adding an in-app notification system to an ABP-style .NET + Next.js solution (AMS).
Local Postgres can be migrated fresh; no production data to preserve.
 
BACKEND
 
1. Add two entities under AMS.Domain/Entities/Notifications/:
   - Notification: Id (Guid, PK), RecipientUserId (Guid, FK -> User, cascade delete),
     Type (NotificationType enum), Title (string, max 200), Message (string, max 500),
     RelatedEntityType (string, nullable, max 20 - "Assignment" or "Submission"),
     RelatedEntityId (Guid, nullable), IsRead (bool, default false), CreatedAt (timestamptz,
     default now()). Add an index on (RecipientUserId, IsRead) for the common "unread for
     this user" query, and an index on RecipientUserId alone for the paged history query.
   - NotificationPreference: UserId (Guid, FK -> User, cascade delete) + NotificationType as
     a composite primary key, IsEnabled (bool, not null).
   Add NotificationType enum to AMS.Domain.Shared/Enums.cs with values: AssignmentPublished,
   SubmissionReceived, SubmissionGraded, ResubmissionRequested.
 
2. Add EF Core configurations for both entities under
   AMS.EntityFrameworkCore/Configurations/Notifications/, following the existing snake_case
   column naming convention used elsewhere in this project (e.g. NotificationConfiguration.cs,
   NotificationPreferenceConfiguration.cs). Register both DbSets on AmsDbContext.
 
3. Add INotificationRepository / NotificationRepository and
   INotificationPreferenceRepository / NotificationPreferenceRepository under
   AMS.Domain/Repositories and AMS.EntityFrameworkCore/Repositories, following the pattern of
   the existing repositories in this project (e.g. ISubmissionRepository).
 
4. Add an INotificationAppService / NotificationAppService under AMS.Application/Notifications/
   with methods:
   - GetMyNotificationsAsync(Guid userId, int page, int pageSize) -> paged list, newest first.
   - GetUnreadCountAsync(Guid userId) -> int.
   - MarkAsReadAsync(Guid notificationId, Guid userId) -> throws/403s if the notification
     doesn't belong to that user.
   - MarkAllAsReadAsync(Guid userId).
   - GetPreferencesAsync(Guid userId) -> for every NotificationType, return
     { type, isEnabled } (default true if no NotificationPreference row exists for that type).
   - UpdatePreferenceAsync(Guid userId, NotificationType type, bool isEnabled) -> upsert.
   Add matching DTOs under AMS.Application.Contracts/Dtos (NotificationDto,
   NotificationPreferenceDto).
 
5. Add a private helper (e.g. a scoped INotificationService in AMS.Application/Notifications/,
   injected wherever needed) with methods NotifyAssignmentPublishedAsync(Assignment assignment),
   NotifySubmissionReceivedAsync(Submission submission, Assignment assignment),
   NotifySubmissionGradedAsync(Submission submission, Assignment assignment),
   NotifyResubmissionRequestedAsync(Submission submission, Assignment assignment).
   Each method must check NotificationPreference before inserting a Notification row (skip
   silently if the recipient has explicitly disabled that NotificationType).
   Wire these into:
   - AssignmentAppService.PublishAsync: after assignment.Publish() succeeds, look up every
     StudentEnrollment with IsActive = true for assignment's ClassCourseId and call
     NotifyAssignmentPublishedAsync for each enrolled student.
   - SubmissionAppService.CreateAsync: after a submission is successfully created, call
     NotifySubmissionReceivedAsync for the assignment's TeacherId.
   - SubmissionAppService.GradeAsync: after marks are saved, call
     NotifySubmissionGradedAsync for the submission's StudentId.
   - SubmissionAppService.UpdateStatusAsync: when the new status is ResubmissionRequested,
     call NotifyResubmissionRequestedAsync for the submission's StudentId.
   These notification calls must not throw and block the primary operation - wrap them so a
   notification failure never causes the assignment publish / submission / grading action
   itself to fail.
 
6. Add a NotificationsController under AMS.HttpApi/Controllers/Notifications/ with:
   - GET  /api/notifications?page=&pageSize=   (current user's notifications, newest first)
   - GET  /api/notifications/unread-count
   - POST /api/notifications/{id}/read
   - POST /api/notifications/read-all
   - GET  /api/notifications/preferences
   - PUT  /api/notifications/preferences/{type}   body: { isEnabled: boolean }
   All endpoints require authentication and operate only on the current user's own data
   (derive the user id from the auth token the same way the existing controllers do, e.g.
   SubmissionsController). Add a NotificationsControllerTests.cs test file under
   tests/AMS.HttpApi.Tests/ covering: unread count is correct, marking as read updates
   IsRead, a user cannot mark another user's notification as read, and toggling a preference
   off stops future notifications of that type from being created (this last one can call the
   application service directly rather than going through an HTTP round trip).
 
7. Add a fresh EF Core migration for the two new tables and update
   AMS.DbMigrator/Program.cs / the Seeders folder to seed a handful of sample Notification
   rows (mix of read/unread, all four types) for the already-seeded users, so the UI has data
   to demo without manually triggering every workflow.
 
FRONTEND
 
8. Add lib/api/notifications.ts (matching the existing pattern in lib/api/submissions.ts -
   thin wrappers around the shared `request` helper from lib/api.ts):
   - getNotifications(page, pageSize)
   - getUnreadNotificationCount()
   - markNotificationRead(id)
   - markAllNotificationsRead()
   - getNotificationPreferences()
   - updateNotificationPreference(type, isEnabled)
 
9. In shared/layout/AppShell.tsx, replace the hardcoded bell badge (currently
   `<span ...>3</span>` inside the Topbar function) with a real implementation:
   - Poll getUnreadNotificationCount() every 30 seconds (and once on mount) and show the real
     number; hide the badge entirely when the count is 0 instead of showing "0".
   - Clicking the bell opens a dropdown panel listing the most recent ~10 notifications
     (title, message, relative time, unread items visually distinct e.g. a dot or bold text).
     Clicking a notification calls markNotificationRead(id), updates local state, and
     navigates to the related assignment/submission page using RelatedEntityType/RelatedEntityId
     (assignments -> /roles/{role}/assignments/{id}, submissions -> /roles/{role}/submissions/{id}).
   - Include a "Mark all as read" action in the dropdown.
   - Follow the existing visual style already used in this file (Tailwind classes, color
     tokens like #1F2430, #8A8F98, #7C3AED already used elsewhere in AppShell.tsx).
 
10. In components/account/AccountSettingsPage.tsx, replace the local-only `toggles` state
    for the Notifications tab with real data:
    - On mount (or when activeTab becomes 'notifications'), call getNotificationPreferences()
      and initialize toggle state from the response instead of from the notificationItems prop.
    - When a toggle is flipped, call updateNotificationPreference(type, isEnabled)
      immediately (optimistic update, revert on failure with a toast via the existing
      emitToast helper already used in this file).
    - Replace the per-role hardcoded notificationItems arrays in
      app/roles/teacher/settings/page.tsx, app/roles/student/settings/page.tsx (and add one
      to app/roles/admin/settings/page.tsx if that page doesn't already have a notifications
      tab) with a single shared list derived from the NotificationType enum, with role-
      appropriate labels/descriptions (e.g. AssignmentPublished only makes sense to show on
      the Student settings page, SubmissionReceived only on Teacher, SubmissionGraded and
      ResubmissionRequested only on Student). Keep the existing visual styling of this tab -
      only change where the data comes from.
 
Do not change authentication, routing, or any unrelated controllers. Ask me before touching
AMS.HttpApi.Host if the new controller requires any startup/DI registration changes beyond
what's already conventionally done for the existing controllers in this project.