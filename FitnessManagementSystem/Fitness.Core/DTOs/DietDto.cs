using System.Collections.Generic;

namespace Fitness.Core.DTOs
{
    public class DietDto
    {
        public int Id { get; set; }
        public string MealName { get; set; } = string.Empty;
        public string Time { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public int? Calories { get; set; }
        public List<DietMealFoodDto> Foods { get; set; } = new List<DietMealFoodDto>();
    }
}
