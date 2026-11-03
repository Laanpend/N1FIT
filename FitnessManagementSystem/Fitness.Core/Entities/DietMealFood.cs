using System;

namespace Fitness.Core.Entities
{
    public class DietMealFood
    {
        public int Id { get; set; }
        public int DietProgramId { get; set; }
        public DietProgram? DietProgram { get; set; }
        public int? FoodId { get; set; }
        public Food? Food { get; set; }
        public string FoodName { get; set; } = string.Empty;
        public string? Brand { get; set; }
        public double Amount { get; set; } = 100;
        public string Unit { get; set; } = "Gram";
        public int CalculatedCalories { get; set; }
        public double CalculatedProtein { get; set; }
        public double CalculatedCarbs { get; set; }
        public double CalculatedFat { get; set; }
    }
}
