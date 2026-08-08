using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AMS.EntityFrameworkCore.Migrations
{
    public partial class AddClassDefinitions : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "class_definitions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false)
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
                    table.ForeignKey(
                        name: "FK_groups_class_definitions_class_definition_id",
                        column: x => x.class_definition_id,
                        principalTable: "class_definitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.AddColumn<Guid>(
                name: "class_definition_id",
                table: "class_courses",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "group_id",
                table: "class_courses",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_groups_class_definition_id",
                table: "groups",
                column: "class_definition_id");

            migrationBuilder.CreateIndex(
                name: "IX_class_unique_combination",
                table: "class_courses",
                columns: new[] { "academic_year", "class_definition_id", "group_id", "section" });

            migrationBuilder.AddForeignKey(
                name: "FK_class_courses_class_definitions_class_definition_id",
                table: "class_courses",
                column: "class_definition_id",
                principalTable: "class_definitions",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_class_courses_groups_group_id",
                table: "class_courses",
                column: "group_id",
                principalTable: "groups",
                principalColumn: "Id");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_class_courses_class_definitions_class_definition_id",
                table: "class_courses");

            migrationBuilder.DropForeignKey(
                name: "FK_class_courses_groups_group_id",
                table: "class_courses");

            migrationBuilder.DropIndex(
                name: "IX_groups_class_definition_id",
                table: "groups");

            migrationBuilder.DropIndex(
                name: "IX_class_unique_combination",
                table: "class_courses");

            migrationBuilder.DropColumn(
                name: "class_definition_id",
                table: "class_courses");

            migrationBuilder.DropColumn(
                name: "group_id",
                table: "class_courses");

            migrationBuilder.DropTable(
                name: "groups");

            migrationBuilder.DropTable(
                name: "class_definitions");
        }
    }
}
