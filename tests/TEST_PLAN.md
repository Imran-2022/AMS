# AMS Test Plan

This test plan covers the backend feature surface visible in `backend/src` and the existing `tests` projects.

## Goals
- Cover every app service feature with happy path and failure cases.
- Validate all role-based access patterns.
- Exercise controller behavior and API result shaping.
- Add domain-level boundary and invariants tests.
- Document broad coverage for each feature area.

---

## 1. Authentication / Authorization

### AuthAppService
- Login with invalid email -> returns null.
- Login with wrong password -> returns null.
- Login with correct password -> returns user.
- Change password with invalid current password -> throws.
- Change password with valid current password -> updates hash.
- Update profile with valid inputs -> returns updated user.
- Refresh token with invalid token -> fails / returns null or unauthorized.

### AuthController
- `POST /auth/login` invalid credentials -> `UnauthorizedResult`.
- `POST /auth/login` valid credentials -> `OkObjectResult` with token and refresh token.
- `POST /auth/refresh` valid refresh -> `OkObjectResult` with new tokens.
- `POST /auth/refresh` invalid refresh -> `UnauthorizedResult`.
- `GET /auth/me` authenticated user -> `OkObjectResult` with user data.
- `GET /auth/me` unauthenticated user -> `UnauthorizedResult`.
- `PUT /auth/profile` updates full name / parent mobile -> returns updated user.
- `PUT /auth/profile` unauthenticated -> `UnauthorizedResult`.
- `PUT /auth/change-password` success -> `NoContentResult`.
- `PUT /auth/change-password` invalid password -> failure result.

### RBAC Integration
- Student cannot access admin-only endpoints.
- Teacher cannot access admin-only endpoints.
- Anonymous cannot access protected endpoints.
- Admin can access all protected controller actions.

---

## 2. Users

### UserAppService
- Create admin/teacher/student with valid data -> success.
- Create user with duplicate email -> throws.
- Update existing user -> returns updated values.
- Update non-existing user -> throws / returns null error.
- Toggle active status -> updates `IsActive`.
- Get all users as admin returns full list.
- Get by id with mismatched role -> denied if role restrictions exist.

### UsersController
- `GET /users` returns list.
- `GET /users/{id}` returns user.
- `POST /users` creates user.
- `PUT /users/{id}` updates user.
- `POST /users/{id}/toggle-status` changes active flag.
- Unauthorized roles cannot hit admin-only user endpoints.

---

## 3. Class Courses and Academic Years

### AcademicYearAppService
- `GetAllAsync` returns all academic years.
- `GetActiveAsync` returns active year.
- `CreateAsync` with valid data returns year.
- `CreateAsync` duplicate year -> throws.
- `ActivateAsync` existing id sets active and deactivates others.
- `ActivateAsync` invalid id -> throws.

### ClassCourseAppService
- `GetAllAsync` returns courses.
- `GetByIdAsync` returns specific course.
- `CreateAsync` valid course -> success.
- `CreateAsync` duplicate class in same year/section -> throws.
- `CreateAsync` requires group for higher secondary -> throws.
- `UpdateAsync` valid update -> success.
- `UpdateAsync` duplicate update -> throws.
- `DeleteAsync` valid delete -> success.
- `DeleteAsync` invalid id -> throws.

### Controllers
- `GET /academic-years` works.
- `POST /academic-years` works and activates if requested.
- `GET /class-courses` returns courses.
- `GET /class-courses/{id}` returns course.
- `POST /class-courses` creates course.
- `PUT /class-courses/{id}` updates.
- `DELETE /class-courses/{id}` deletes.

---

## 4. Subjects and Teacher Assignments

### SubjectAppService
- `GetAllAsync` returns subjects.
- `GetByIdAsync` returns subject.
- `CreateAsync` valid subject -> success.
- `CreateAsync` duplicate code in same class -> throws.
- `UpdateAsync` modifies subject -> success.
- `UpdateAsync` duplicate conflict -> throws.
- `DeleteAsync` removes subject.

