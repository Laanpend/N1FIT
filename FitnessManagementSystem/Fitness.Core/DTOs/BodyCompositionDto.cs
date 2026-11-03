using System;

namespace Fitness.Core.DTOs
{
    public class BodyProfileDto
    {
        public int? Age { get; set; }
        public double? Height { get; set; }
        public string? Gender { get; set; }
        public double? LatestWeight { get; set; }
        public double? LatestNeck { get; set; }
        public double? LatestWaist { get; set; }
        public double? LatestHips { get; set; }
        public DateTime? LatestMeasurementDate { get; set; }
    }

    public class BodyCompositionRequestDto
    {
        public int Age { get; set; }
        public double Height { get; set; }
        public string Gender { get; set; } = "male";
        public double Weight { get; set; }
        public double Neck { get; set; }
        public double Waist { get; set; }
        public double? Hips { get; set; }
    }

    public class BodyCompositionResultDto
    {
        public double BodyFatPercentage { get; set; }
        public double FatMassKg { get; set; }
        public double LeanBodyMassKg { get; set; }
        public double Bmi { get; set; }
        public double Ffmi { get; set; }
        public double NormalizedFfmi { get; set; }
        public double WaistToHeightRatio { get; set; }

        public double IdealWeightMinKg { get; set; }
        public double IdealWeightMaxKg { get; set; }
        public double IdealBodyFatMinPct { get; set; }
        public double IdealBodyFatMaxPct { get; set; }

        public string BodyFatCategory { get; set; } = string.Empty;
        public string BodyFatColor { get; set; } = string.Empty;
        public string BmiCategory { get; set; } = string.Empty;
        public string FfmiCategory { get; set; } = string.Empty;
        public string FfmiColor { get; set; } = string.Empty;
        public bool IsPotentialDoping { get; set; }
        public string SummaryStatus { get; set; } = string.Empty;
    }
}
