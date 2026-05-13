using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fitness.Core.Entities
{
    public class WorkoutDayExercise
    {
        public int Id { get; set; }
        public int WorkoutDayId { get; set; }
        public WorkoutDay WorkoutDay { get; set; }

        public int ExerciseId { get; set; }
        public Exercise Exercise { get; set; } // Hareketin kendisi (Kütüphaneden çekeceğiz)

        public int Sets { get; set; } // Örn: 4
        public string Reps { get; set; } // Örn: "12-10-8-8" veya "Tükenişe kadar"
        public string RestTime { get; set; } // Örn: "90 sn"

        public string Duration { get; set; } // Örn: "30 dk"
        public string Speed { get; set; } // Örn: "6.5"
        public string Incline { get; set; } // Örn: "5" veya "%10"
    }
}
