namespace Fitness.Core.DTOs
{
    public class ExerciseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string MuscleGroup { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? VideoUrl { get; set; }
        public int? Sets { get; set; }
        public string? Reps { get; set; }
        public string? DayTitle { get; set; }
        public string? RestTime { get; set; }
        public string? Duration { get; set; }
        public string? Speed { get; set; }
        public string? Incline { get; set; }
    }
}
