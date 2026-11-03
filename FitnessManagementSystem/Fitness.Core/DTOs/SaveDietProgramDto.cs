using System.Collections.Generic;

namespace Fitness.Core.DTOs
{
    public class SaveDietProgramDto
    {
        public int? TargetCalories { get; set; }
        public List<DietDto> Meals { get; set; } = new List<DietDto>();
    }

    public class SetTargetCaloriesDto
    {
        public int? TargetCalories { get; set; }
        public int? Age { get; set; }
        public double? Height { get; set; }
        public string? Gender { get; set; }
    }
}
