using System;

namespace Fitness.Core.DTOs
{
    public class UpdateMemberDto
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Password { get; set; }
        public string? PhoneNumber { get; set; }
        public DateTime? MembershipStartDate { get; set; }
        public DateTime? SubscriptionEndDate { get; set; }
        public int? PackageId { get; set; }
        public decimal PaidAmount { get; set; }
        public bool IsFrozen { get; set; }
    }
}
