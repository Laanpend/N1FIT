namespace Fitness.Core.Entities
{
    public class WorkoutDayExercise
    {
        public int Id { get; set; }
        public int WorkoutDayId { get; set; }
        public WorkoutDay WorkoutDay { get; set; } = null!;

        public int ExerciseId { get; set; }
        public Exercise Exercise { get; set; } = null!;

        public int Sets { get; set; }
        public string Reps { get; set; } = string.Empty;
        public string RestTime { get; set; } = string.Empty;

        public string Duration { get; set; } = string.Empty;
        public string Speed { get; set; } = string.Empty;
        public string Incline { get; set; } = string.Empty;
    }
}
