using System;
using System.Collections.Generic;

namespace Fitness.Core.Entities
{
    public class DietProgram
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User? User { get; set; }

        public string MealName { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string Time { get; set; } = string.Empty;
        public int? Calories { get; set; }

        public ICollection<DietMealFood> Foods { get; set; } = new List<DietMealFood>();

        public DateTime CreatedDate { get; set; } = DateTime.Now;
    }
}
