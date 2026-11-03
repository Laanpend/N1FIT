using System;

namespace Fitness.Core.DTOs
{
    public class MemberListDto
    {
        public int Id { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public bool IsActive { get; set; }
        public bool IsStarted { get; set; } = true;
        public int DaysUntilStart { get; set; } = 0;
        public DateTime? SubscriptionEndDate { get; set; }
        public DateTime? MembershipStartDate { get; set; }
        public int? PackageId { get; set; }
        public decimal TotalDebt { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal RemainingDebt => Math.Max(0, TotalDebt - PaidAmount);
        public bool IsFrozen { get; set; }
        public DateTime? FreezeDate { get; set; }
    }
}
