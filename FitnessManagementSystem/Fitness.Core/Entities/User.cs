using Fitness.Core.Enums;
using System;

namespace Fitness.Core.Entities
{
    public class User : BaseEntity
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public UserRole Role { get; set; }
        public bool IsActive { get; set; } = true;

        public int? CurrentPackageId { get; set; }
        public DateTime? SubscriptionEndDate { get; set; }

        public string? PhoneNumber { get; set; }
        public DateTime? MembershipStartDate { get; set; }

        public int? PackageId { get; set; }
        public decimal TotalDebt { get; set; }
        public decimal PaidAmount { get; set; }

        public bool IsFrozen { get; set; }
        public DateTime? FreezeDate { get; set; }

        public string? PushEndpoint { get; set; }
        public string? PushP256DH { get; set; }
        public string? PushAuth { get; set; }

        // Vücut Kompozisyonu & Yağ Oranı Hesaplayıcı için kullanıcı fiziksel profil bilgileri
        public int? Age { get; set; }
        public double? Height { get; set; }
        public string? Gender { get; set; }

        // Üyelik bitimine son 3 gün kala gönderilen SMS'in tekrar etmemesi için son gönderim tarihi
        public DateTime? LastExpirySmsDate { get; set; }

        // Diyet programı için günlük hedef kalori (kcal)
        public int? TargetCalories { get; set; }
    }
}
