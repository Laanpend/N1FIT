using Fitness.Core.DTOs;
using Fitness.Core.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Fitness.Core.Interfaces
{
    public interface IFinanceService
    {
        // Products
        Task<List<Product>> GetAllProductsAsync(bool onlyActive = false);
        Task<Product> CreateProductAsync(CreateUpdateProductDto dto);
        Task<Product> UpdateProductAsync(int id, CreateUpdateProductDto dto);
        Task<bool> DeleteProductAsync(int id);
        Task SeedDefaultProductsAsync();

        // Sales (POS)
        Task<Sale> CreateSaleAsync(CreateSaleDto dto);
        Task<List<Sale>> GetRecentSalesAsync(int count = 50);
        Task<bool> DeleteSaleAsync(int id);

        // Expenses
        Task<Expense> CreateExpenseAsync(CreateExpenseDto dto);
        Task<List<Expense>> GetExpensesAsync(DateTime? startDate = null, DateTime? endDate = null);
        Task<bool> DeleteExpenseAsync(int id);

        // Membership Payment Approvals
        Task<List<PendingMembershipPayment>> GetPendingMembershipPaymentsAsync(string status = "All");
        Task<PendingMembershipPayment> ApproveMembershipPaymentAsync(int id, ApproveMembershipPaymentDto dto);
        Task<PendingMembershipPayment> RejectMembershipPaymentAsync(int id, string? note = null);
        Task<int> SyncCurrentMonthMembershipsToPendingAsync();

        // Transactions & Dashboard Analytics
        Task<List<FinancialTransaction>> GetTransactionsAsync(DateTime? startDate = null, DateTime? endDate = null, string? type = null, string? paymentMethod = null);
        Task<FinanceDashboardDto> GetDashboardAnalyticsAsync(string period = "this_month", DateTime? customStart = null, DateTime? customEnd = null);
        Task<bool> DeleteTransactionAsync(int id);
        Task<List<FinancialTransaction>> CreateTransferAsync(CreateTransferDto dto);
        Task<FinancialTransaction> CreateZReportAsync(CreateZReportDto dto);
    }
}
