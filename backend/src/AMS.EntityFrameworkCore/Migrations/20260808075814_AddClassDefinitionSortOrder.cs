using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AMS.EntityFrameworkCore.Migrations
{
    /// <inheritdoc />
    public partial class AddClassDefinitionSortOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "sort_order",
                table: "class_definitions",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.Sql(@"
                UPDATE class_definitions SET sort_order = 1 WHERE name = 'One';
                UPDATE class_definitions SET sort_order = 2 WHERE name = 'Two';
                UPDATE class_definitions SET sort_order = 3 WHERE name = 'Three';
                UPDATE class_definitions SET sort_order = 4 WHERE name = 'Four';
                UPDATE class_definitions SET sort_order = 5 WHERE name = 'Five';
                UPDATE class_definitions SET sort_order = 6 WHERE name = 'Six';
                UPDATE class_definitions SET sort_order = 7 WHERE name = 'Seven';
                UPDATE class_definitions SET sort_order = 8 WHERE name = 'Eight';
                UPDATE class_definitions SET sort_order = 9 WHERE name = 'Nine';
                UPDATE class_definitions SET sort_order = 10 WHERE name = 'Ten';
                UPDATE class_definitions SET sort_order = 11 WHERE name = 'Eleven';
                UPDATE class_definitions SET sort_order = 12 WHERE name = 'Twelve';
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "sort_order",
                table: "class_definitions");
        }
    }
}
