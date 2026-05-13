using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Fitness.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddedCardioFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Duration",
                table: "WorkoutDayExercises",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Incline",
                table: "WorkoutDayExercises",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Speed",
                table: "WorkoutDayExercises",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Duration",
                table: "WorkoutDayExercises");

            migrationBuilder.DropColumn(
                name: "Incline",
                table: "WorkoutDayExercises");

            migrationBuilder.DropColumn(
                name: "Speed",
                table: "WorkoutDayExercises");
        }
    }
}