### TeacherSubjectAssignmentAppService
- `GetAllAsync` returns assignments.
- `GetByTeacherAsync` returns teacher-specific assignments.
- `CreateAsync` valid assignment -> success.
- `CreateAsync` duplicate assignment -> throws.
- `DeleteAsync` existing assignment -> success.
- `DeleteAsync` missing assignment -> throws / not found.

### Controllers
- `GET /subjects` returns subjects.
- `GET /subjects/{id}` returns subject.
- `POST /subjects` creates subject.
- `PUT /subjects/{id}` updates subject.
- `DELETE /subjects/{id}` deletes subject.
- `GET /teacher-assignments` returns assignments.
- `POST /teacher-assignments` creates assignment.
- `DELETE /teacher-assignments?teacherId=&subjectId=` deletes assignment.

---

## 5. Assignments

### AssignmentAppService
- `GetAllAsync` returns assignments for each role.
- `GetByIdAsync` returns accessible assignment.
- `CreateAsync` valid assignment -> success.
- `CreateAsync` when teacher not assigned -> forbidden.
- `CreateAsync` invalid deadline or marks -> throws.
- `UpdateAsync` valid update -> success.
- `UpdateAsync` unauthorized actor -> forbidden.
- `DuplicateAsync` creates copy correctly.
- `DeleteAsync` deletes assignment.
- `PublishAsync` publishes assignment.
- `Unpublish` via `UpdateAsync` or `PublishAsync` toggling status.

### Assignment Domain
- Publish changes status to `Published`.
- Unpublish changes status to `Draft`.
- Invalid publish on already published? handle gracefully.

### Controllers
- `GET /assignments` returns list.
- `GET /assignments/{id}` returns assignment.
- `POST /assignments` creates assignment.
- `PUT /assignments/{id}` updates assignment.
- `DELETE /assignments/{id}` deletes assignment.
- `POST /assignments/{id}/duplicate` duplicates assignment.
- `POST /assignments/{id}/publish` publishes assignment.

---

## 6. Submissions

### SubmissionAppService
- `GetAllAsync` returns all submissions for admin.
- `GetMineAsync` returns student submissions.
- `GetByIdAsync` authorized access by student/teacher/admin.
- `CreateAsync` student before deadline -> success.
- `CreateAsync` late submission when not allowed -> throws.
- `CreateAsync` resubmission with previous row -> updates existing row.
- `UpdateAsync` allowed by student or teacher in correct status -> success.
- `DeleteAsync` allowed by student or admin -> success.
- `GradeAsync` teacher grades submission -> status `Graded`.
- `GradeAsync` invalid marks or unauthorized -> throws.

### Submission Domain
- `Submit` before deadline -> success.
- `Submit` after deadline with allow late -> status `Late`.
- `Submit` after deadline without allow late -> exception.
- `MarkGraded` with invalid marks -> exception.

### Controllers
- `GET /submissions` admin list.
- `GET /submissions/mine` student list.
- `GET /submissions/{id}` returns submission.
- `POST /submissions` creates submission.
- `PUT /submissions/{id}` updates submission.
- `DELETE /submissions/{id}` deletes submission.
- `POST /submissions/{id}/grade` grades submission.

---

## 7. Attachments and Files

### AttachmentAppService
- `AddAsync` stores attachment record and returns metadata.
- `ListAsync` returns attachments for owner.
- `RenameAsync` changes file name.
- `DeleteAsync` removes attachment.
- `CloneAttachmentsAsync` clones attachments from one owner to another.
- `DeleteByOwnerAsync` deletes all attachments for owner.
- Invalid owner type or record -> throws.

### FileAppService / LocalFileStorageService
- `SaveFileAsync` stores file stream and returns stored file name.
- `OpenFileAsync` returns stream for existing file.
- `OpenFileAsync` missing file -> null.
- `DeleteFileAsync` deletes stored file.
- Failures when storage path unavailable -> handle gracefully.

