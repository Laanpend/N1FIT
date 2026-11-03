using System.Collections.Generic;

namespace Fitness.Core.Entities
{
    public class WorkoutDay
    {
        public int Id { get; set; }
        public int WorkoutProgramId { get; set; }
        public WorkoutProgram WorkoutProgram { get; set; } = null!;

        public string DayName { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;

        public ICollection<WorkoutDayExercise> Exercises { get; set; } = new List<WorkoutDayExercise>();
    }
}
