using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fitness.Core.DTOs
{
    public class RenewDto
    {
        public int PackageId { get; set; } // Artık elle ay yazmak yok, paketi çakıyoruz!
        public decimal PaidAmount { get; set; } // Adamın elden verdiği nakit
    }
}
