using System;

namespace Fitness.Core.DTOs
{
    public class RenewDto
    {
        public int PackageId { get; set; }
        public decimal PaidAmount { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
    }
}
