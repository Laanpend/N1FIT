using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fitness.Core.DTOs
{
    using System;

    namespace Fitness.Core.DTOs
    {
        public class UpdateMemberDto
        {
            public string FirstName { get; set; }
            public string LastName { get; set; }
            public string Email { get; set; }

            // Şifre boş gelebilir (Adam şifresini değiştirmek istemiyorsa)
            public string? Password { get; set; }

            public string? PhoneNumber { get; set; }
            public DateTime? MembershipStartDate { get; set; }
            public DateTime? SubscriptionEndDate { get; set; }
            public int? PackageId { get; set; }
            public decimal PaidAmount { get; set; }
            public bool IsFrozen { get; set; }
        }
    }
}
