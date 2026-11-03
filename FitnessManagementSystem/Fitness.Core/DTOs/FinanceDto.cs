using System;
using System.Collections.Generic;

namespace Fitness.Core.DTOs
{
    public class CreateUpdateProductDto
    {
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = "İçecek";
        public string? Barcode { get; set; }
        public decimal BuyingPrice { get; set; }
        public decimal SellingPrice { get; set; }
        public int StockQuantity { get; set; }
        public int MinStockAlert { get; set; } = 5;
        public string? ImageUrl { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class SaleItemRequestDto
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public decimal? CustomUnitPrice { get; set; }
    }

    public class CreateSaleDto
    {
        public string PaymentMethod { get; set; } = "Cash"; // "Cash", "POS", "Split", or "Veresiye"
        public decimal? CashAmount { get; set; }
        public decimal? PosAmount { get; set; }
        public decimal? DiscountAmount { get; set; }
        public int? MemberId { get; set; }
        public string? Note { get; set; }
        public List<SaleItemRequestDto> Items { get; set; } = new List<SaleItemRequestDto>();
    }

    public class BulkIncomeItemDto
    {
        public string Title { get; set; } = string.Empty;
        public string Category { get; set; } = "Spor Üyeliği"; // "Spor Üyeliği", "Açılış Kasası / Devir", "Havale / EFT", "Bar / Mağaza Satışı", "Özel Ders (PT)", "Diğer Gelir"
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = "Cash"; // "Cash", "POS", or "Split"
        public decimal? CashAmount { get; set; }
        public decimal? PosAmount { get; set; }
        public DateTime? TransactionDate { get; set; }
        public string? Description { get; set; }
    }

    public class CreateBulkIncomeDto
    {
        public DateTime? DefaultDate { get; set; }
        public string? BatchNote { get; set; }
        public List<BulkIncomeItemDto> Items { get; set; } = new List<BulkIncomeItemDto>();
    }

    public class CreateTransferDto
    {
        public string TransferType { get; set; } = "CashToPos"; // "CashToPos", "PosToCash", "OwnerWithdrawalCash", "OwnerWithdrawalPos", "CashFloatAdd"
        public decimal Amount { get; set; }
        public string? Note { get; set; }
    }

    public class CreateZReportDto
    {
        public decimal CountedCash { get; set; }
        public decimal HandedOverCash { get; set; }
        public bool AutoAdjustDiscrepancy { get; set; } = true;
        public string? Note { get; set; }
    }

    public class CreateExpenseDto
    {
        public string Title { get; set; } = string.Empty;
        public string Category { get; set; } = "Dükkan Gideri";
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = "Cash"; // "Cash" or "POS"
        public DateTime? ExpenseDate { get; set; }
        public string? Description { get; set; }
        public int? LinkedProductId { get; set; }
        public int? AddedStockQuantity { get; set; }
    }

    public class ApproveMembershipPaymentDto
    {
        public string PaymentMethod { get; set; } = "Cash"; // "Cash", "POS", or "Split"
        public decimal? Amount { get; set; }
        public decimal? CashAmount { get; set; }
        public decimal? PosAmount { get; set; }
        public string? Note { get; set; }
    }

    public class DailyFinancePointDto
    {
        public string Date { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public decimal Income { get; set; }
        public decimal Expense { get; set; }
        public decimal Net { get; set; }
    }

    public class CategoryBreakdownDto
    {
        public string Category { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public double Percentage { get; set; }
    }

    public class TopProductDto
    {
        public string ProductName { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public int TotalQuantity { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal TotalProfit { get; set; }
        public double QuantityPercentage { get; set; }
        public double RevenuePercentage { get; set; }
        public int CurrentStock { get; set; }
    }

    public class FinanceDashboardDto
    {
        public string StartDate { get; set; } = string.Empty;
        public string EndDate { get; set; } = string.Empty;
        public decimal TotalIncome { get; set; }
        public decimal TotalExpense { get; set; }
        public decimal NetProfit { get; set; }

        public decimal CashIncome { get; set; }
        public decimal CashExpense { get; set; }
        public decimal CashBalance { get; set; }

        public decimal PosIncome { get; set; }
        public decimal PosExpense { get; set; }
        public decimal PosBalance { get; set; }

        public decimal MembershipIncome { get; set; }
        public decimal StoreSaleIncome { get; set; }
        public decimal StoreSaleGrossProfit { get; set; }
        public int TotalSoldProductUnits { get; set; }

        public int PendingApprovalsCount { get; set; }
        public decimal PendingApprovalsAmount { get; set; }
        public int LowStockProductsCount { get; set; }

        public List<DailyFinancePointDto> DailyTrend { get; set; } = new List<DailyFinancePointDto>();
        public List<CategoryBreakdownDto> IncomeByCategory { get; set; } = new List<CategoryBreakdownDto>();
        public List<CategoryBreakdownDto> ExpenseByCategory { get; set; } = new List<CategoryBreakdownDto>();
        public List<CategoryBreakdownDto> PackageRevenueBreakdown { get; set; } = new List<CategoryBreakdownDto>();
        public List<TopProductDto> TopSellingProducts { get; set; } = new List<TopProductDto>();
        public List<TopProductDto> AllProductsDemand { get; set; } = new List<TopProductDto>();
    }
}
