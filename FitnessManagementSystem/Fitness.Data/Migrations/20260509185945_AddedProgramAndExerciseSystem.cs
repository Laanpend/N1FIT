using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Fitness.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddedProgramAndExerciseSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_WorkoutPrograms_Exercises_ExerciseId",
                table: "WorkoutPrograms");

            migrationBuilder.DropIndex(
                name: "IX_WorkoutPrograms_ExerciseId",
                table: "WorkoutPrograms");

            migrationBuilder.DropColumn(
                name: "ExerciseId",
                table: "WorkoutPrograms");

            migrationBuilder.DropColumn(
                name: "Reps",
                table: "WorkoutPrograms");

            migrationBuilder.DropColumn(
                name: "Sets",
                table: "WorkoutPrograms");

            migrationBuilder.DropColumn(
                name: "CreatedDate",
                table: "Exercises");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Exercises");

            migrationBuilder.DropColumn(
                name: "PhotoUrl",
                table: "Exercises");

            migrationBuilder.RenameColumn(
                name: "IsDeleted",
                table: "WorkoutPrograms",
                newName: "IsActive");

            migrationBuilder.RenameColumn(
                name: "Day",
                table: "WorkoutPrograms",
                newName: "Name");

            migrationBuilder.RenameColumn(
                name: "CreatedDate",
                table: "WorkoutPrograms",
                newName: "StartDate");

            migrationBuilder.AlterColumn<string>(
                name: "VideoUrl",
                table: "Exercises",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Exercises",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "Exercises",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "DietPrograms",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    MealName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Time = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DietPrograms", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DietPrograms_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WorkoutDays",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    WorkoutProgramId = table.Column<int>(type: "int", nullable: false),
                    DayName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkoutDays", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkoutDays_WorkoutPrograms_WorkoutProgramId",
                        column: x => x.WorkoutProgramId,
                        principalTable: "WorkoutPrograms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WorkoutDayExercises",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    WorkoutDayId = table.Column<int>(type: "int", nullable: false),
                    ExerciseId = table.Column<int>(type: "int", nullable: false),
                    Sets = table.Column<int>(type: "int", nullable: false),
                    Reps = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RestTime = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkoutDayExercises", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkoutDayExercises_Exercises_ExerciseId",
                        column: x => x.ExerciseId,
                        principalTable: "Exercises",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WorkoutDayExercises_WorkoutDays_WorkoutDayId",
                        column: x => x.WorkoutDayId,
                        principalTable: "WorkoutDays",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DietPrograms_UserId",
                table: "DietPrograms",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkoutDayExercises_ExerciseId",
                table: "WorkoutDayExercises",
                column: "ExerciseId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkoutDayExercises_WorkoutDayId",
                table: "WorkoutDayExercises",
                column: "WorkoutDayId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkoutDays_WorkoutProgramId",
                table: "WorkoutDays",
                column: "WorkoutProgramId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DietPrograms");

            migrationBuilder.DropTable(
                name: "WorkoutDayExercises");

            migrationBuilder.DropTable(
                name: "WorkoutDays");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "Exercises");

            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "Exercises");

            migrationBuilder.RenameColumn(
                name: "StartDate",
                table: "WorkoutPrograms",
                newName: "CreatedDate");

            migrationBuilder.RenameColumn(
                name: "Name",
                table: "WorkoutPrograms",
                newName: "Day");

            migrationBuilder.RenameColumn(
                name: "IsActive",
                table: "WorkoutPrograms",
                newName: "IsDeleted");

            migrationBuilder.AddColumn<int>(
                name: "ExerciseId",
                table: "WorkoutPrograms",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Reps",
                table: "WorkoutPrograms",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Sets",
                table: "WorkoutPrograms",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AlterColumn<string>(
                name: "VideoUrl",
                table: "Exercises",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedDate",
                table: "Exercises",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Exercises",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "PhotoUrl",
                table: "Exercises",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_WorkoutPrograms_ExerciseId",
                table: "WorkoutPrograms",
                column: "ExerciseId");

            migrationBuilder.AddForeignKey(
                name: "FK_WorkoutPrograms_Exercises_ExerciseId",
                table: "WorkoutPrograms",
                column: "ExerciseId",
                principalTable: "Exercises",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
