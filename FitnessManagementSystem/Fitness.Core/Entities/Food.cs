using System;

namespace Fitness.Core.Entities
{
    public class Food
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
        public DateTime CreatedDate { get; set; } = DateTime.Now;
    }
}
