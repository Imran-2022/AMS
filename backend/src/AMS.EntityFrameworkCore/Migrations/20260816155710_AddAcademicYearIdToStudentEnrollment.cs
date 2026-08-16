using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AMS.EntityFrameworkCore.Migrations
{
    /// <inheritdoc />
    public partial class AddAcademicYearIdToStudentEnrollment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "RollNumber",
                table: "student_enrollments",
                type: "text",
                nullable: true);

            // Add nullable academic_year_id column first
            migrationBuilder.AddColumn<Guid>(
                name: "academic_year_id",
                table: "student_enrollments",
                type: "uuid",
                nullable: true);

            // Populate academic_year_id from ClassCourse relationship
            migrationBuilder.Sql(
                @"UPDATE student_enrollments se
                  SET academic_year_id = cc.academic_year_id
                  FROM class_courses cc
                  WHERE se.class_course_id = cc.""Id""");

            // Make academic_year_id NOT NULL
            migrationBuilder.AlterColumn<Guid>(
                name: "academic_year_id",
                table: "student_enrollments",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_student_enrollments_academic_year_id",
                table: "student_enrollments",
                column: "academic_year_id");

            migrationBuilder.AddForeignKey(
                name: "FK_student_enrollments_academic_years_academic_year_id",
                table: "student_enrollments",
                column: "academic_year_id",
                principalTable: "academic_years",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_student_enrollments_academic_years_academic_year_id",
                table: "student_enrollments");

            migrationBuilder.DropIndex(
                name: "IX_student_enrollments_academic_year_id",
                table: "student_enrollments");

            migrationBuilder.DropColumn(
                name: "RollNumber",
                table: "student_enrollments");

            migrationBuilder.DropColumn(
                name: "academic_year_id",
                table: "student_enrollments");
        }
    }
}
