namespace Fitness.Core.DTOs
{
    public class FoodDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Brand { get; set; }
        public string Category { get; set; } = "Genel";
        public double CaloriesPer100g { get; set; }
        public double ProteinPer100g { get; set; }
        public double CarbsPer100g { get; set; }
        public double FatPer100g { get; set; }
        public string DefaultUnit { get; set; } = "Gram";
        public double DefaultWeightGrams { get; set; } = 100;
        public string Source { get; set; } = "System";
        public string? ExternalApiId { get; set; }
    }

    public class DietMealFoodDto
    {
        public int Id { get; set; }
        public int? FoodId { get; set; }
        public string FoodName { get; set; } = string.Empty;
        public string? Brand { get; set; }
        public string Category { get; set; } = "Genel";
        public double Amount { get; set; } = 100;
        public string Unit { get; set; } = "Gram";
        public int CalculatedCalories { get; set; }
        public double CalculatedProtein { get; set; }
        public double CalculatedCarbs { get; set; }
        public double CalculatedFat { get; set; }

        // Dış API'den (Open Food Facts) ilk kez ekleniyorsa yerel veritabanına önbelleklemek (Auto-Cache) için:
        public double CaloriesPer100g { get; set; }
        public double ProteinPer100g { get; set; }
        public double CarbsPer100g { get; set; }
        public double FatPer100g { get; set; }
        public string DefaultUnit { get; set; } = "Gram";
        public double DefaultWeightGrams { get; set; } = 100;
        public string Source { get; set; } = "System";
        public string? ExternalApiId { get; set; }
    }
}
