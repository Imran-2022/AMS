# AMS — Database Design Review & Redesign

You are refactoring the database layer of an ABP-style .NET solution (AMS.Domain,
AMS.Domain.Shared, AMS.EntityFrameworkCore, AMS.Application, AMS.Application.Contracts,
AMS.HttpApi). The local Postgres database and all EF Core migrations can be deleted and
regenerated from scratch — there is no production data to preserve.

Apply the following schema redesign:

1. Split AMS.Domain.Entities.AppUser into three entities:
   - User: Id, FullName, Email, PasswordHash, Role (UserRole enum), AvatarUrl, PhoneNumber,
     Gender, DateOfBirth, Address, IsActive, CreatedAt, UpdatedAt.
   - TeacherProfile: UserId (PK + FK to User, cascade delete), EmployeeId (unique, required),
     SubjectSpecialization, Qualification, JoiningDate. One-to-one with User.
   - StudentProfile: UserId (PK + FK to User, cascade delete), StudentId (unique, required),
     GuardianName, GuardianEmail, ParentMobile, AdmissionDate. One-to-one with User.
   Rename the AppUsers DbSet to Users, add DbSet<TeacherProfile> and DbSet<StudentProfile>.
   Update every repository, application service, DTO, and controller that referenced AppUser
   fields now living on TeacherProfile/StudentProfile (UserAppService, AuthAppService, UserDto,
   AddStudentModal/AddTeacherModal flows on the frontend, etc.) to read/write through the new
   split. Enforce in the application layer that a TeacherProfile can only be created for a User
   with Role == Teacher, and a StudentProfile only for Role == Student.

2. Change ClassCourse.AcademicYear (currently a free-text string) to AcademicYearId (Guid, FK to
   AcademicYear, required). Update ClassCourseAppService, ClassCourseDto, seed data, and any
   frontend code that reads/writes AcademicYear as a string to use the AcademicYear entity
   (Id/Name) instead.

3. Add the missing foreign keys and cascade rules that are not currently configured:
   - Group.ClassDefinitionId -> ClassDefinition (required, cascade delete)
   - ClassCourse.ClassDefinitionId -> ClassDefinition (required)
   - ClassCourse.GroupId -> Group (optional, ON DELETE SET NULL)
   Add a unique index on Group(ClassDefinitionId, Name) and on
   ClassCourse(ClassDefinitionId, GroupId, AcademicYearId, Section).

4. Remove the redundant ClassCourseId column from Assignment and from
   TeacherSubjectAssignment (it is transitively determined by SubjectId ->
   Subject.ClassCourseId). Everywhere ClassCourseId was read off Assignment or
   TeacherSubjectAssignment, replace it with a lookup through Subject.ClassCourseId
   (via a join or an included navigation) instead of a stored column.

5. Remove Assignment.AttachmentUrl/AttachmentName and Submission.FileUrl/FileName.
   All files for assignments and submissions must go through the existing Attachment
   entity (OwnerType = "Assignment" | "Submission", OwnerId = the owning record's Id).
   Add a CHECK constraint on Attachment.OwnerType restricting it to those two values.
   Update AttachmentAppService/FileAppService and the relevant controllers/DTOs so
   assignment and submission responses include their attachments via that table
   instead of the removed inline columns.

6. Add these constraints/indexes:
   - Submission: unique index on (AssignmentId, StudentId) — one row per student per
     assignment; resubmission updates the existing row rather than inserting a new one.
   - Submission.Marks: CHECK (Marks IS NULL OR Marks >= 0).
   - Assignment.MaxMarks: CHECK (MaxMarks > 0).
   - User: index on Role.
   - StudentEnrollment: add IsActive (bool, default true) and EnrolledAt (timestamptz,
     default now()) columns; add a partial unique index on StudentId WHERE IsActive = true
     so a student has at most one currently-active class enrollment; keep an index on
     ClassCourseId.
   - Subject: unique index on (ClassCourseId, Code).

7. Add CreatedAt (default now()) and UpdatedAt (nullable) columns, consistently, to:
   User, ClassCourse, Subject (they are currently missing on these tables; Assignment
   and AcademicYear already have CreatedAt — add UpdatedAt to Assignment too).

8. Regenerate the EF Core configuration classes under AMS.EntityFrameworkCore/Configurations
   to reflect all of the above (explicit HasOne/WithMany, HasIndex, HasCheckConstraint,
   column types, max lengths — follow the existing snake_case column naming convention
   already used in this project).

9. Delete all existing files under AMS.EntityFrameworkCore/Migrations and generate a single
   fresh InitialCreate migration reflecting the new model (Add-Migration InitialCreate /
   dotnet ef migrations add InitialCreate).

10. Update AMS.DbMigrator/Program.cs to seed realistic sample data against the new schema:
    - 1 admin user (no profile row).
    - 4 teachers, each with a TeacherProfile (unique EmployeeId, SubjectSpecialization,
      Qualification, JoiningDate).
    - 12 students, each with a StudentProfile (unique StudentId, GuardianName,
      GuardianEmail, ParentMobile, AdmissionDate).
    - 2 AcademicYears (one IsActive = true).
    - ClassDefinitions "One".."Twelve" with SortOrder.
    - Groups "Science"/"Arts"/"Commerce" under classes Nine-Twelve.
    - At least 6 ClassCourses spread across different classes/sections/the active
      academic year (via AcademicYearId, not a string).
    - 2-3 Subjects per ClassCourse with realistic codes (e.g. MATH101, ENG101).
    - TeacherSubjectAssignments covering every seeded subject.
    - StudentEnrollments so every seeded student has exactly one IsActive enrollment.
    - 8-10 Assignments, a mix of Draft/Published status and AllowLateSubmission/
      AllowResubmission combinations, spread across different subjects/teachers.
    - Submissions covering every status in SubmissionStatus (Submitted, Late,
      UnderReview, Graded with Marks/Feedback/GradedByTeacherId set, ResubmissionRequested,
      Resubmitted) so the UI has data to demonstrate every workflow state.
    - A couple of Attachment rows for a subset of assignments and submissions
      (OwnerType/OwnerId pointing at real seeded rows), using LocalFileStorageService's
      existing storage path so the seeded records match real (even if placeholder) files.
    Make the seeder idempotent (check existence before inserting, like the current code
    does) so it can be re-run safely.

Do not change anything about the authentication flow, controllers' routes, or the
frontend's API contracts beyond what's strictly required by the field moves above.
Ask me before touching AMS.HttpApi.Host or the test projects if the entity split
breaks any of them — otherwise fix the resulting compile errors directly.