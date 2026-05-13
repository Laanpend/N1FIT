using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Fitness.Data.Migrations
{
    /// <inheritdoc />
    public partial class UpdatedMeasurementFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedDate",
                table: "Measurements");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Measurements");

            migrationBuilder.RenameColumn(
                name: "Arm",
                table: "Measurements",
                newName: "RightArm");

            migrationBuilder.AddColumn<double>(
                name: "Chest",
                table: "Measurements",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "LeftArm",
                table: "Measurements",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "Neck",
                table: "Measurements",
                type: "float",
                nullable: false,
                defaultValue: 0.0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Chest",
                table: "Measurements");

            migrationBuilder.DropColumn(
                name: "LeftArm",
                table: "Measurements");

            migrationBuilder.DropColumn(
                name: "Neck",
                table: "Measurements");

            migrationBuilder.RenameColumn(
                name: "RightArm",
                table: "Measurements",
                newName: "Arm");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedDate",
                table: "Measurements",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Measurements",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }
    }
}
