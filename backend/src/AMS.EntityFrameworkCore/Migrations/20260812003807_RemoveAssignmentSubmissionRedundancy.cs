using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AMS.EntityFrameworkCore.Migrations
{
    /// <inheritdoc />
    public partial class RemoveAssignmentSubmissionRedundancy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_assignments_class_courses_class_course_id",
                table: "assignments");

            migrationBuilder.DropForeignKey(
                name: "FK_teacher_subject_assignments_class_courses_class_course_id",
                table: "teacher_subject_assignments");

            migrationBuilder.DropIndex(
                name: "IX_teacher_subject_assignments_class_course_id",
                table: "teacher_subject_assignments");

            migrationBuilder.DropIndex(
                name: "IX_submissions_assignment_id",
                table: "submissions");

            migrationBuilder.DropIndex(
                name: "IX_subjects_class_course_id",
                table: "subjects");

            migrationBuilder.DropIndex(
                name: "IX_assignments_class_course_id",
                table: "assignments");

            migrationBuilder.DropColumn(
                name: "class_course_id",
                table: "teacher_subject_assignments");

            migrationBuilder.DropColumn(
                name: "file_name",
                table: "submissions");

            migrationBuilder.DropColumn(
                name: "file_url",
                table: "submissions");

            migrationBuilder.DropColumn(
                name: "attachment_name",
                table: "assignments");

            migrationBuilder.DropColumn(
                name: "attachment_url",
                table: "assignments");

            migrationBuilder.DropColumn(
                name: "class_course_id",
                table: "assignments");

            migrationBuilder.CreateIndex(
                name: "IX_submissions_assignment_id_student_id",
                table: "submissions",
                columns: new[] { "assignment_id", "student_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_subjects_class_course_id_code",
                table: "subjects",
                columns: new[] { "class_course_id", "code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_groups_class_definition_id",
                table: "groups",
                column: "class_definition_id");

            migrationBuilder.AddForeignKey(
                name: "FK_groups_class_definitions_class_definition_id",
                table: "groups",
                column: "class_definition_id",
                principalTable: "class_definitions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_groups_class_definitions_class_definition_id",
                table: "groups");

            migrationBuilder.DropIndex(
                name: "IX_submissions_assignment_id_student_id",
                table: "submissions");

            migrationBuilder.DropIndex(
                name: "IX_subjects_class_course_id_code",
                table: "subjects");

            migrationBuilder.DropIndex(
                name: "IX_groups_class_definition_id",
                table: "groups");

            migrationBuilder.AddColumn<Guid>(
                name: "class_course_id",
                table: "teacher_subject_assignments",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "file_name",
                table: "submissions",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "file_url",
                table: "submissions",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "attachment_name",
                table: "assignments",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "attachment_url",
                table: "assignments",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "class_course_id",
                table: "assignments",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_teacher_subject_assignments_class_course_id",
                table: "teacher_subject_assignments",
                column: "class_course_id");

            migrationBuilder.CreateIndex(
                name: "IX_submissions_assignment_id",
                table: "submissions",
                column: "assignment_id");

            migrationBuilder.CreateIndex(
                name: "IX_subjects_class_course_id",
                table: "subjects",
                column: "class_course_id");

            migrationBuilder.CreateIndex(
                name: "IX_assignments_class_course_id",
                table: "assignments",
                column: "class_course_id");

            migrationBuilder.AddForeignKey(
                name: "FK_assignments_class_courses_class_course_id",
                table: "assignments",
                column: "class_course_id",
                principalTable: "class_courses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_teacher_subject_assignments_class_courses_class_course_id",
                table: "teacher_subject_assignments",
                column: "class_course_id",
                principalTable: "class_courses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
