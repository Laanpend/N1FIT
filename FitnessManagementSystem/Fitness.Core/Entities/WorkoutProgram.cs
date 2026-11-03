using System;
using System.Collections.Generic;

namespace Fitness.Core.Entities
{
    public class WorkoutProgram
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User? User { get; set; }
        public string Name { get; set; } = string.Empty;
        public DateTime StartDate { get; set; } = DateTime.Now;
        public bool IsActive { get; set; } = true;

        public ICollection<WorkoutDay> Days { get; set; } = new List<WorkoutDay>();
    }
}
