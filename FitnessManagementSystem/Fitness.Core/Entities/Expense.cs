using System;

namespace Fitness.Core.Entities
{
    public class Expense
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Category { get; set; } = "Dükkan Gideri"; // Kira, Elektrik, Su, Doğalgaz, Personel, Toptan Ürün Alımı, Temizlik, Bakım/Onarım, Diğer
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = "Cash"; // "Cash" or "POS"
        public DateTime ExpenseDate { get; set; } = DateTime.Now;
        public string? Description { get; set; }
        public int? LinkedProductId { get; set; }
        public int? AddedStockQuantity { get; set; }
    }
}
