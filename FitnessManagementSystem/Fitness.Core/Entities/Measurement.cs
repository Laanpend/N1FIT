using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fitness.Core.Entities
{
    public class Measurement
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User User { get; set; }

        public double Weight { get; set; }
        public double Shoulder { get; set; }
        public double Chest { get; set; } // YENİ: Göğüs
        public double LeftArm { get; set; } // YENİ: Sol Kol
        public double RightArm { get; set; } // YENİ: Sağ Kol
        public double Waist { get; set; }
        public double Neck { get; set; } // YENİ: Boyun

        public DateTime RecordDate { get; set; } = DateTime.Now;
    }
}
