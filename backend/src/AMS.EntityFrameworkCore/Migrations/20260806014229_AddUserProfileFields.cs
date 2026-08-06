using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AMS.EntityFrameworkCore.src.AMS.EntityFrameworkCore.Migrations
{
    /// <inheritdoc />
    public partial class AddUserProfileFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "address",
                table: "app_users",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "admission_date",
                table: "app_users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "avatar_url",
                table: "app_users",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "date_of_birth",
                table: "app_users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "employee_id",
                table: "app_users",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "gender",
                table: "app_users",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "guardian_email",
                table: "app_users",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "guardian_name",
                table: "app_users",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "joining_date",
                table: "app_users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "phone_number",
                table: "app_users",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "qualification",
                table: "app_users",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "student_id",
                table: "app_users",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "subject_specialization",
                table: "app_users",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "address",
                table: "app_users");

            migrationBuilder.DropColumn(
                name: "admission_date",
                table: "app_users");

            migrationBuilder.DropColumn(
                name: "avatar_url",
                table: "app_users");

            migrationBuilder.DropColumn(
                name: "date_of_birth",
                table: "app_users");

            migrationBuilder.DropColumn(
                name: "employee_id",
                table: "app_users");

            migrationBuilder.DropColumn(
                name: "gender",
                table: "app_users");

            migrationBuilder.DropColumn(
                name: "guardian_email",
                table: "app_users");

            migrationBuilder.DropColumn(
                name: "guardian_name",
                table: "app_users");

            migrationBuilder.DropColumn(
                name: "joining_date",
                table: "app_users");

            migrationBuilder.DropColumn(
                name: "phone_number",
                table: "app_users");

            migrationBuilder.DropColumn(
                name: "qualification",
                table: "app_users");

            migrationBuilder.DropColumn(
                name: "student_id",
                table: "app_users");

            migrationBuilder.DropColumn(
                name: "subject_specialization",
                table: "app_users");
        }
    }
}
