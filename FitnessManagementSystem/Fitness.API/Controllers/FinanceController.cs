using Fitness.Core.DTOs;
using Fitness.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace Fitness.API.Controllers
{
    [Authorize(Roles = "Admin")]
    [Route("api/[controller]")]
    [ApiController]
    public class FinanceController : ControllerBase
    {
        private readonly IFinanceService _financeService;

        public FinanceController(IFinanceService financeService)
        {
            _financeService = financeService;
        }

        // ==========================================
        // 1. ÜRÜN & STOK ENDPOINTLERİ
        // ==========================================
        [HttpGet("products")]
        public async Task<IActionResult> GetProducts([FromQuery] bool onlyActive = false)
        {
            var products = await _financeService.GetAllProductsAsync(onlyActive);
            return Ok(products);
        }

        [HttpPost("products")]
        public async Task<IActionResult> CreateProduct([FromBody] CreateUpdateProductDto dto)
        {
            var product = await _financeService.CreateProductAsync(dto);
            return Ok(product);
        }

        [HttpPut("products/{id}")]
        public async Task<IActionResult> UpdateProduct(int id, [FromBody] CreateUpdateProductDto dto)
        {
            var product = await _financeService.UpdateProductAsync(id, dto);
            return Ok(product);
        }

        [HttpDelete("products/{id}")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            bool deleted = await _financeService.DeleteProductAsync(id);
            if (!deleted) return NotFound(new { message = "Ürün bulunamadı." });
            return Ok(new { message = "Ürün silindi." });
        }

        // ==========================================
        // 2. HIZLI SATIŞ (POS) ENDPOINTLERİ
        // ==========================================
        [HttpPost("sales")]
        public async Task<IActionResult> CreateSale([FromBody] CreateSaleDto dto)
        {
            var sale = await _financeService.CreateSaleAsync(dto);
            return Ok(sale);
        }

        [HttpGet("sales")]
        public async Task<IActionResult> GetRecentSales([FromQuery] int count = 50)
        {
            var sales = await _financeService.GetRecentSalesAsync(count);
            return Ok(sales);
        }

        [HttpDelete("sales/{id}")]
        public async Task<IActionResult> DeleteSale(int id)
        {
            bool deleted = await _financeService.DeleteSaleAsync(id);
            if (!deleted) return NotFound(new { message = "Satış fişi bulunamadı." });
            return Ok(new { message = "Satış iptal edildi ve stoklar iade edildi." });
        }

        // ==========================================
        // 3. GİDER YÖNETİMİ ENDPOINTLERİ
        // ==========================================
        [HttpPost("expenses")]
        public async Task<IActionResult> CreateExpense([FromBody] CreateExpenseDto dto)
        {
            var expense = await _financeService.CreateExpenseAsync(dto);
            return Ok(expense);
        }

        [HttpGet("expenses")]
        public async Task<IActionResult> GetExpenses([FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null)
        {
            var expenses = await _financeService.GetExpensesAsync(startDate, endDate);
            return Ok(expenses);
        }

        [HttpDelete("expenses/{id}")]
        public async Task<IActionResult> DeleteExpense(int id)
        {
            bool deleted = await _financeService.DeleteExpenseAsync(id);
            if (!deleted) return NotFound(new { message = "Gider kaydı bulunamadı." });
            return Ok(new { message = "Gider kaydı silindi." });
        }

        // ==========================================
        // 4. ÜYELİK GELİR ONAY HAVUZU ENDPOINTLERİ
        // ==========================================
        [HttpGet("pending-memberships")]
        public async Task<IActionResult> GetPendingMemberships([FromQuery] string status = "All")
        {
            var list = await _financeService.GetPendingMembershipPaymentsAsync(status);
            return Ok(list);
        }

        [HttpPost("pending-memberships/{id}/approve")]
        public async Task<IActionResult> ApproveMembershipPayment(int id, [FromBody] ApproveMembershipPaymentDto dto)
        {
            var updated = await _financeService.ApproveMembershipPaymentAsync(id, dto);
            return Ok(updated);
        }

        [HttpPost("pending-memberships/{id}/reject")]
        public async Task<IActionResult> RejectMembershipPayment(int id, [FromQuery] string? note = null)
        {
            var updated = await _financeService.RejectMembershipPaymentAsync(id, note);
            return Ok(updated);
        }

        // ==========================================
        // 5. KASA DEFTERİ & ANALİTİK DASHBOARD
        // ==========================================
        [HttpGet("transactions")]
        public async Task<IActionResult> GetTransactions(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] string? type = null,
            [FromQuery] string? paymentMethod = null)
        {
            var transactions = await _financeService.GetTransactionsAsync(startDate, endDate, type, paymentMethod);
            return Ok(transactions);
        }

        [HttpDelete("transactions/{id}")]
        public async Task<IActionResult> DeleteTransaction(int id)
        {
            bool deleted = await _financeService.DeleteTransactionAsync(id);
            if (!deleted) return NotFound(new { message = "Kasa hareketi bulunamadı." });
            return Ok(new { message = "Kasa hareketi silindi." });
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard(
            [FromQuery] string period = "this_month",
            [FromQuery] DateTime? customStart = null,
            [FromQuery] DateTime? customEnd = null)
        {
            var analytics = await _financeService.GetDashboardAnalyticsAsync(period, customStart, customEnd);
            return Ok(analytics);
        }

        [HttpPost("transfers")]
        public async Task<IActionResult> CreateTransfer([FromBody] CreateTransferDto dto)
        {
            var result = await _financeService.CreateTransferAsync(dto);
            return Ok(result);
        }

        [HttpPost("z-report")]
        public async Task<IActionResult> CreateZReport([FromBody] CreateZReportDto dto)
        {
            var result = await _financeService.CreateZReportAsync(dto);
            return Ok(result);
        }
    }
}
