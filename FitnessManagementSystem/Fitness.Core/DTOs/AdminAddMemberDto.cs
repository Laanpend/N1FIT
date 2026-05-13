using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fitness.Core.DTOs
{
    public class AdminAddMemberDto
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public DateTime SubscriptionEndDate { get; set; } // Adminin seçeceği tarih

        public string? PhoneNumber { get; set; }
        public DateTime? MembershipStartDate { get; set; }
        public int? PackageId { get; set; }
        public decimal PaidAmount { get; set; }
    }
}
