using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AMS.EntityFrameworkCore.Migrations
{
    /// <inheritdoc />
    public partial class initial_migration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "academic_years",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    start_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    end_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_academic_years", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "Attachments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OwnerType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    OwnerId = table.Column<Guid>(type: "uuid", nullable: false),
                    OriginalFileName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    StoredFileName = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ContentType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    SizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    UploadedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    UploadedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Attachments", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "class_definitions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false, defaultValue: 0)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_class_definitions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "groups",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    class_definition_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_groups", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    full_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    password_hash = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    role = table.Column<int>(type: "integer", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    avatar_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    phone_number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    gender = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    date_of_birth = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    address = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "class_courses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    section = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    academic_year_id = table.Column<Guid>(type: "uuid", nullable: false),
                    class_definition_id = table.Column<Guid>(type: "uuid", nullable: false),
                    group_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_class_courses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_class_courses_academic_years_academic_year_id",
                        column: x => x.academic_year_id,
                        principalTable: "academic_years",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_class_courses_class_definitions_class_definition_id",
                        column: x => x.class_definition_id,
                        principalTable: "class_definitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_class_courses_groups_group_id",
                        column: x => x.group_id,
                        principalTable: "groups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "student_profiles",
                columns: table => new
                {
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    student_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    guardian_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    guardian_email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    parent_mobile = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    admission_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_student_profiles", x => x.user_id);
                    table.ForeignKey(
                        name: "FK_student_profiles_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "teacher_profiles",
                columns: table => new
                {
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    employee_id = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    subject_specialization = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    qualification = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    joining_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_teacher_profiles", x => x.user_id);
                    table.ForeignKey(
                        name: "FK_teacher_profiles_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "student_enrollments",
                columns: table => new
                {
                    student_id = table.Column<Guid>(type: "uuid", nullable: false),
                    class_course_id = table.Column<Guid>(type: "uuid", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    EnrolledAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    StudentId1 = table.Column<Guid>(type: "uuid", nullable: false),
                    ClassCourseId1 = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_student_enrollments", x => new { x.student_id, x.class_course_id });
                    table.ForeignKey(
                        name: "FK_student_enrollments_class_courses_ClassCourseId1",
                        column: x => x.ClassCourseId1,
                        principalTable: "class_courses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_student_enrollments_class_courses_class_course_id",
                        column: x => x.class_course_id,
                        principalTable: "class_courses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_student_enrollments_users_StudentId1",
                        column: x => x.StudentId1,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_student_enrollments_users_student_id",
                        column: x => x.student_id,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "subjects",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    class_course_id = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ClassCourseId1 = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_subjects", x => x.Id);
                    table.ForeignKey(
                        name: "FK_subjects_class_courses_ClassCourseId1",
                        column: x => x.ClassCourseId1,
                        principalTable: "class_courses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_subjects_class_courses_class_course_id",
                        column: x => x.class_course_id,
                        principalTable: "class_courses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "assignments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    class_course_id = table.Column<Guid>(type: "uuid", nullable: false),
                    subject_id = table.Column<Guid>(type: "uuid", nullable: false),
                    teacher_id = table.Column<Guid>(type: "uuid", nullable: false),
                    attachment_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    attachment_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    deadline = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    max_marks = table.Column<int>(type: "integer", nullable: false),
                    status = table.Column<int>(type: "integer", nullable: false),
                    allow_late_submission = table.Column<bool>(type: "boolean", nullable: false),
                    allow_resubmission = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ClassCourseId1 = table.Column<Guid>(type: "uuid", nullable: false),
                    SubjectId1 = table.Column<Guid>(type: "uuid", nullable: false),
                    TeacherId1 = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_assignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_assignments_class_courses_ClassCourseId1",
                        column: x => x.ClassCourseId1,
                        principalTable: "class_courses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_assignments_class_courses_class_course_id",
                        column: x => x.class_course_id,
                        principalTable: "class_courses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_assignments_subjects_SubjectId1",
                        column: x => x.SubjectId1,
                        principalTable: "subjects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_assignments_subjects_subject_id",
                        column: x => x.subject_id,
                        principalTable: "subjects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_assignments_users_TeacherId1",
                        column: x => x.TeacherId1,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_assignments_users_teacher_id",
                        column: x => x.teacher_id,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "teacher_subject_assignments",
                columns: table => new
                {
                    teacher_id = table.Column<Guid>(type: "uuid", nullable: false),
                    subject_id = table.Column<Guid>(type: "uuid", nullable: false),
                    class_course_id = table.Column<Guid>(type: "uuid", nullable: false),
                    TeacherId1 = table.Column<Guid>(type: "uuid", nullable: false),
                    SubjectId1 = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_teacher_subject_assignments", x => new { x.teacher_id, x.subject_id });
                    table.ForeignKey(
                        name: "FK_teacher_subject_assignments_class_courses_class_course_id",
                        column: x => x.class_course_id,
                        principalTable: "class_courses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_teacher_subject_assignments_subjects_SubjectId1",
                        column: x => x.SubjectId1,
                        principalTable: "subjects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_teacher_subject_assignments_subjects_subject_id",
                        column: x => x.subject_id,
                        principalTable: "subjects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_teacher_subject_assignments_users_TeacherId1",
                        column: x => x.TeacherId1,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_teacher_subject_assignments_users_teacher_id",
                        column: x => x.teacher_id,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "submissions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    assignment_id = table.Column<Guid>(type: "uuid", nullable: false),
                    student_id = table.Column<Guid>(type: "uuid", nullable: false),
                    content_text = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    file_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    file_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    submitted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    resubmitted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    resubmission_count = table.Column<int>(type: "integer", nullable: false),
                    is_late = table.Column<bool>(type: "boolean", nullable: false),
                    status = table.Column<int>(type: "integer", nullable: false),
                    marks = table.Column<int>(type: "integer", nullable: true),
                    feedback = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    graded_by_teacher_id = table.Column<Guid>(type: "uuid", nullable: true),
                    graded_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AssignmentId1 = table.Column<Guid>(type: "uuid", nullable: false),
                    StudentId1 = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_submissions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_submissions_assignments_AssignmentId1",
                        column: x => x.AssignmentId1,
                        principalTable: "assignments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_submissions_assignments_assignment_id",
                        column: x => x.assignment_id,
                        principalTable: "assignments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_submissions_users_StudentId1",
                        column: x => x.StudentId1,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_submissions_users_student_id",
                        column: x => x.student_id,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_academic_years_is_active",
                table: "academic_years",
                column: "is_active");

            migrationBuilder.CreateIndex(
                name: "IX_assignments_class_course_id",
                table: "assignments",
                column: "class_course_id");

            migrationBuilder.CreateIndex(
                name: "IX_assignments_ClassCourseId1",
                table: "assignments",
                column: "ClassCourseId1");

            migrationBuilder.CreateIndex(
                name: "IX_assignments_subject_id",
                table: "assignments",
                column: "subject_id");

            migrationBuilder.CreateIndex(
                name: "IX_assignments_SubjectId1",
                table: "assignments",
                column: "SubjectId1");

            migrationBuilder.CreateIndex(
                name: "IX_assignments_teacher_id",
                table: "assignments",
                column: "teacher_id");

            migrationBuilder.CreateIndex(
                name: "IX_assignments_TeacherId1",
                table: "assignments",
                column: "TeacherId1");

            migrationBuilder.CreateIndex(
                name: "IX_Attachments_OwnerType_OwnerId",
                table: "Attachments",
                columns: new[] { "OwnerType", "OwnerId" });

            migrationBuilder.CreateIndex(
                name: "IX_class_courses_academic_year_id",
                table: "class_courses",
                column: "academic_year_id");

            migrationBuilder.CreateIndex(
                name: "IX_class_courses_group_id",
                table: "class_courses",
                column: "group_id");

            migrationBuilder.CreateIndex(
                name: "IX_class_courses_unique_combination",
                table: "class_courses",
                columns: new[] { "class_definition_id", "group_id", "academic_year_id", "section" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_groups_class_definition_name",
                table: "class_courses",
                columns: new[] { "class_definition_id", "name" });

            migrationBuilder.CreateIndex(
                name: "IX_student_enrollments_class_course_id",
                table: "student_enrollments",
                column: "class_course_id");

            migrationBuilder.CreateIndex(
                name: "IX_student_enrollments_ClassCourseId1",
                table: "student_enrollments",
                column: "ClassCourseId1");

            migrationBuilder.CreateIndex(
                name: "IX_student_enrollments_StudentId1",
                table: "student_enrollments",
                column: "StudentId1");

            migrationBuilder.CreateIndex(
                name: "IX_student_profiles_student_id",
                table: "student_profiles",
                column: "student_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_subjects_class_course_id",
                table: "subjects",
                column: "class_course_id");

            migrationBuilder.CreateIndex(
                name: "IX_subjects_ClassCourseId1",
                table: "subjects",
                column: "ClassCourseId1");

            migrationBuilder.CreateIndex(
                name: "IX_submissions_assignment_id",
                table: "submissions",
                column: "assignment_id");

            migrationBuilder.CreateIndex(
                name: "IX_submissions_AssignmentId1",
                table: "submissions",
                column: "AssignmentId1");

            migrationBuilder.CreateIndex(
                name: "IX_submissions_student_id",
                table: "submissions",
                column: "student_id");

            migrationBuilder.CreateIndex(
                name: "IX_submissions_StudentId1",
                table: "submissions",
                column: "StudentId1");

            migrationBuilder.CreateIndex(
                name: "IX_teacher_profiles_employee_id",
                table: "teacher_profiles",
                column: "employee_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_teacher_subject_assignments_class_course_id",
                table: "teacher_subject_assignments",
                column: "class_course_id");

            migrationBuilder.CreateIndex(
                name: "IX_teacher_subject_assignments_subject_id",
                table: "teacher_subject_assignments",
                column: "subject_id");

            migrationBuilder.CreateIndex(
                name: "IX_teacher_subject_assignments_SubjectId1",
                table: "teacher_subject_assignments",
                column: "SubjectId1");

            migrationBuilder.CreateIndex(
                name: "IX_teacher_subject_assignments_TeacherId1",
                table: "teacher_subject_assignments",
                column: "TeacherId1");

            migrationBuilder.CreateIndex(
                name: "IX_users_email",
                table: "users",
                column: "email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_role",
                table: "users",
                column: "role");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Attachments");

            migrationBuilder.DropTable(
                name: "student_enrollments");

            migrationBuilder.DropTable(
                name: "student_profiles");

            migrationBuilder.DropTable(
                name: "submissions");

            migrationBuilder.DropTable(
                name: "teacher_profiles");

            migrationBuilder.DropTable(
                name: "teacher_subject_assignments");

            migrationBuilder.DropTable(
                name: "assignments");

            migrationBuilder.DropTable(
                name: "subjects");

            migrationBuilder.DropTable(
                name: "users");

            migrationBuilder.DropTable(
                name: "class_courses");

            migrationBuilder.DropTable(
                name: "academic_years");

            migrationBuilder.DropTable(
                name: "class_definitions");

            migrationBuilder.DropTable(
                name: "groups");
        }
    }
}
