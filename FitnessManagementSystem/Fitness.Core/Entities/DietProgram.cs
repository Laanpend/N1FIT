using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fitness.Core.Entities
{
    public class DietProgram
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User User { get; set; }

        public string MealName { get; set; } // Örn: "Kahvaltı", "1. Ara Öğün"
        public string Content { get; set; } // Örn: "4 yumurta, 100gr yulaf, fıstık ezmesi..."
        public string Time { get; set; } // Örn: "08:30" veya "Antrenmandan 2 saat önce"

        public DateTime CreatedDate { get; set; } = DateTime.Now;
    }
}
