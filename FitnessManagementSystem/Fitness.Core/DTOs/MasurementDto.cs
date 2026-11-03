using System;

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

        // İsteğe bağlı (zorunlu olmayan) ölçüler
        public double? Hips { get; set; }
        public double? RightLeg { get; set; }
        public double? LeftLeg { get; set; }

        public DateTime RecordDate { get; set; }
    }
}
