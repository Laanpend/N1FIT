using System;

namespace Fitness.Core.Entities
{
    public class FinancialTransaction
    {
        public int Id { get; set; }
        public string TransactionType { get; set; } = "Income"; // "Income" or "Expense"
        public string Source { get; set; } = "StoreSale"; // "Membership", "StoreSale", "ShopExpense", "WholesalePurchase", "Other"
        public string Category { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = "Cash"; // "Cash" or "POS"
        public DateTime TransactionDate { get; set; } = DateTime.Now;
        public string? Description { get; set; }
        public int? ReferenceId { get; set; }
    }
}
