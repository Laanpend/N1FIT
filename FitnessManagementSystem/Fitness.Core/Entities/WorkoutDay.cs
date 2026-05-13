using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fitness.Core.Entities
{
    public class WorkoutDay
    {
        public int Id { get; set; }
        public int WorkoutProgramId { get; set; }
        public WorkoutProgram WorkoutProgram { get; set; }

        public string DayName { get; set; } // Örn: "1. Gün" veya "Pazartesi"
        public string Title { get; set; } // Örn: "Hipertrofi + Güç" veya "Göğüs & Ön Kol"

        // Bir günün içinde birden fazla hareket olur
        public ICollection<WorkoutDayExercise> Exercises { get; set; }
    }
}
