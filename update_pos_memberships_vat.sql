-- =====================================================================
-- N1FIT - POS SPOR ÜYELİKLERİ %20 KDV VE NET KÂR GÜNCELLEME BETİĞİ
-- =====================================================================

-- 1. FinancialTransactions tablosundaki POS ile yapılmış tüm spor üyeliklerinin
-- açıklamalarına %20 KDV ve Net tutar bilgilerini ekle/güncelle
UPDATE FinancialTransactions
SET Description = 
    CASE 
        WHEN Description IS NULL OR LTRIM(RTRIM(Description)) = '' 
            THEN '[KDV %20: -' + CAST(ROUND(Amount * 0.20, 2) AS NVARCHAR(50)) + ' ₺ | Net: ' + CAST(ROUND(Amount * 0.80, 2) AS NVARCHAR(50)) + ' ₺]'
        WHEN Description NOT LIKE '%KDV %20%' 
            THEN LTRIM(RTRIM(Description)) + ' [KDV %20: -' + CAST(ROUND(Amount * 0.20, 2) AS NVARCHAR(50)) + ' ₺ | Net: ' + CAST(ROUND(Amount * 0.80, 2) AS NVARCHAR(50)) + ' ₺]'
        ELSE Description
    END
WHERE PaymentMethod = 'POS'
  AND (
      Source = 'Membership'
      OR Category LIKE N'%Üyelik%' 
      OR Category LIKE N'%Spor%' 
      OR Title LIKE N'%Üyelik%' 
      OR Title LIKE N'%Paket%'
  );

-- 2. PendingMembershipPayments tablosundaki POS ile onaylanmış kayıtların notunu da zenginleştir
UPDATE PendingMembershipPayments
SET Note = 
    CASE 
        WHEN Note IS NULL OR LTRIM(RTRIM(Note)) = '' 
            THEN '[KDV %20: -' + CAST(ROUND(Amount * 0.20, 2) AS NVARCHAR(50)) + ' ₺ | Net: ' + CAST(ROUND(Amount * 0.80, 2) AS NVARCHAR(50)) + ' ₺]'
        WHEN Note NOT LIKE '%KDV %20%' 
            THEN LTRIM(RTRIM(Note)) + ' [KDV %20: -' + CAST(ROUND(Amount * 0.20, 2) AS NVARCHAR(50)) + ' ₺ | Net: ' + CAST(ROUND(Amount * 0.80, 2) AS NVARCHAR(50)) + ' ₺]'
        ELSE Note
    END
WHERE (ConfirmedPaymentMethod = 'POS' OR ConfirmedPaymentMethod LIKE '%POS%')
  AND Status = 'Approved';
