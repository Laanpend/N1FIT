using System;

namespace Fitness.Core.Entities
{
    public class PendingMembershipPayment
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string MemberFullName { get; set; } = string.Empty;
        public int? PackageId { get; set; }
        public string PackageName { get; set; } = string.Empty;
        public string PaymentType { get; set; } = "NewRegistration"; // NewRegistration, Renewal, DebtPayment
        public decimal Amount { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected
        public string? ConfirmedPaymentMethod { get; set; } // Cash, POS
        public DateTime? ProcessedAt { get; set; }
        public string? Note { get; set; }
    }
}
