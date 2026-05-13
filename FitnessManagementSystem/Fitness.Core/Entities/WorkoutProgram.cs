using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fitness.Core.Entities
{
    public class WorkoutProgram
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User User { get; set; }
        public string Name { get; set; } // Örn: "Nisan Ayı Hacim Programı"
        public DateTime StartDate { get; set; } = DateTime.Now;
        public bool IsActive { get; set; } = true;

        // Bir programın birden fazla günü olur
        public ICollection<WorkoutDay> Days { get; set; }
    }
}
