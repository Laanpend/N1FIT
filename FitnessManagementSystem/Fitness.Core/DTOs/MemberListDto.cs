using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fitness.Core.DTOs
{
    public class MemberListDto
    {
        public int Id { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string? PhoneNumber { get; set; }
        public bool IsActive { get; set; }
        public DateTime? SubscriptionEndDate { get; set; }

        // Bu DTO'nun içine şunları kesin ekle:
        public DateTime? MembershipStartDate { get; set; }
        public decimal TotalDebt { get; set; }
        public decimal PaidAmount { get; set; }
        public bool IsFrozen { get; set; }
        public DateTime? FreezeDate { get; set; }
    }
}
