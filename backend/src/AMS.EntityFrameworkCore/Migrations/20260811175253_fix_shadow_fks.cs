using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AMS.EntityFrameworkCore.Migrations
{
    /// <inheritdoc />
    public partial class fix_shadow_fks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_assignments_class_courses_ClassCourseId1",
                table: "assignments");

            migrationBuilder.DropForeignKey(
                name: "FK_assignments_subjects_SubjectId1",
                table: "assignments");

            migrationBuilder.DropForeignKey(
                name: "FK_assignments_users_TeacherId1",
                table: "assignments");

            migrationBuilder.DropForeignKey(
                name: "FK_student_enrollments_class_courses_ClassCourseId1",
                table: "student_enrollments");

            migrationBuilder.DropForeignKey(
                name: "FK_student_enrollments_users_StudentId1",
                table: "student_enrollments");

            migrationBuilder.DropForeignKey(
                name: "FK_subjects_class_courses_ClassCourseId1",
                table: "subjects");

            migrationBuilder.DropForeignKey(
                name: "FK_submissions_assignments_AssignmentId1",
                table: "submissions");

            migrationBuilder.DropForeignKey(
                name: "FK_submissions_users_StudentId1",
                table: "submissions");

            migrationBuilder.DropForeignKey(
                name: "FK_teacher_subject_assignments_subjects_SubjectId1",
                table: "teacher_subject_assignments");

            migrationBuilder.DropForeignKey(
                name: "FK_teacher_subject_assignments_users_TeacherId1",
                table: "teacher_subject_assignments");

            migrationBuilder.DropIndex(
                name: "IX_teacher_subject_assignments_SubjectId1",
                table: "teacher_subject_assignments");

            migrationBuilder.DropIndex(
                name: "IX_teacher_subject_assignments_TeacherId1",
                table: "teacher_subject_assignments");

            migrationBuilder.DropIndex(
                name: "IX_submissions_AssignmentId1",
                table: "submissions");

            migrationBuilder.DropIndex(
                name: "IX_submissions_StudentId1",
                table: "submissions");

            migrationBuilder.DropIndex(
                name: "IX_subjects_ClassCourseId1",
                table: "subjects");

            migrationBuilder.DropIndex(
                name: "IX_student_enrollments_ClassCourseId1",
                table: "student_enrollments");

            migrationBuilder.DropIndex(
                name: "IX_student_enrollments_StudentId1",
                table: "student_enrollments");

            migrationBuilder.DropIndex(
                name: "IX_assignments_ClassCourseId1",
                table: "assignments");

            migrationBuilder.DropIndex(
                name: "IX_assignments_SubjectId1",
                table: "assignments");

            migrationBuilder.DropIndex(
                name: "IX_assignments_TeacherId1",
                table: "assignments");

            migrationBuilder.DropColumn(
                name: "SubjectId1",
                table: "teacher_subject_assignments");

            migrationBuilder.DropColumn(
                name: "TeacherId1",
                table: "teacher_subject_assignments");

            migrationBuilder.DropColumn(
                name: "AssignmentId1",
                table: "submissions");

            migrationBuilder.DropColumn(
                name: "StudentId1",
                table: "submissions");

            migrationBuilder.DropColumn(
                name: "ClassCourseId1",
                table: "subjects");

            migrationBuilder.DropColumn(
                name: "ClassCourseId1",
                table: "student_enrollments");

            migrationBuilder.DropColumn(
                name: "StudentId1",
                table: "student_enrollments");

            migrationBuilder.DropColumn(
                name: "ClassCourseId1",
                table: "assignments");

            migrationBuilder.DropColumn(
                name: "SubjectId1",
                table: "assignments");

            migrationBuilder.DropColumn(
                name: "TeacherId1",
                table: "assignments");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "SubjectId1",
                table: "teacher_subject_assignments",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "TeacherId1",
                table: "teacher_subject_assignments",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "AssignmentId1",
                table: "submissions",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "StudentId1",
                table: "submissions",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "ClassCourseId1",
                table: "subjects",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "ClassCourseId1",
                table: "student_enrollments",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "StudentId1",
                table: "student_enrollments",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "ClassCourseId1",
                table: "assignments",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "SubjectId1",
                table: "assignments",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "TeacherId1",
                table: "assignments",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_teacher_subject_assignments_SubjectId1",
                table: "teacher_subject_assignments",
                column: "SubjectId1");

            migrationBuilder.CreateIndex(
                name: "IX_teacher_subject_assignments_TeacherId1",
                table: "teacher_subject_assignments",
                column: "TeacherId1");

            migrationBuilder.CreateIndex(
                name: "IX_submissions_AssignmentId1",
                table: "submissions",
                column: "AssignmentId1");

            migrationBuilder.CreateIndex(
                name: "IX_submissions_StudentId1",
                table: "submissions",
                column: "StudentId1");

            migrationBuilder.CreateIndex(
                name: "IX_subjects_ClassCourseId1",
                table: "subjects",
                column: "ClassCourseId1");

            migrationBuilder.CreateIndex(
                name: "IX_student_enrollments_ClassCourseId1",
                table: "student_enrollments",
                column: "ClassCourseId1");

            migrationBuilder.CreateIndex(
                name: "IX_student_enrollments_StudentId1",
                table: "student_enrollments",
                column: "StudentId1");

            migrationBuilder.CreateIndex(
                name: "IX_assignments_ClassCourseId1",
                table: "assignments",
                column: "ClassCourseId1");

            migrationBuilder.CreateIndex(
                name: "IX_assignments_SubjectId1",
                table: "assignments",
                column: "SubjectId1");

            migrationBuilder.CreateIndex(
                name: "IX_assignments_TeacherId1",
                table: "assignments",
                column: "TeacherId1");

            migrationBuilder.AddForeignKey(
                name: "FK_assignments_class_courses_ClassCourseId1",
                table: "assignments",
                column: "ClassCourseId1",
                principalTable: "class_courses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_assignments_subjects_SubjectId1",
                table: "assignments",
                column: "SubjectId1",
                principalTable: "subjects",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_assignments_users_TeacherId1",
                table: "assignments",
                column: "TeacherId1",
                principalTable: "users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_student_enrollments_class_courses_ClassCourseId1",
                table: "student_enrollments",
                column: "ClassCourseId1",
                principalTable: "class_courses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_student_enrollments_users_StudentId1",
                table: "student_enrollments",
                column: "StudentId1",
                principalTable: "users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_subjects_class_courses_ClassCourseId1",
                table: "subjects",
                column: "ClassCourseId1",
                principalTable: "class_courses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_submissions_assignments_AssignmentId1",
                table: "submissions",
                column: "AssignmentId1",
                principalTable: "assignments",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_submissions_users_StudentId1",
                table: "submissions",
                column: "StudentId1",
                principalTable: "users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_teacher_subject_assignments_subjects_SubjectId1",
                table: "teacher_subject_assignments",
                column: "SubjectId1",
                principalTable: "subjects",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_teacher_subject_assignments_users_TeacherId1",
                table: "teacher_subject_assignments",
                column: "TeacherId1",
                principalTable: "users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
