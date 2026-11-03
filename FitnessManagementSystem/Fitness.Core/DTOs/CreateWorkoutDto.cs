namespace Fitness.Core.DTOs
{
    public class CreateWorkoutDto
    {
        public int UserId { get; set; }
        public int ExerciseId { get; set; }
        public string Day { get; set; } = string.Empty;
        public int Sets { get; set; }
        public int Reps { get; set; }
    }
}
