using System;
using System.Collections.Generic;

namespace Fitness.Core.DTOs
{
    public class MemberProfileDto
    {
        public int Id { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string FullName => $"{FirstName} {LastName}".Trim();
        public string Email { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public int? PackageId { get; set; }
        public string PackageName { get; set; } = "Paket Yok";
        public DateTime? MembershipStartDate { get; set; }
        public DateTime? SubscriptionEndDate { get; set; }
        public bool IsActive { get; set; }
        public bool IsStarted { get; set; } = true;
        public int DaysUntilStart { get; set; } = 0;
        public bool IsFrozen { get; set; }
        public DateTime? FreezeDate { get; set; }
        public int DaysLeft { get; set; }

        public List<DietDto> Diets { get; set; } = new List<DietDto>();
        public List<ExerciseDto> Workouts { get; set; } = new List<ExerciseDto>();
        public List<MeasurementDto> Measurements { get; set; } = new List<MeasurementDto>();

        public decimal PackagePrice { get; set; }
        public decimal GrossTotalDebt { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal RemainingDebt { get; set; }
        // Frontend uyumluluğu için (MembershipTab kalan borcu TotalDebt üzerinden okuyor)
        public decimal TotalDebt { get; set; }

        public int? Age { get; set; }
        public double? Height { get; set; }
        public string? Gender { get; set; }
        public int? TargetCalories { get; set; }
    }
}
