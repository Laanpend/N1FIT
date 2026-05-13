using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fitness.Core.DTOs
{
    namespace Fitness.Core.DTOs
    {
        public class SaveWorkoutProgramDto
        {
            public List<WorkoutDayDto> Days { get; set; } = new List<WorkoutDayDto>();
        }

        public class WorkoutDayDto
        {
            // Soru işareti eklendi (Boş gelebilir)
            public string? Title { get; set; }
            public List<WorkoutDayExerciseDto> Exercises { get; set; } = new List<WorkoutDayExerciseDto>();
        }

        public class WorkoutDayExerciseDto
        {
            public int ExerciseId { get; set; }
            public int Sets { get; set; } // Sayı olduğu için bu sıfır gidecek, sorun yok

            // BUNLARIN HEPSİNE SORU İŞARETİ EKLENDİ
            public string? Reps { get; set; }
            public string? RestTime { get; set; }
            public string? Duration { get; set; }
            public string? Speed { get; set; }
            public string? Incline { get; set; }
        }
    }
}
