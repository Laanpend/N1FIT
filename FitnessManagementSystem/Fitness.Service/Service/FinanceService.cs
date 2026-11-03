using Fitness.Core.DTOs;
using Fitness.Core.Entities;
using Fitness.Core.Enums;
using Fitness.Core.Interfaces;
using Fitness.Data.Context;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;

namespace Fitness.Service.Service
{
    public class FinanceService : IFinanceService
    {
        private readonly FitnessDbContext _context;

        public FinanceService(FitnessDbContext context)
        {
            _context = context;
        }

        // ==========================================
        // 1. ÜRÜN & STOK YÖNETİMİ
        // ==========================================
        public async Task<List<Product>> GetAllProductsAsync(bool onlyActive = false)
        {
            var query = _context.Products.AsNoTracking().AsQueryable();
            if (onlyActive)
                query = query.Where(p => p.IsActive);

            return await query.OrderBy(p => p.Category).ThenBy(p => p.Name).ToListAsync();
        }

        public async Task<Product> CreateProductAsync(CreateUpdateProductDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                throw new ArgumentException("Ürün adı boş olamaz.");

            var product = new Product
            {
                Name = dto.Name.Trim(),
                Category = string.IsNullOrWhiteSpace(dto.Category) ? "İçecek" : dto.Category.Trim(),
                Barcode = dto.Barcode?.Trim(),
                BuyingPrice = Math.Max(0, dto.BuyingPrice),
                SellingPrice = Math.Max(0, dto.SellingPrice),
                StockQuantity = Math.Max(0, dto.StockQuantity),
                MinStockAlert = Math.Max(0, dto.MinStockAlert),
                ImageUrl = dto.ImageUrl?.Trim(),
                IsActive = dto.IsActive,
                CreatedDate = DateTime.Now
            };

            await _context.Products.AddAsync(product);
            await _context.SaveChangesAsync();
            return product;
        }

        public async Task<Product> UpdateProductAsync(int id, CreateUpdateProductDto dto)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null)
                throw new KeyNotFoundException("Ürün bulunamadı.");

            product.Name = dto.Name.Trim();
            product.Category = string.IsNullOrWhiteSpace(dto.Category) ? "İçecek" : dto.Category.Trim();
            product.Barcode = dto.Barcode?.Trim();
            product.BuyingPrice = Math.Max(0, dto.BuyingPrice);
            product.SellingPrice = Math.Max(0, dto.SellingPrice);
            product.StockQuantity = Math.Max(0, dto.StockQuantity);
            product.MinStockAlert = Math.Max(0, dto.MinStockAlert);
            product.ImageUrl = dto.ImageUrl?.Trim();
            product.IsActive = dto.IsActive;

