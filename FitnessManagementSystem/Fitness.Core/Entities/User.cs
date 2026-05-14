using Fitness.Core.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fitness.Core.Entities
{
    public class User : BaseEntity
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string PasswordHash { get; set; } // Şifreyi açık yazmıyoruz, hash'leyeceğiz!
        public UserRole Role { get; set; }
        public bool IsActive { get; set; } = true;

        // Müşteriye özel alanlar (Sadece Member rolündekiler dolduracak)
        public int? CurrentPackageId { get; set; }
        public DateTime? SubscriptionEndDate { get; set; }

        // Diğer Ad, Email, Password falan duruyor, onların altına şunları çak:
        public string? PhoneNumber { get; set; }          // Adamın telefonu
        public DateTime? MembershipStartDate { get; set; } // Spora başladığı gün

        public int? PackageId { get; set; }       // Aldığı paketin ID'si
        public decimal TotalDebt { get; set; }    // Paketin toplam fiyatı (Borcu)
        public decimal PaidAmount { get; set; }   // Peşin verdiği para

        public bool IsFrozen { get; set; }
        public DateTime? FreezeDate { get; set; }
    }
}
