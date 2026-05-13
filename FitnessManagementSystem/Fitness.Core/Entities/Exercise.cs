using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fitness.Core.Entities
{
    public class Exercise
    {
        public int Id { get; set; }
        public string Name { get; set; } // Örn: Incline Bench Press
        public string MuscleGroup { get; set; } // Örn: Göğüs, Sırt, Ön Kol (Buna göre sağdaki menüde gruplayacağız)
        public string Description { get; set; } // Hareketin püf noktası (opsiyonel)
        public string VideoUrl { get; set; } // YouTube linki
        public string ImageUrl { get; set; } // PNG resim linki
    }
}