            _context.Products.Update(product);
            await _context.SaveChangesAsync();
            return product;
        }

        public async Task<bool> DeleteProductAsync(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null) return false;

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task SeedDefaultProductsAsync()
        {
            if (await _context.Products.AnyAsync())
                return;

            var defaults = new List<Product>
            {
                new Product { Name = "Su (0.5L)", Category = "İçecek", BuyingPrice = 4, SellingPrice = 10, StockQuantity = 120, MinStockAlert = 20, IsActive = true },
                new Product { Name = "Büyük Su (1.5L)", Category = "İçecek", BuyingPrice = 8, SellingPrice = 20, StockQuantity = 60, MinStockAlert = 15, IsActive = true },
                new Product { Name = "Maden Suyu (Sade)", Category = "İçecek", BuyingPrice = 7, SellingPrice = 20, StockQuantity = 48, MinStockAlert = 12, IsActive = true },
                new Product { Name = "Filtre Kahve / Espresso", Category = "İçecek", BuyingPrice = 12, SellingPrice = 45, StockQuantity = 80, MinStockAlert = 10, IsActive = true },
                new Product { Name = "Şekersiz Enerji İçeceği", Category = "İçecek", BuyingPrice = 28, SellingPrice = 60, StockQuantity = 36, MinStockAlert = 8, IsActive = true },
                new Product { Name = "Whey Protein Shake (Tek Servis)", Category = "Supplement", BuyingPrice = 35, SellingPrice = 80, StockQuantity = 50, MinStockAlert = 10, IsActive = true },
                new Product { Name = "Pre-Workout Shot (Antrenman Öncesi)", Category = "Supplement", BuyingPrice = 30, SellingPrice = 75, StockQuantity = 40, MinStockAlert = 8, IsActive = true },
                new Product { Name = "BCAA + Glutamine Servis", Category = "Supplement", BuyingPrice = 22, SellingPrice = 55, StockQuantity = 45, MinStockAlert = 10, IsActive = true },
                new Product { Name = "L-Carnitine Shot 3000mg", Category = "Supplement", BuyingPrice = 28, SellingPrice = 70, StockQuantity = 30, MinStockAlert = 8, IsActive = true },
                new Product { Name = "Protein Bar (Çikolatalı)", Category = "Atıştırmalık", BuyingPrice = 32, SellingPrice = 70, StockQuantity = 30, MinStockAlert = 6, IsActive = true },
                new Product { Name = "Pirinç Patlağı (Rice Cake)", Category = "Atıştırmalık", BuyingPrice = 18, SellingPrice = 40, StockQuantity = 25, MinStockAlert = 5, IsActive = true },
                new Product { Name = "Antrenman Havlusu", Category = "Ekipman", BuyingPrice = 65, SellingPrice = 160, StockQuantity = 15, MinStockAlert = 3, IsActive = true },
                new Product { Name = "Lifting Strap (Çekiş Kayışı)", Category = "Ekipman", BuyingPrice = 110, SellingPrice = 250, StockQuantity = 10, MinStockAlert = 2, IsActive = true }
            };

            await _context.Products.AddRangeAsync(defaults);
            await _context.SaveChangesAsync();
        }

        // ==========================================
        // 2. HIZLI SATIŞ (POS) İŞLEMLERİ
        // ==========================================
        public async Task<Sale> CreateSaleAsync(CreateSaleDto dto)
        {
            if (dto.Items == null || !dto.Items.Any())
                throw new ArgumentException("Satış sepeti boş olamaz.");

            var paymentMethod = NormalizePaymentMethod(dto.PaymentMethod);
            var now = DateTime.Now;
            var receiptNo = $"FIS-{now:yyyyMMdd-HHmmss}-{Guid.NewGuid().ToString("N").Substring(0, 4).ToUpper()}";

            var sale = new Sale
            {
                ReceiptNo = receiptNo,
                PaymentMethod = paymentMethod,
                SaleDate = now,
                Note = dto.Note?.Trim(),
                Items = new List<SaleItem>()
            };

            decimal totalAmount = 0;
            decimal totalCost = 0;
            var summaryNames = new List<string>();

            foreach (var reqItem in dto.Items)
            {
                if (reqItem.Quantity <= 0) continue;

                var product = await _context.Products.FindAsync(reqItem.ProductId);
                if (product == null)
                    throw new KeyNotFoundException($"ID: {reqItem.ProductId} olan ürün bulunamadı.");

                decimal unitPrice = (reqItem.CustomUnitPrice.HasValue && reqItem.CustomUnitPrice.Value >= 0)
                    ? reqItem.CustomUnitPrice.Value
                    : product.SellingPrice;

                decimal lineTotal = unitPrice * reqItem.Quantity;
                decimal lineCost = product.BuyingPrice * reqItem.Quantity;

                sale.Items.Add(new SaleItem
                {
                    ProductId = product.Id,
                    ProductName = product.Name,
                    Quantity = reqItem.Quantity,
                    UnitBuyingPrice = product.BuyingPrice,
                    UnitPrice = unitPrice,
                    TotalPrice = lineTotal
                });

                totalAmount += lineTotal;
                totalCost += lineCost;
                if (unitPrice != product.SellingPrice)
                {
                    summaryNames.Add($"{reqItem.Quantity}x {product.Name} (Özel: {unitPrice:0.##} ₺)");
                }
                else
                {
                    summaryNames.Add($"{reqItem.Quantity}x {product.Name}");
                }

                // Stok düşümü
                product.StockQuantity = Math.Max(0, product.StockQuantity - reqItem.Quantity);
                _context.Products.Update(product);
            }

            if (!sale.Items.Any())
                throw new ArgumentException("Geçerli satış kalemi bulunamadı.");

            decimal discount = Math.Max(0, dto.DiscountAmount ?? 0);
            decimal finalTotal = Math.Max(0, totalAmount - discount);

            decimal cashAmt = Math.Max(0, dto.CashAmount ?? 0);
            decimal posAmt = Math.Max(0, dto.PosAmount ?? 0);
            bool isSplit = cashAmt > 0 && posAmt > 0;
            bool isVeresiye = string.Equals(dto.PaymentMethod?.Trim(), "Veresiye", StringComparison.OrdinalIgnoreCase)
                           || string.Equals(dto.PaymentMethod?.Trim(), "Debt", StringComparison.OrdinalIgnoreCase);

            User? linkedMember = null;
            if (dto.MemberId.HasValue && dto.MemberId.Value > 0)
            {
                linkedMember = await _context.Users.FindAsync(dto.MemberId.Value);
            }

            if (isVeresiye)
            {
                if (linkedMember == null)
                    throw new ArgumentException("Veresiye (Cari Hesaba) satış yapabilmek için lütfen bir üye seçin.");

                var memberFullName = $"{linkedMember.FirstName} {linkedMember.LastName}".Trim();
                sale.PaymentMethod = $"Veresiye ({memberFullName} - ID:{linkedMember.Id})";
                linkedMember.TotalDebt += finalTotal;
                _context.Users.Update(linkedMember);
            }
            else if (isSplit)
            {
                finalTotal = cashAmt + posAmt;
                sale.PaymentMethod = $"Split ({cashAmt:0.##} ₺ Nakit + {posAmt:0.##} ₺ POS)";
            }
            else if (posAmt > 0 && cashAmt == 0)
            {
                finalTotal = posAmt;
                sale.PaymentMethod = "POS";
            }
            else if (cashAmt > 0 && posAmt == 0)
            {
                finalTotal = cashAmt;
                sale.PaymentMethod = "Cash";
            }
            else
            {
                sale.PaymentMethod = paymentMethod;
            }

            sale.TotalAmount = finalTotal;
            sale.TotalCost = totalCost;

            if (linkedMember != null)
            {
                var memberFullName = $"{linkedMember.FirstName} {linkedMember.LastName}".Trim();
                sale.Note = string.IsNullOrWhiteSpace(sale.Note)
                    ? $"Üye: {memberFullName}"
                    : $"{sale.Note} [Üye: {memberFullName}]";
            }

            if (discount > 0)
            {
                sale.Note = string.IsNullOrWhiteSpace(sale.Note)
                    ? $"İndirim: -{discount:0.##} ₺"
                    : $"{sale.Note} (İndirim: -{discount:0.##} ₺)";
            }

            await _context.Sales.AddAsync(sale);
            await _context.SaveChangesAsync();

            var summaryStr = string.Join(", ", summaryNames);
            if (summaryStr.Length > 200)
                summaryStr = summaryStr.Substring(0, 197) + "...";

            if (isVeresiye)
            {
                // Veresiye satışlarda tutar doğrudan üyenin cari borcuna (TotalDebt) eklendiği için
                // tahsilat yapılana kadar kasaya (Nakit/POS) sıcak para girişi yazılmaz.
            }
            else if (isSplit)
            {
                await _context.FinancialTransactions.AddAsync(new FinancialTransaction
                {
                    TransactionType = "Income",
                    Source = "StoreSale",
                    Category = "Bar / Mağaza Satışı",
                    Title = $"Hızlı Satış [Nakit Payı] ({summaryStr})",
                    Amount = cashAmt,
                    PaymentMethod = "Cash",
                    TransactionDate = now,
                    Description = $"Parçalı Ödeme (Nakit: {cashAmt:0.##} ₺ / POS: {posAmt:0.##} ₺) - Fiş: {receiptNo}",
                    ReferenceId = sale.Id
                });

                await _context.FinancialTransactions.AddAsync(new FinancialTransaction
                {
                    TransactionType = "Income",
                    Source = "StoreSale",
                    Category = "Bar / Mağaza Satışı",
                    Title = $"Hızlı Satış [POS Payı] ({summaryStr})",
                    Amount = posAmt,
                    PaymentMethod = "POS",
                    TransactionDate = now,
                    Description = $"Parçalı Ödeme (Nakit: {cashAmt:0.##} ₺ / POS: {posAmt:0.##} ₺) - Fiş: {receiptNo}",
                    ReferenceId = sale.Id
                });
            }
            else
            {
                var singleMethod = sale.PaymentMethod == "POS" ? "POS" : "Cash";
                var transaction = new FinancialTransaction
                {
                    TransactionType = "Income",
                    Source = "StoreSale",
                    Category = "Bar / Mağaza Satışı",
                    Title = $"Hızlı Satış ({summaryStr})",
                    Amount = sale.TotalAmount,
                    PaymentMethod = singleMethod,
                    TransactionDate = now,
                    Description = string.IsNullOrWhiteSpace(sale.Note) ? $"Fiş No: {receiptNo}" : $"{sale.Note} (Fiş: {receiptNo})",
                    ReferenceId = sale.Id
                };
                await _context.FinancialTransactions.AddAsync(transaction);
            }

            await _context.SaveChangesAsync();

            return sale;
        }

        public async Task<List<Sale>> GetRecentSalesAsync(int count = 50)
        {
            return await _context.Sales
                .Include(s => s.Items)
                .AsNoTracking()
                .OrderByDescending(s => s.SaleDate)
                .Take(count)
                .ToListAsync();
        }

        public async Task<bool> DeleteSaleAsync(int id)
        {
            var sale = await _context.Sales.Include(s => s.Items).FirstOrDefaultAsync(s => s.Id == id);
            if (sale == null) return false;

            // Stokları geri iade et
            foreach (var item in sale.Items)
            {
                if (item.ProductId.HasValue)
                {
                    var product = await _context.Products.FindAsync(item.ProductId.Value);
                    if (product != null)
                    {
                        product.StockQuantity += item.Quantity;
                        _context.Products.Update(product);
                    }
                }
            }

            // Eğer Veresiye satışsa üyenin cari borcundan da geri düş
            if (!string.IsNullOrEmpty(sale.PaymentMethod) && sale.PaymentMethod.StartsWith("Veresiye", StringComparison.OrdinalIgnoreCase))
            {
                var idMarker = "ID:";
                var idx = sale.PaymentMethod.IndexOf(idMarker, StringComparison.OrdinalIgnoreCase);
                if (idx >= 0)
                {
                    var rawId = sale.PaymentMethod.Substring(idx + idMarker.Length).TrimEnd(')', ' ');
                    if (int.TryParse(rawId, out int memberId))
                    {
                        var member = await _context.Users.FindAsync(memberId);
                        if (member != null)
                        {
                            member.TotalDebt = Math.Max(0, member.TotalDebt - sale.TotalAmount);
                            _context.Users.Update(member);
                        }
                    }
                }
            }

            // İlgili kasa hareketini sil
            var relatedTx = await _context.FinancialTransactions
                .Where(t => t.Source == "StoreSale" && t.ReferenceId == sale.Id)
                .ToListAsync();

            if (relatedTx.Any())
                _context.FinancialTransactions.RemoveRange(relatedTx);

            _context.Sales.Remove(sale);
            await _context.SaveChangesAsync();
            return true;
        }

        // ==========================================
        // 3. GİDER YÖNETİMİ (DÜKKAN & TOPTAN ALIŞ)
        // ==========================================
        public async Task<Expense> CreateExpenseAsync(CreateExpenseDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Title))
                throw new ArgumentException("Gider başlığı boş olamaz.");
            if (dto.Amount <= 0)
                throw new ArgumentException("Gider tutarı sıfırdan büyük olmalıdır.");

            var paymentMethod = NormalizePaymentMethod(dto.PaymentMethod);
            var expenseDate = dto.ExpenseDate ?? DateTime.Now;

            var expense = new Expense
            {
                Title = dto.Title.Trim(),
                Category = string.IsNullOrWhiteSpace(dto.Category) ? "Dükkan Gideri" : dto.Category.Trim(),
                Amount = dto.Amount,
                PaymentMethod = paymentMethod,
                ExpenseDate = expenseDate,
                Description = dto.Description?.Trim(),
                LinkedProductId = dto.LinkedProductId,
                AddedStockQuantity = dto.AddedStockQuantity
            };

            // Eğer toptan ürün alımıysa ve bir ürün seçilmişse stoğu otomatik artır
            if (dto.LinkedProductId.HasValue && dto.AddedStockQuantity.HasValue && dto.AddedStockQuantity.Value > 0)
            {
                var product = await _context.Products.FindAsync(dto.LinkedProductId.Value);
                if (product != null)
                {
                    product.StockQuantity += dto.AddedStockQuantity.Value;
                    _context.Products.Update(product);
                }
            }

            await _context.Expenses.AddAsync(expense);
            await _context.SaveChangesAsync();

            var txSource = expense.Category.Contains("Toptan", StringComparison.OrdinalIgnoreCase)
                ? "WholesalePurchase"
                : "ShopExpense";

            var transaction = new FinancialTransaction
            {
                TransactionType = "Expense",
                Source = txSource,
                Category = expense.Category,
                Title = expense.Title,
                Amount = expense.Amount,
                PaymentMethod = paymentMethod,
                TransactionDate = expenseDate,
                Description = expense.Description,
                ReferenceId = expense.Id
            };

            await _context.FinancialTransactions.AddAsync(transaction);
            await _context.SaveChangesAsync();

            return expense;
        }

        public async Task<List<Expense>> GetExpensesAsync(DateTime? startDate = null, DateTime? endDate = null)
        {
            var query = _context.Expenses.AsNoTracking().AsQueryable();
            if (startDate.HasValue)
                query = query.Where(e => e.ExpenseDate >= startDate.Value.Date);
            if (endDate.HasValue)
                query = query.Where(e => e.ExpenseDate <= endDate.Value.Date.AddDays(1).AddTicks(-1));

            return await query.OrderByDescending(e => e.ExpenseDate).ToListAsync();
        }

        public async Task<bool> DeleteExpenseAsync(int id)
        {
            var expense = await _context.Expenses.FindAsync(id);
            if (expense == null) return false;

            // Eğer stok eklenmişse geri düş
            if (expense.LinkedProductId.HasValue && expense.AddedStockQuantity.HasValue && expense.AddedStockQuantity.Value > 0)
            {
                var product = await _context.Products.FindAsync(expense.LinkedProductId.Value);
                if (product != null)
                {
                    product.StockQuantity = Math.Max(0, product.StockQuantity - expense.AddedStockQuantity.Value);
                    _context.Products.Update(product);
                }
            }

            var relatedTx = await _context.FinancialTransactions
                .Where(t => (t.Source == "ShopExpense" || t.Source == "WholesalePurchase") && t.ReferenceId == expense.Id)
                .ToListAsync();

            if (relatedTx.Any())
                _context.FinancialTransactions.RemoveRange(relatedTx);

            _context.Expenses.Remove(expense);
            await _context.SaveChangesAsync();
            return true;
        }

        // ==========================================
        // 4. ÜYELİK GELİR ONAY HAVUZU
        // ==========================================
        public async Task<List<PendingMembershipPayment>> GetPendingMembershipPaymentsAsync(string status = "All")
        {
            // Önce bu ay içinde kaydolmuş ama henüz havuza düşmemiş üyeleri senkronize et
            await SyncCurrentMonthMembershipsToPendingAsync();

            var query = _context.PendingMembershipPayments.AsNoTracking().AsQueryable();
            if (!string.IsNullOrWhiteSpace(status) && !status.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(p => p.Status == status);
            }

            return await query
                .OrderBy(p => p.Status == "Pending" ? 0 : 1)
                .ThenByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<int> SyncCurrentMonthMembershipsToPendingAsync()
        {
            var now = DateTime.Now;
            var monthStart = new DateTime(now.Year, now.Month, 1);

            // Bu ay içinde üyeliği başlamış veya oluşturulmuş ve ödeme yapmış üyeleri çek
            var recentPaidMembers = await _context.Users
                .Where(u => u.Role == UserRole.Member
                         && u.PaidAmount > 0
                         && ((u.MembershipStartDate.HasValue && u.MembershipStartDate.Value >= monthStart)
                             || u.CreatedDate >= monthStart))
                .AsNoTracking()
                .ToListAsync();

            if (!recentPaidMembers.Any()) return 0;

            var existingPaymentUserIds = await _context.PendingMembershipPayments
                .Select(p => p.UserId)
                .Distinct()
                .ToListAsync();

            var existingSet = new HashSet<int>(existingPaymentUserIds);
            var packages = await _context.MembershipPackages.AsNoTracking().ToDictionaryAsync(p => p.Id, p => p.Name);

            int addedCount = 0;
            foreach (var member in recentPaidMembers)
            {
                if (existingSet.Contains(member.Id))
                    continue;

                string pkgName = "Üyelik Paketi";
                if (member.PackageId.HasValue && packages.TryGetValue(member.PackageId.Value, out var foundName))
                {
                    pkgName = foundName;
                }

                await _context.PendingMembershipPayments.AddAsync(new PendingMembershipPayment
                {
                    UserId = member.Id,
                    MemberFullName = $"{member.FirstName} {member.LastName}".Trim(),
                    PackageId = member.PackageId,
                    PackageName = pkgName,
                    PaymentType = "NewRegistration",
                    Amount = member.PaidAmount,
                    CreatedAt = member.MembershipStartDate ?? member.CreatedDate,
                    Status = "Pending",
                    Note = "Otomatik bu ayki üyelik tahsilatı"
                });
                addedCount++;
            }

            if (addedCount > 0)
            {
                await _context.SaveChangesAsync();
            }

            return addedCount;
        }

        public async Task<PendingMembershipPayment> ApproveMembershipPaymentAsync(int id, ApproveMembershipPaymentDto dto)
        {
            var pending = await _context.PendingMembershipPayments.FindAsync(id);
            if (pending == null)
                throw new KeyNotFoundException("Onay bekleyen ödeme kaydı bulunamadı.");

            // Eğer daha önce onaylanmışsa eski kasa kayıtlarını temizleyip yeni dağılımla güncelle
            if (pending.Status == "Approved")
            {
                var oldTx = await _context.FinancialTransactions
                    .Where(t => t.Source == "Membership" && t.ReferenceId == pending.Id)
                    .ToListAsync();
                if (oldTx.Any())
                    _context.FinancialTransactions.RemoveRange(oldTx);
            }

            decimal cashAmt = Math.Max(0, dto.CashAmount ?? 0);
            decimal posAmt = Math.Max(0, dto.PosAmount ?? 0);
            bool isSplit = cashAmt > 0 && posAmt > 0;

            var paymentMethod = NormalizePaymentMethod(dto.PaymentMethod);

            if (isSplit)
            {
                pending.Amount = cashAmt + posAmt;
                pending.ConfirmedPaymentMethod = $"Split ({cashAmt:0.##} ₺ Nakit + {posAmt:0.##} ₺ POS)";
            }
            else if (posAmt > 0 && cashAmt == 0)
            {
                pending.Amount = posAmt;
                pending.ConfirmedPaymentMethod = "POS";
                paymentMethod = "POS";
            }
            else if (cashAmt > 0 && posAmt == 0)
            {
                pending.Amount = cashAmt;
                pending.ConfirmedPaymentMethod = "Cash";
                paymentMethod = "Cash";
            }
            else
            {
                if (dto.Amount.HasValue && dto.Amount.Value > 0)
                    pending.Amount = dto.Amount.Value;
                pending.ConfirmedPaymentMethod = paymentMethod;
            }

            pending.Status = "Approved";
            pending.ProcessedAt = DateTime.Now;
            if (!string.IsNullOrWhiteSpace(dto.Note))
            {
                pending.Note = dto.Note.Trim();
            }

            _context.PendingMembershipPayments.Update(pending);

            string typeLabel = pending.PaymentType switch
            {
                "NewRegistration" => "Yeni Üyelik",
                "Renewal" => "Üyelik Uzatma",
                "DebtPayment" => "Borç Tahsilatı",
                _ => "Üyelik Geliri"
            };

            if (isSplit)
            {
                await _context.FinancialTransactions.AddAsync(new FinancialTransaction
                {
                    TransactionType = "Income",
                    Source = "Membership",
                    Category = "Üyelik Geliri",
                    Title = $"{pending.MemberFullName} ({pending.PackageName} - Nakit Payı)",
                    Amount = cashAmt,
                    PaymentMethod = "Cash",
                    TransactionDate = DateTime.Now,
                    Description = $"{typeLabel} Parçalı Tahsilat (Nakit: {cashAmt:0.##} ₺ / POS: {posAmt:0.##} ₺)",
                    ReferenceId = pending.Id
                });

                await _context.FinancialTransactions.AddAsync(new FinancialTransaction
                {
                    TransactionType = "Income",
                    Source = "Membership",
                    Category = "Üyelik Geliri",
                    Title = $"{pending.MemberFullName} ({pending.PackageName} - POS Payı)",
                    Amount = posAmt,
                    PaymentMethod = "POS",
                    TransactionDate = DateTime.Now,
                    Description = $"{typeLabel} Parçalı Tahsilat (Nakit: {cashAmt:0.##} ₺ / POS: {posAmt:0.##} ₺)",
                    ReferenceId = pending.Id
                });
            }
            else
            {
                var tx = new FinancialTransaction
                {
                    TransactionType = "Income",
                    Source = "Membership",
                    Category = "Üyelik Geliri",
                    Title = $"{pending.MemberFullName} ({pending.PackageName})",
                    Amount = pending.Amount,
                    PaymentMethod = paymentMethod,
                    TransactionDate = DateTime.Now,
                    Description = $"{typeLabel} - {(paymentMethod == "POS" ? "POS / Kredi Kartı" : "Nakit")} olarak onaylandı.",
                    ReferenceId = pending.Id
                };
                await _context.FinancialTransactions.AddAsync(tx);
            }

            await _context.SaveChangesAsync();

            return pending;
        }

        public async Task<PendingMembershipPayment> RejectMembershipPaymentAsync(int id, string? note = null)
        {
            var pending = await _context.PendingMembershipPayments.FindAsync(id);
            if (pending == null)
                throw new KeyNotFoundException("Ödeme kaydı bulunamadı.");

            // Eğer daha önce onaylanmışsa ilgili finans hareketini geri çek ve tekrar Onay Bekleyen (Pending) durumuna döndür
            if (pending.Status == "Approved")
            {
                var relatedTx = await _context.FinancialTransactions
                    .Where(t => t.Source == "Membership" && t.ReferenceId == pending.Id)
                    .ToListAsync();
                if (relatedTx.Any())
                    _context.FinancialTransactions.RemoveRange(relatedTx);

                pending.Status = "Pending";
                pending.ConfirmedPaymentMethod = null;
                pending.ProcessedAt = null;
            }
            else
            {
                pending.Status = "Rejected";
                pending.ProcessedAt = DateTime.Now;
            }

            if (!string.IsNullOrWhiteSpace(note))
                pending.Note = note.Trim();

            _context.PendingMembershipPayments.Update(pending);
            await _context.SaveChangesAsync();

            return pending;
        }

        // ==========================================
        // 5. KASA DEFTERİ & FİNANSAL ANALİTİK
        // ==========================================
        public async Task<List<FinancialTransaction>> GetTransactionsAsync(
            DateTime? startDate = null,
            DateTime? endDate = null,
            string? type = null,
            string? paymentMethod = null)
        {
            var query = _context.FinancialTransactions.AsNoTracking().AsQueryable();

            if (startDate.HasValue)
                query = query.Where(t => t.TransactionDate >= startDate.Value.Date);
            if (endDate.HasValue)
                query = query.Where(t => t.TransactionDate <= endDate.Value.Date.AddDays(1).AddTicks(-1));
            if (!string.IsNullOrWhiteSpace(type) && !type.Equals("All", StringComparison.OrdinalIgnoreCase))
                query = query.Where(t => t.TransactionType == type);
            if (!string.IsNullOrWhiteSpace(paymentMethod) && !paymentMethod.Equals("All", StringComparison.OrdinalIgnoreCase))
                query = query.Where(t => t.PaymentMethod == paymentMethod);

            return await query.OrderByDescending(t => t.TransactionDate).ThenByDescending(t => t.Id).ToListAsync();
        }

        public async Task<bool> DeleteTransactionAsync(int id)
        {
            var tx = await _context.FinancialTransactions.FindAsync(id);
            if (tx == null) return false;

            _context.FinancialTransactions.Remove(tx);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<FinanceDashboardDto> GetDashboardAnalyticsAsync(string period = "this_month", DateTime? customStart = null, DateTime? customEnd = null)
        {
            await SyncCurrentMonthMembershipsToPendingAsync();

            var now = DateTime.Now;
            DateTime start;
            DateTime end = now.Date.AddDays(1).AddTicks(-1);

            switch ((period ?? "this_month").ToLowerInvariant())
            {
                case "today":
                case "1d":
                    start = now.Date;
                    break;
                case "7d":
                    start = now.Date.AddDays(-6);
                    break;
                case "15d":
                    start = now.Date.AddDays(-14);
                    break;
                case "this_month":
                case "30d":
                    start = new DateTime(now.Year, now.Month, 1);
                    end = start.AddMonths(1).AddTicks(-1);
                    break;
                case "last_month":
                    var firstOfThisMonth = new DateTime(now.Year, now.Month, 1);
                    start = firstOfThisMonth.AddMonths(-1);
                    end = firstOfThisMonth.AddTicks(-1);
                    break;
                case "this_year":
                case "1y":
                    start = new DateTime(now.Year, 1, 1);
                    end = new DateTime(now.Year, 12, 31, 23, 59, 59);
                    break;
                case "custom":
                    start = (customStart ?? now.Date.AddDays(-30)).Date;
                    end = (customEnd ?? now.Date).Date.AddDays(1).AddTicks(-1);
                    break;
                default:
                    start = new DateTime(now.Year, now.Month, 1);
                    break;
            }

            var transactions = await _context.FinancialTransactions
                .AsNoTracking()
                .Where(t => t.TransactionDate >= start && t.TransactionDate <= end)
                .ToListAsync();

            var salesInPeriod = await _context.Sales
                .Include(s => s.Items)
                .AsNoTracking()
                .Where(s => s.SaleDate >= start && s.SaleDate <= end)
                .ToListAsync();

            var pendingApprovals = await _context.PendingMembershipPayments
                .AsNoTracking()
                .Where(p => p.Status == "Pending")
                .ToListAsync();

            var allProducts = await _context.Products
                .AsNoTracking()
                .Where(p => p.IsActive)
                .ToListAsync();

            var lowStockCount = allProducts.Count(p => p.StockQuantity <= p.MinStockAlert);

            var approvedMembershipsInPeriod = await _context.PendingMembershipPayments
                .AsNoTracking()
                .Where(p => p.Status == "Approved"
                         && ((p.ProcessedAt.HasValue && p.ProcessedAt.Value >= start && p.ProcessedAt.Value <= end)
                             || (!p.ProcessedAt.HasValue && p.CreatedAt >= start && p.CreatedAt <= end)))
                .ToListAsync();

            var incomes = transactions.Where(t => t.TransactionType == "Income").ToList();
            var expenses = transactions.Where(t => t.TransactionType == "Expense").ToList();
            var transfersIn = transactions.Where(t => t.TransactionType == "TransferIn").ToList();
            var transfersOut = transactions.Where(t => t.TransactionType == "TransferOut").ToList();

            decimal totalIncome = incomes.Sum(t => t.Amount);
            decimal totalExpense = expenses.Sum(t => t.Amount);

            decimal cashIncome = incomes.Where(t => t.PaymentMethod == "Cash").Sum(t => t.Amount);
            decimal cashExpense = expenses.Where(t => t.PaymentMethod == "Cash").Sum(t => t.Amount);
            decimal cashTransferIn = transfersIn.Where(t => t.PaymentMethod == "Cash").Sum(t => t.Amount);
            decimal cashTransferOut = transfersOut.Where(t => t.PaymentMethod == "Cash").Sum(t => t.Amount);

            decimal posIncome = incomes.Where(t => t.PaymentMethod == "POS").Sum(t => t.Amount);
            decimal posExpense = expenses.Where(t => t.PaymentMethod == "POS").Sum(t => t.Amount);
            decimal posTransferIn = transfersIn.Where(t => t.PaymentMethod == "POS").Sum(t => t.Amount);
            decimal posTransferOut = transfersOut.Where(t => t.PaymentMethod == "POS").Sum(t => t.Amount);

            decimal membershipIncome = incomes.Where(t => t.Source == "Membership").Sum(t => t.Amount);
            decimal storeSaleIncome = incomes.Where(t => t.Source == "StoreSale").Sum(t => t.Amount);
            decimal storeSaleGrossProfit = salesInPeriod.Sum(s => s.TotalAmount - s.TotalCost);

            var allSoldItems = salesInPeriod.SelectMany(s => s.Items).ToList();
            int totalSoldUnits = allSoldItems.Sum(i => i.Quantity);
            decimal totalSoldRevenue = allSoldItems.Sum(i => i.TotalPrice);

            var dto = new FinanceDashboardDto
            {
                StartDate = start.ToString("yyyy-MM-dd"),
                EndDate = end.ToString("yyyy-MM-dd"),
                TotalIncome = totalIncome,
                TotalExpense = totalExpense,
                NetProfit = totalIncome - totalExpense,
                CashIncome = cashIncome,
                CashExpense = cashExpense,
                CashBalance = (cashIncome + cashTransferIn) - (cashExpense + cashTransferOut),
                PosIncome = posIncome,
                PosExpense = posExpense,
                PosBalance = (posIncome + posTransferIn) - (posExpense + posTransferOut),
                MembershipIncome = membershipIncome,
                StoreSaleIncome = storeSaleIncome,
                StoreSaleGrossProfit = storeSaleGrossProfit,
                TotalSoldProductUnits = totalSoldUnits,
                PendingApprovalsCount = pendingApprovals.Count,
                PendingApprovalsAmount = pendingApprovals.Sum(p => p.Amount),
                LowStockProductsCount = lowStockCount
            };

            // Kategori bazlı gelir dağılımı
            if (totalIncome > 0)
            {
                dto.IncomeByCategory = incomes
                    .GroupBy(t => string.IsNullOrWhiteSpace(t.Category) ? "Diğer Gelir" : t.Category)
                    .Select(g => new CategoryBreakdownDto
                    {
                        Category = g.Key,
                        Amount = g.Sum(x => x.Amount),
                        Percentage = Math.Round((double)(g.Sum(x => x.Amount) / totalIncome * 100), 1)
                    })
                    .OrderByDescending(x => x.Amount)
                    .ToList();
            }

            // Kategori bazlı gider dağılımı
            if (totalExpense > 0)
            {
                dto.ExpenseByCategory = expenses
                    .GroupBy(t => string.IsNullOrWhiteSpace(t.Category) ? "Diğer Gider" : t.Category)
                    .Select(g => new CategoryBreakdownDto
                    {
                        Category = g.Key,
                        Amount = g.Sum(x => x.Amount),
                        Percentage = Math.Round((double)(g.Sum(x => x.Amount) / totalExpense * 100), 1)
                    })
                    .OrderByDescending(x => x.Amount)
                    .ToList();
            }

            // Paket bazlı üyelik gelir dağılımı (Pasta Grafiği için)
            decimal totalPkgRev = approvedMembershipsInPeriod.Sum(p => p.Amount);
            if (totalPkgRev > 0)
            {
                dto.PackageRevenueBreakdown = approvedMembershipsInPeriod
                    .GroupBy(p => string.IsNullOrWhiteSpace(p.PackageName) ? "Standart Üyelik" : p.PackageName)
                    .Select(g => new CategoryBreakdownDto
                    {
                        Category = $"{g.Key} ({g.Count()} İşlem)",
                        Amount = g.Sum(x => x.Amount),
                        Percentage = Math.Round((double)(g.Sum(x => x.Amount) / totalPkgRev * 100), 1)
                    })
                    .OrderByDescending(x => x.Amount)
                    .ToList();
            }

            // Satılan bütün ürünlerin rağbet ve satış dağılımı (Pasta Grafiği & Rağbet Tablosu için)
            var prodLookup = allProducts.ToDictionary(p => p.Name, p => p, StringComparer.OrdinalIgnoreCase);

            dto.TopSellingProducts = allSoldItems
                .GroupBy(i => i.ProductName)
                .Select(g =>
                {
                    var qty = g.Sum(i => i.Quantity);
                    var rev = g.Sum(i => i.TotalPrice);
                    prodLookup.TryGetValue(g.Key, out var matchedProd);
                    return new TopProductDto
                    {
                        ProductName = g.Key,
                        Category = matchedProd?.Category ?? "Mağaza Ürünü",
                        CurrentStock = matchedProd?.StockQuantity ?? 0,
                        TotalQuantity = qty,
                        TotalRevenue = rev,
                        TotalProfit = g.Sum(i => i.TotalPrice - (i.UnitBuyingPrice * i.Quantity)),
                        QuantityPercentage = totalSoldUnits > 0 ? Math.Round((double)qty / totalSoldUnits * 100, 1) : 0,
                        RevenuePercentage = totalSoldRevenue > 0 ? Math.Round((double)(rev / totalSoldRevenue * 100), 1) : 0
                    };
                })
                .OrderByDescending(p => p.TotalQuantity)
                .ThenByDescending(p => p.TotalRevenue)
                .ToList();

            // Envanterdeki tüm ürünlerin rağbet durumu (Hiç satılmayan 0 adet ürünler dahil)
            var soldMap = dto.TopSellingProducts.ToDictionary(p => p.ProductName, p => p, StringComparer.OrdinalIgnoreCase);
            dto.AllProductsDemand = allProducts
                .Select(p =>
                {
                    if (soldMap.TryGetValue(p.Name, out var soldInfo))
                        return soldInfo;

                    return new TopProductDto
                    {
                        ProductName = p.Name,
                        Category = p.Category,
                        CurrentStock = p.StockQuantity,
                        TotalQuantity = 0,
                        TotalRevenue = 0,
                        TotalProfit = 0,
                        QuantityPercentage = 0,
                        RevenuePercentage = 0
                    };
                })
                .OrderByDescending(p => p.TotalQuantity)
                .ThenByDescending(p => p.TotalRevenue)
                .ThenBy(p => p.ProductName)
                .ToList();

            // Zaman Serisi Trendi (1 Yıl seçiliyse Aylık, diğerlerinde Günlük kırılım)
            var trCulture = CultureInfo.GetCultureInfo("tr-TR");
            var totalDays = (end.Date - start.Date).TotalDays;

            if (totalDays > 90)
            {
                // Aylık gruplama
                var cursor = new DateTime(start.Year, start.Month, 1);
                while (cursor <= end)
                {
                    var nextMonth = cursor.AddMonths(1);
                    var monthInc = incomes.Where(t => t.TransactionDate >= cursor && t.TransactionDate < nextMonth).Sum(t => t.Amount);
                    var monthExp = expenses.Where(t => t.TransactionDate >= cursor && t.TransactionDate < nextMonth).Sum(t => t.Amount);

                    dto.DailyTrend.Add(new DailyFinancePointDto
                    {
                        Date = cursor.ToString("yyyy-MM"),
                        Label = cursor.ToString("MMM yyyy", trCulture),
                        Income = monthInc,
                        Expense = monthExp,
                        Net = monthInc - monthExp
                    });
                    cursor = nextMonth;
                }
            }
            else
            {
                // Günlük gruplama
                var maxEnd = end.Date > now.Date ? now.Date : end.Date;
                if (maxEnd < start.Date) maxEnd = end.Date;

                for (var day = start.Date; day <= maxEnd; day = day.AddDays(1))
                {
                    var nextDay = day.AddDays(1);
                    var dayInc = incomes.Where(t => t.TransactionDate >= day && t.TransactionDate < nextDay).Sum(t => t.Amount);
                    var dayExp = expenses.Where(t => t.TransactionDate >= day && t.TransactionDate < nextDay).Sum(t => t.Amount);

                    dto.DailyTrend.Add(new DailyFinancePointDto
                    {
                        Date = day.ToString("yyyy-MM-dd"),
                        Label = day.ToString("dd MMM", trCulture),
                        Income = dayInc,
                        Expense = dayExp,
                        Net = dayInc - dayExp
                    });
                }
            }

            return dto;
        }

        // ==========================================
        // 6. KASALAR ARASI VİRMAN & KASA TRANSFERİ
        // ==========================================
        public async Task<List<FinancialTransaction>> CreateTransferAsync(CreateTransferDto dto)
        {
            if (dto.Amount <= 0)
                throw new ArgumentException("Transfer tutarı sıfırdan büyük olmalıdır.");

            var now = DateTime.Now;
            var created = new List<FinancialTransaction>();
            var note = string.IsNullOrWhiteSpace(dto.Note) ? string.Empty : $" ({dto.Note.Trim()})";

            switch (dto.TransferType)
            {
                case "CashToPos":
                    created.Add(new FinancialTransaction
                    {
                        TransactionType = "TransferOut",
                        Source = "CashTransfer",
                        Category = "Kasalar Arası Virman",
                        Title = $"Nakit Kasadan Bankaya Yatırılan{note}",
                        Amount = dto.Amount,
                        PaymentMethod = "Cash",
                        TransactionDate = now,
                        Description = "Nakit Kasa ➔ Banka / POS Hesabına Aktarım (Kâr/Zararı etkilemez)"
                    });
                    created.Add(new FinancialTransaction
                    {
                        TransactionType = "TransferIn",
                        Source = "CashTransfer",
                        Category = "Kasalar Arası Virman",
                        Title = $"Nakit Kasadan Bankaya Gelen{note}",
                        Amount = dto.Amount,
                        PaymentMethod = "POS",
                        TransactionDate = now,
                        Description = "Nakit Kasa ➔ Banka / POS Hesabına Aktarım (Kâr/Zararı etkilemez)"
                    });
                    break;

                case "PosToCash":
                    created.Add(new FinancialTransaction
                    {
                        TransactionType = "TransferOut",
                        Source = "CashTransfer",
                        Category = "Kasalar Arası Virman",
                        Title = $"Bankadan Nakit Kasaya Çekilen{note}",
                        Amount = dto.Amount,
                        PaymentMethod = "POS",
                        TransactionDate = now,
                        Description = "Banka / POS ➔ Nakit Kasaya Aktarım (Kâr/Zararı etkilemez)"
                    });
                    created.Add(new FinancialTransaction
                    {
                        TransactionType = "TransferIn",
                        Source = "CashTransfer",
                        Category = "Kasalar Arası Virman",
                        Title = $"Bankadan Nakit Kasaya Gelen{note}",
                        Amount = dto.Amount,
                        PaymentMethod = "Cash",
                        TransactionDate = now,
                        Description = "Banka / POS ➔ Nakit Kasaya Aktarım (Kâr/Zararı etkilemez)"
                    });
                    break;

                case "OwnerWithdrawalCash":
                    created.Add(new FinancialTransaction
                    {
                        TransactionType = "TransferOut",
                        Source = "CashTransfer",
                        Category = "Kasa Çekimi / Teslim",
                        Title = $"Nakit Kasadan İşletme Sahibi Çekimi{note}",
                        Amount = dto.Amount,
                        PaymentMethod = "Cash",
                        TransactionDate = now,
                        Description = "Nakit Kasadan İşletme Sahibine Teslim Edilen Tutar (Kâr/Zararı etkilemez)"
                    });
                    break;

                case "OwnerWithdrawalPos":
                    created.Add(new FinancialTransaction
                    {
                        TransactionType = "TransferOut",
                        Source = "CashTransfer",
                        Category = "Banka Çekimi / Transfer",
                        Title = $"Banka / POS Hesabından İşletme Sahibi Çekimi{note}",
                        Amount = dto.Amount,
                        PaymentMethod = "POS",
                        TransactionDate = now,
                        Description = "Banka / POS Hesabından İşletme Sahibine Aktarılan Tutar (Kâr/Zararı etkilemez)"
                    });
                    break;

                case "CashFloatAdd":
                    created.Add(new FinancialTransaction
                    {
                        TransactionType = "TransferIn",
                        Source = "CashTransfer",
                        Category = "Taban Kasa / Bozuk Para",
                        Title = $"Nakit Kasaya Bozuk Para / Taban Kasa Girişi{note}",
                        Amount = dto.Amount,
                        PaymentMethod = "Cash",
                        TransactionDate = now,
                        Description = "Nakit Kasaya Eklenen Başlangıç / Bozuk Para (Kâr/Zararı etkilemez)"
                    });
                    break;

                default:
                    throw new ArgumentException("Geçersiz transfer türü.");
            }

            await _context.FinancialTransactions.AddRangeAsync(created);
            await _context.SaveChangesAsync();
            return created;
        }

        // ==========================================
        // 7. GÜN SONU KASA KAPATMA & Z-RAPORU
        // ==========================================
        public async Task<FinancialTransaction> CreateZReportAsync(CreateZReportDto dto)
        {
            var now = DateTime.Now;
            var monthStart = new DateTime(now.Year, now.Month, 1);
            var monthEnd = monthStart.AddMonths(1).AddTicks(-1);

            var monthTx = await _context.FinancialTransactions
                .AsNoTracking()
                .Where(t => t.TransactionDate >= monthStart && t.TransactionDate <= monthEnd && t.PaymentMethod == "Cash")
                .ToListAsync();

            decimal cashIn = monthTx.Where(t => t.TransactionType == "Income" || t.TransactionType == "TransferIn").Sum(t => t.Amount);
            decimal cashOut = monthTx.Where(t => t.TransactionType == "Expense" || t.TransactionType == "TransferOut").Sum(t => t.Amount);
            decimal expectedCash = cashIn - cashOut;

            decimal countedCash = Math.Max(0, dto.CountedCash);
            decimal handedOver = Math.Max(0, dto.HandedOverCash);
            decimal diff = countedCash - expectedCash;

            // Eğer sayım farkı varsa ve otomatik eşitleme açıksa kasayı sayılan fiziki paraya eşitle
            if (dto.AutoAdjustDiscrepancy && Math.Abs(diff) >= 0.01m)
            {
                if (diff < 0)
                {
                    await _context.FinancialTransactions.AddAsync(new FinancialTransaction
                    {
                        TransactionType = "Expense",
                        Source = "ZReport",
                        Category = "Kasa Açığı / Sayım Farkı",
                        Title = $"Gün Sonu Kasa Açığı ({diff:0.##} ₺)",
                        Amount = Math.Abs(diff),
                        PaymentMethod = "Cash",
                        TransactionDate = now,
                        Description = $"Sistem Beklenen: {expectedCash:0.##} ₺ | Sayılan Fiziki: {countedCash:0.##} ₺"
                    });
                }
                else
                {
                    await _context.FinancialTransactions.AddAsync(new FinancialTransaction
                    {
                        TransactionType = "Income",
                        Source = "ZReport",
                        Category = "Kasa Fazlası / Sayım Farkı",
                        Title = $"Gün Sonu Kasa Fazlası (+{diff:0.##} ₺)",
                        Amount = diff,
                        PaymentMethod = "Cash",
                        TransactionDate = now,
                        Description = $"Sistem Beklenen: {expectedCash:0.##} ₺ | Sayılan Fiziki: {countedCash:0.##} ₺"
                    });
                }
            }

            // Eğer gün sonunda kasadan para teslim edildiyse (ertesi güne sadece bozuk para bırakıldıysa)
            if (handedOver > 0)
            {
                await _context.FinancialTransactions.AddAsync(new FinancialTransaction
                {
                    TransactionType = "TransferOut",
                    Source = "ZReport",
                    Category = "Gün Sonu Kasa Teslimi",
                    Title = $"Gün Sonu Kasadan Teslim Edilen Nakit (-{handedOver:0.##} ₺)",
                    Amount = handedOver,
                    PaymentMethod = "Cash",
                    TransactionDate = now,
                    Description = $"Sayılan: {countedCash:0.##} ₺ | Teslim Edilen: {handedOver:0.##} ₺ | Yarına Devreden Taban Kasa: {Math.Max(0, countedCash - handedOver):0.##} ₺"
                });
            }

            decimal nextDayFloat = Math.Max(0, countedCash - handedOver);
            string diffLabel = Math.Abs(diff) < 0.01m
                ? "Tam Denk (0 ₺)"
                : diff > 0 ? $"+{diff:0.##} ₺ Fazla" : $"{diff:0.##} ₺ Açık";

            var zReportRecord = new FinancialTransaction
            {
                TransactionType = "ZReport",
                Source = "ZReport",
                Category = "Gün Sonu Z-Raporu",
                Title = $"Z-Raporu Kapanışı (Sayılan: {countedCash:0.##} ₺ | Fark: {diffLabel})",
                Amount = countedCash,
                PaymentMethod = "Cash",
                TransactionDate = now,
                Description = $"Beklenen: {expectedCash:0.##} ₺ | Sayılan: {countedCash:0.##} ₺ | Fark: {diffLabel} | Teslim Edilen: {handedOver:0.##} ₺ | Yarına Devreden: {nextDayFloat:0.##} ₺"
                            + (string.IsNullOrWhiteSpace(dto.Note) ? "" : $" | Not: {dto.Note.Trim()}")
            };

            await _context.FinancialTransactions.AddAsync(zReportRecord);
            await _context.SaveChangesAsync();
            return zReportRecord;
        }

        public async Task<List<FinancialTransaction>> CreateBulkIncomeAsync(CreateBulkIncomeDto dto)
        {
            if (dto.Items == null || !dto.Items.Any())
                throw new ArgumentException("En az bir gelir kalemi girilmelidir.");

            var createdList = new List<FinancialTransaction>();
            var defaultDate = dto.DefaultDate ?? DateTime.Now;

            foreach (var item in dto.Items)
            {
                if (item.Amount <= 0 && (!item.CashAmount.HasValue || item.CashAmount <= 0) && (!item.PosAmount.HasValue || item.PosAmount <= 0))
                    continue;

                var txDate = item.TransactionDate ?? defaultDate;
                var category = string.IsNullOrWhiteSpace(item.Category) ? "Spor Üyeliği" : item.Category.Trim();
                var title = string.IsNullOrWhiteSpace(item.Title) ? "Toplu Gelir Girişi" : item.Title.Trim();
                var desc = item.Description?.Trim();
                if (!string.IsNullOrWhiteSpace(dto.BatchNote))
                {
                    desc = string.IsNullOrWhiteSpace(desc) ? dto.BatchNote : $"{desc} ({dto.BatchNote})";
                }

                var paymentMethod = (item.PaymentMethod ?? "Cash").Trim();
                decimal cashAmt = Math.Max(0, item.CashAmount ?? 0);
                decimal posAmt = Math.Max(0, item.PosAmount ?? 0);
                bool isSplit = string.Equals(paymentMethod, "Split", StringComparison.OrdinalIgnoreCase)
                               || (cashAmt > 0 && posAmt > 0);

                if (isSplit)
                {
                    decimal totalSplit = cashAmt + posAmt;
                    if (totalSplit <= 0 && item.Amount > 0)
                    {
                        cashAmt = Math.Round(item.Amount / 2, 2);
                        posAmt = item.Amount - cashAmt;
                    }

                    if (cashAmt > 0)
                    {
                        var txCash = new FinancialTransaction
                        {
                            TransactionType = "Income",
                            Source = "BulkIncome",
                            Category = category,
                            Title = $"{title} [Nakit Payı]",
                            Amount = cashAmt,
                            PaymentMethod = "Cash",
                            TransactionDate = txDate,
                            Description = string.IsNullOrWhiteSpace(desc) 
                                ? $"Toplu Gelir Parçalı Ödeme (Nakit: {cashAmt:0.##} ₺ / POS: {posAmt:0.##} ₺)" 
                                : $"{desc} - Parçalı Ödeme (Nakit: {cashAmt:0.##} ₺ / POS: {posAmt:0.##} ₺)"
                        };
                        createdList.Add(txCash);
                    }

                    if (posAmt > 0)
                    {
                        var txPos = new FinancialTransaction
                        {
                            TransactionType = "Income",
                            Source = "BulkIncome",
                            Category = category,
                            Title = $"{title} [POS Payı]",
                            Amount = posAmt,
                            PaymentMethod = "POS",
                            TransactionDate = txDate,
                            Description = string.IsNullOrWhiteSpace(desc) 
                                ? $"Toplu Gelir Parçalı Ödeme (Nakit: {cashAmt:0.##} ₺ / POS: {posAmt:0.##} ₺)" 
                                : $"{desc} - Parçalı Ödeme (Nakit: {cashAmt:0.##} ₺ / POS: {posAmt:0.##} ₺)"
                        };
                        createdList.Add(txPos);
                    }
                }
                else
                {
                    var singleMethod = string.Equals(paymentMethod, "POS", StringComparison.OrdinalIgnoreCase) ? "POS" : "Cash";
                    decimal amount = item.Amount > 0 ? item.Amount : (singleMethod == "POS" ? posAmt : cashAmt);
                    if (amount <= 0) continue;

                    var tx = new FinancialTransaction
                    {
                        TransactionType = "Income",
                        Source = "BulkIncome",
                        Category = category,
                        Title = title,
                        Amount = amount,
                        PaymentMethod = singleMethod,
                        TransactionDate = txDate,
                        Description = desc
                    };
                    createdList.Add(tx);
                }
            }

            if (!createdList.Any())
                throw new ArgumentException("Kaydedilecek geçerli bir gelir tutarı bulunamadı.");

            await _context.FinancialTransactions.AddRangeAsync(createdList);
            await _context.SaveChangesAsync();
            return createdList;
        }

        public async Task<FinancialTransaction> CreateSingleIncomeAsync(BulkIncomeItemDto dto)
        {
            var bulkDto = new CreateBulkIncomeDto
            {
                DefaultDate = dto.TransactionDate ?? DateTime.Now,
                Items = new List<BulkIncomeItemDto> { dto }
            };
            var list = await CreateBulkIncomeAsync(bulkDto);
            return list.First();
        }

        private static string NormalizePaymentMethod(string? method)
        {
            if (string.IsNullOrWhiteSpace(method)) return "Cash";
            var m = method.Trim().ToUpperInvariant();
            if (m == "POS" || m == "CARD" || m == "KART" || m == "KREDİ KARTI" || m == "BANKA")
                return "POS";
            return "Cash";
        }
    }
}
