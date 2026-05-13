using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fitness.Core.Entities
{
    public class MembershipPackage : BaseEntity
    {
        public string Name { get; set; } // "1 Aylık VIP", "6 Aylık Standart"
        public decimal Price { get; set; } // 1500.00
        public int DurationMonths { get; set; } // 1, 6, 12 ay
    }
}
