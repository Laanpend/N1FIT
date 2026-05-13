using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fitness.Core.DTOs
{
    public class MeasurementDto
    {
        public int Id { get; set; }
        public double Weight { get; set; }
        public double Shoulder { get; set; }
        public double Chest { get; set; }
        public double LeftArm { get; set; }
        public double RightArm { get; set; }
        public double Waist { get; set; }
        public double Neck { get; set; }
        public DateTime RecordDate { get; set; }
    }
}
