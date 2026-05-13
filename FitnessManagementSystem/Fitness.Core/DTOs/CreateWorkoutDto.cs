using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fitness.Core.DTOs
{
    public class CreateWorkoutDto
    {
        public int UserId { get; set; }
        public int ExerciseId { get; set; }
        public string Day { get; set; } // Pazartesi, Salı vb.
        public int Sets { get; set; }
        public int Reps { get; set; }
    }
}
