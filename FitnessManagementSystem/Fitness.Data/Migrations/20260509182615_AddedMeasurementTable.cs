using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Fitness.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddedMeasurementTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Chest",
                table: "Measurements");

            migrationBuilder.RenameColumn(
                name: "MeasurementDate",
                table: "Measurements",
                newName: "RecordDate");

            migrationBuilder.AlterColumn<double>(
                name: "Waist",
                table: "Measurements",
                type: "float",
                nullable: false,
                defaultValue: 0.0,
                oldClrType: typeof(double),
                oldType: "float",
                oldNullable: true);

            migrationBuilder.AlterColumn<double>(
                name: "Arm",
                table: "Measurements",
                type: "float",
                nullable: false,
                defaultValue: 0.0,
                oldClrType: typeof(double),
                oldType: "float",
                oldNullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Shoulder",
                table: "Measurements",
                type: "float",
                nullable: false,
                defaultValue: 0.0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Shoulder",
                table: "Measurements");

            migrationBuilder.RenameColumn(
                name: "RecordDate",
                table: "Measurements",
                newName: "MeasurementDate");

            migrationBuilder.AlterColumn<double>(
                name: "Waist",
                table: "Measurements",
                type: "float",
                nullable: true,
                oldClrType: typeof(double),
                oldType: "float");

            migrationBuilder.AlterColumn<double>(
                name: "Arm",
                table: "Measurements",
                type: "float",
                nullable: true,
                oldClrType: typeof(double),
                oldType: "float");

            migrationBuilder.AddColumn<double>(
                name: "Chest",
                table: "Measurements",
                type: "float",
                nullable: true);
        }
    }
}