### Controllers
- `POST /attachments/upload` saves attachment.
- `GET /attachments?ownerType=&ownerId=` lists attachments.
- `PUT /attachments/{id}/rename` renames attachment.
- `DELETE /attachments/{id}` deletes attachment.
- `POST /files/upload` saves file.
- `GET /files/download/{storedFileName}` downloads file.

---

## 8. Student Enrollments

### StudentEnrollmentAppService
- `GetAllAsync` returns enrollments.
- `CreateAsync` valid enrollment -> success.
- `CreateAsync` duplicate active enrollment -> throws.
- `DeleteAsync` removes enrollment.
- `DeleteAsync` invalid record -> throws.

### Controllers
- `GET /enrollments` returns list.
- `POST /enrollments` creates enrollment.
- `DELETE /enrollments?studentId=&classCourseId=` deletes enrollment.

---

## 9. Dashboard Stats

### DashboardAppService
- `GetAdminStatsAsync` returns counts for users, classes, assignments, submissions.
- `GetTeacherStatsAsync` returns teacher-specific metrics.
- `GetStudentStatsAsync` returns student-specific metrics.
- Ensure role filtering and null handling.

### Controllers
- `GET /dashboard/admin` returns admin stats.
- `GET /dashboard/teacher?teacherId=` returns teacher stats.
- `GET /dashboard/student?studentId=` returns student stats.

---

## 10. Controller and API Validation Tests

- Invalid request model inputs return `BadRequest`.
- Missing required body fields return validation errors.
- Invalid GUID route parameters return `BadRequest`.
- Unauthorized access returns `Unauthorized` or `Forbidden` as appropriate.
- Endpoints return `ProblemDetails` for model state errors.

---

## 11. Areas to Add or Expand

### Existing coverage gaps
- Add `UserAppService` tests for create/update/toggle active.
- Add `SubjectAppService` tests for duplicate code and update failure.
- Add `TeacherSubjectAssignmentAppService` tests for duplicate / delete.
- Add `AttachmentAppService` and `FileAppService` unit tests.
- Add `DashboardAppService` tests.
- Add controller tests for class courses, subjects, enrollments, assignments, submissions, attachments, and files.
- Add integration tests for file upload/download and attachment permission flows.

### Possible integration test cases
- Student creates submission and then downloads own attachment.
- Teacher grades a student submission over HTTP.
- Admin creates and deletes a class course.
- Teacher cannot delete another teacher's assignment.
- Attachment rename only allowed by owner or admin.

---

## 12. Suggested Test Organization

- `tests/AMS.Application.Tests/` — one test class per app service.
- `tests/AMS.Domain.Tests/` — one test class per rich domain entity.
- `tests/AMS.HttpApi.Tests/` — one controller test class per API controller plus integration scenarios.
- `tests/AMS.HttpApi.Tests/Integration/` — end-to-end routes and RBAC checks.

---

## 13. Example Test Case Template

Use this structure for all service tests:

```csharp
[Fact]
public async Task CreateAsync_Should_Throw_When_Duplicate_Exists()
{
    // arrange
    var repo = new Mock<IRepository>(MockBehavior.Strict);
    repo.Setup(r => r.GetByKeyAsync(...)).ReturnsAsync(existingEntity);
    var service = new FeatureAppService(repo.Object, ...);

    // act / assert
    var ex = await Assert.ThrowsAsync<DomainException>(() => service.CreateAsync(input, userId, userRole));
    Assert.Contains("duplicate", ex.Message, StringComparison.OrdinalIgnoreCase);
}
```

---

## 14. Running the Tests

From the workspace root:

```bash
cd "backend"
dotnet test tests/AMS.Application.Tests/AMS.Application.Tests.csproj
dotnet test tests/AMS.Domain.Tests/AMS.Domain.Tests.csproj
dotnet test tests/AMS.HttpApi.Tests/AMS.HttpApi.Tests.csproj
```

If you want, I can also generate actual xUnit test files for the highest-priority missing service coverage first.