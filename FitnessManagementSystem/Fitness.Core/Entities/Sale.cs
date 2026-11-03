using System;
using System.Collections.Generic;

namespace Fitness.Core.Entities
{
    public class Sale
    {
        public int Id { get; set; }
        public string ReceiptNo { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public decimal TotalCost { get; set; }
        public string PaymentMethod { get; set; } = "Cash"; // "Cash" or "POS"
        public DateTime SaleDate { get; set; } = DateTime.Now;
        public string? Note { get; set; }

        public ICollection<SaleItem> Items { get; set; } = new List<SaleItem>();
    }

    public class SaleItem
    {
        public int Id { get; set; }
        public int SaleId { get; set; }
        public Sale? Sale { get; set; }

        public int? ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitBuyingPrice { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
    }
}
