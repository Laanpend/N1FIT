using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fitness.Core.Entities
{
    public class Package : BaseEntity
    {
        public string Name { get; set; } // 1 Aylık, VIP vb.
        public decimal Price { get; set; }
        public int DurationMonth { get; set; }
    }
}
