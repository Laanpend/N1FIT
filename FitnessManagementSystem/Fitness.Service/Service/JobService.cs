using Fitness.Core.DTOs;
using Fitness.Core.Entities;
using Fitness.Core.Enums;
using Fitness.Core.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Net;
using System.Text.Json;
using System.Text;
using System.Threading.Tasks;
using WebPush;

namespace Fitness.Service.Service
{
    public class JobService
    {
        private readonly IGenericRepository<User> _userRepository;
        private readonly IGenericRepository<DailyTrackingLog> _dailyTrackingRepository;
        private readonly IGenericRepository<DietProgram> _dietRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration _configuration;
        private readonly ISmsService _smsService;
        private readonly ILogger<JobService> _logger;

        public JobService(
            IGenericRepository<User> userRepository,
            IGenericRepository<DailyTrackingLog> dailyTrackingRepository,
            IGenericRepository<DietProgram> dietRepository,
            IUnitOfWork unitOfWork,
            IConfiguration configuration,
            ISmsService smsService,
            ILogger<JobService> logger)
        {
            _userRepository = userRepository;
            _dailyTrackingRepository = dailyTrackingRepository;
            _dietRepository = dietRepository;
            _unitOfWork = unitOfWork;
            _configuration = configuration;
            _smsService = smsService;
            _logger = logger;
        }

        public static DateTime GetTurkeyLocalTime()
        {
            try
            {
                var tz = TimeZoneInfo.FindSystemTimeZoneById("Turkey Standard Time");
                return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz);
            }
            catch
            {
                return DateTime.UtcNow.AddHours(3);
            }
        }

        public async Task<bool> SendPushNotificationAsync(User user, string title, string message, string url = "/app", string tag = "n1fit-reminder")
        {
            if (string.IsNullOrWhiteSpace(user.PushEndpoint) || string.IsNullOrWhiteSpace(user.PushP256DH) || string.IsNullOrWhiteSpace(user.PushAuth))
                return false;

            var subject = _configuration["VapidDetails:Subject"];
            var publicKey = _configuration["VapidDetails:PublicKey"];
            var privateKey = _configuration["VapidDetails:PrivateKey"];
            if (string.IsNullOrWhiteSpace(subject) || string.IsNullOrWhiteSpace(publicKey) || string.IsNullOrWhiteSpace(privateKey))
                return false;

            try
            {
                var vapidDetails = new VapidDetails(subject, publicKey, privateKey);
                using var webPushClient = new WebPushClient();

                var payload = JsonSerializer.Serialize(new
                {
                    title,
                    message,
                    url,
                    tag
                });

                var pushSubscription = new PushSubscription(user.PushEndpoint, user.PushP256DH, user.PushAuth);
                await webPushClient.SendNotificationAsync(pushSubscription, payload, vapidDetails);
                return true;
            }
            catch (WebPushException wpEx) when (wpEx.StatusCode == HttpStatusCode.Gone || wpEx.StatusCode == HttpStatusCode.NotFound)
            {
                user.PushEndpoint = null;
                user.PushP256DH = null;
                user.PushAuth = null;
                _userRepository.Update(user);
                await _unitOfWork.CommitAsync();
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Push bildirimi gönderilirken hata: User ID {UserId}", user.Id);
                return false;
            }
        }

        public static string BuildExpiringSubscriptionSmsMessage(string firstName, string lastName, decimal remainingDebt)
        {
            var fullName = $"{firstName} {lastName}".Trim();
            if (string.IsNullOrWhiteSpace(fullName))
                fullName = "Üyemiz";

            if (remainingDebt > 0)
            {
                var formattedDebt = remainingDebt.ToString("0.##", CultureInfo.GetCultureInfo("tr-TR"));
                return $"Sayın {fullName}, N1FIT Spor Merkezi üyeliğinizin bitimine son 3 gününüz kaldı. Ayrıca {formattedDebt} TL ödenmemiş borcunuz vardır. Sağlıklı günler dileriz.";
            }

            return $"Sayın {fullName}, N1FIT Spor Merkezi üyeliğinizin bitimine son 3 gününüz kaldı. Sağlıklı günler dileriz.";
        }

        public async Task CheckExpiringSubscriptions()
        {
            var today = DateTime.Now.Date;
            var targetDate = today.AddDays(3);

            var usersToNotify = await _userRepository
                .Where(x => x.Role == UserRole.Member
                         && x.IsActive
                         && !x.IsFrozen
                         && x.SubscriptionEndDate.HasValue
                         && x.SubscriptionEndDate.Value.Date == targetDate)
                .ToListAsync();

            if (!usersToNotify.Any())
                return;

            var subject = _configuration["VapidDetails:Subject"];
            var publicKey = _configuration["VapidDetails:PublicKey"];
            var privateKey = _configuration["VapidDetails:PrivateKey"];
            bool hasVapid = !string.IsNullOrWhiteSpace(subject) && !string.IsNullOrWhiteSpace(publicKey) && !string.IsNullOrWhiteSpace(privateKey);

            VapidDetails? vapidDetails = hasVapid ? new VapidDetails(subject, publicKey, privateKey) : null;
            using var webPushClient = new WebPushClient();

            bool anyUserUpdated = false;

            foreach (var user in usersToNotify)
            {
                decimal remainingDebt = Math.Max(0, user.TotalDebt - user.PaidAmount);

                // 1. Netgsm SMS Gönderimi (Üyelik bitimine son 3 gün kalanlar)
                if (!string.IsNullOrWhiteSpace(user.PhoneNumber)
                    && (!user.LastExpirySmsDate.HasValue || user.LastExpirySmsDate.Value.Date != today))
                {
                    try
                    {
                        var smsText = BuildExpiringSubscriptionSmsMessage(user.FirstName, user.LastName, remainingDebt);
                        var smsResult = await _smsService.SendSmsAsync(user.PhoneNumber, smsText);

                        if (smsResult.Success)
                        {
                            user.LastExpirySmsDate = today;
                            _userRepository.Update(user);
                            anyUserUpdated = true;
                        }
                    }
                    catch (Exception smsEx)
                    {
                        _logger.LogError(smsEx, "Üye (ID: {UserId}) için SMS gönderilirken hata oluştu.", user.Id);
                    }
                }

                // 2. WebPush Bildirimi Gönderimi (Eğer tarayıcı bildirimi açıksa)
                if (vapidDetails != null && !string.IsNullOrWhiteSpace(user.PushEndpoint))
                {
                    try
                    {
                        var pushMsg = remainingDebt > 0
                            ? $"Üyeliğinizin bitmesine son 3 gününüz kaldı. Ayrıca {remainingDebt.ToString("0.##", CultureInfo.GetCultureInfo("tr-TR"))} TL ödenmemiş borcunuz vardır."
                            : "Üyeliğinizin bitmesine son 3 gününüz kaldı.";

                        var payload = JsonSerializer.Serialize(new
                        {
                            title = "ÜYELİĞİN BİTİYOR!",
                            message = pushMsg,
                            url = "/membership"
                        });

                        var pushSubscription = new PushSubscription(user.PushEndpoint, user.PushP256DH, user.PushAuth);
                        await webPushClient.SendNotificationAsync(pushSubscription, payload, vapidDetails);
                    }
                    catch (WebPushException wpEx) when (wpEx.StatusCode == HttpStatusCode.Gone || wpEx.StatusCode == HttpStatusCode.NotFound)
                    {
                        user.PushEndpoint = null;
                        user.PushP256DH = null;
                        user.PushAuth = null;
                        _userRepository.Update(user);
                        anyUserUpdated = true;
                        _logger.LogInformation("Üye (ID: {UserId}) için geçersizleşen push aboneliği temizlendi.", user.Id);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Üye (ID: {UserId}) için push bildirimi gönderilirken hata oluştu.", user.Id);
                    }
                }
            }

            if (anyUserUpdated)
            {
                await _unitOfWork.CommitAsync();
            }
        }

        public async Task ClearInactiveMembers()
        {
            var now = DateTime.Now;
            var today = now.Date;
            var threeMonthsAgo = now.AddMonths(-3);

            // 1. Süresi dolmuş ancak veritabanında IsActive = true kalmış üyeleri pasife çek
            var newlyExpiredUsers = await _userRepository
                .Where(x => x.Role == UserRole.Member
                         && x.IsActive
                         && !x.IsFrozen
                         && x.SubscriptionEndDate.HasValue
                         && x.SubscriptionEndDate.Value.Date < today)
                .ToListAsync();

            foreach (var expiredUser in newlyExpiredUsers)
            {
                expiredUser.IsActive = false;
                _userRepository.Update(expiredUser);
            }

            // 1.5. Başlangıç tarihi gelmiş ancak IsActive = false kalmış (ileri tarihli kayıtlı) üyeleri aktifleştir
            var newlyStartedUsers = await _userRepository
                .Where(x => x.Role == UserRole.Member
                         && !x.IsActive
                         && !x.IsFrozen
                         && x.MembershipStartDate.HasValue
                         && x.MembershipStartDate.Value.Date <= today
                         && (!x.SubscriptionEndDate.HasValue || x.SubscriptionEndDate.Value.Date >= today))
                .ToListAsync();

            foreach (var startedUser in newlyStartedUsers)
            {
                startedUser.IsActive = true;
                _userRepository.Update(startedUser);
            }

            // 2. Üyelik bitiş tarihinin üzerinden 3 ay geçmiş, dondurulmamış ve borcu olmayan pasif üyeleri temizle
            var inactiveUsersToRemove = await _userRepository
                .Where(x => x.Role == UserRole.Member
                         && !x.IsFrozen
                         && (x.TotalDebt - x.PaidAmount) <= 0
                         && (
                             (x.SubscriptionEndDate.HasValue && x.SubscriptionEndDate.Value < threeMonthsAgo)
                             || (!x.SubscriptionEndDate.HasValue && !x.IsActive && x.CreatedDate < threeMonthsAgo)
                         ))
                .ToListAsync();

            foreach (var user in inactiveUsersToRemove)
            {
                _userRepository.Remove(user);
            }

            if (newlyExpiredUsers.Any() || newlyStartedUsers.Any() || inactiveUsersToRemove.Any())
            {
                await _unitOfWork.CommitAsync();
                _logger.LogInformation(
                    "Üyelik temizlik görevi tamamlandı: {ExpiredCount} üye pasife çekildi, {RemovedCount} adet 3 ayı aşmış pasif üye silindi.",
                    newlyExpiredUsers.Count,
                    inactiveUsersToRemove.Count);
            }
        }

        private static string NormalizeTurkish(string text)
        {
            if (string.IsNullOrWhiteSpace(text)) return string.Empty;
            var trCulture = CultureInfo.GetCultureInfo("tr-TR");
            var lower = text.ToLower(trCulture);
            var sb = new StringBuilder(lower.Length);
            foreach (var c in lower)
            {
                switch (c)
                {
                    case 'ı': case 'i':
                        sb.Append('i');
                        break;
                    case 'ğ':
                        sb.Append('g');
                        break;
                    case 'ü':
                        sb.Append('u');
                        break;
                    case 'ş':
                        sb.Append('s');
                        break;
                    case 'ö':
                        sb.Append('o');
                        break;
                    case 'ç':
                        sb.Append('c');
                        break;
                    default:
                        sb.Append(c);
                        break;
                }
            }
            return sb.ToString().Trim();
        }

        private static bool MatchMeal(string mealName, params string[] patterns)
        {
            if (string.IsNullOrWhiteSpace(mealName)) return false;
            var normalizedMeal = NormalizeTurkish(mealName);
            foreach (var pattern in patterns)
            {
                var normalizedPattern = NormalizeTurkish(pattern);
                if (normalizedMeal.Contains(normalizedPattern, StringComparison.OrdinalIgnoreCase))
                    return true;
            }
            return false;
        }

        public async Task<ReminderReportDto> CheckDietAndWaterReminders(bool forceAll = false)
        {
            var turkeyNow = GetTurkeyLocalTime();
            var today = turkeyNow.Date;
            var currentTime = turkeyNow.TimeOfDay;

            var report = new ReminderReportDto
            {
                ExecutionTime = turkeyNow.ToString("yyyy-MM-dd HH:mm:ss")
            };

            // Yalnızca PWA bildirimleri açık ve aktif üyeleri çek
            var subscribedMembers = await _userRepository
                .Where(x => x.Role == UserRole.Member
                         && x.IsActive
                         && !x.IsFrozen
                         && !string.IsNullOrWhiteSpace(x.PushEndpoint))
                .ToListAsync();

            report.TotalSubscribedMembers = subscribedMembers.Count;

            if (!subscribedMembers.Any())
            {
                report.Details.Add("Aktif bildirim aboneliği bulunan üye bulunamadı.");
                return report;
            }

            // Saat pencereleri tanımları (Türkiye Saati ile, kesinlikle çakışmayan pencereler):
            bool inBreakfast = (currentTime >= new TimeSpan(8, 30, 0) && currentTime <= new TimeSpan(10, 30, 0))
                || (forceAll && currentTime < new TimeSpan(11, 0, 0));

            bool inWaterMorning = (currentTime >= new TimeSpan(11, 15, 0) && currentTime <= new TimeSpan(12, 45, 0))
                || (forceAll && currentTime >= new TimeSpan(11, 0, 0) && currentTime < new TimeSpan(13, 0, 0));

            bool inLunch = (currentTime >= new TimeSpan(13, 0, 0) && currentTime <= new TimeSpan(14, 45, 0))
                || (forceAll && currentTime >= new TimeSpan(13, 0, 0) && currentTime < new TimeSpan(15, 0, 0));

            bool inWaterAfternoon = (currentTime >= new TimeSpan(15, 15, 0) && currentTime <= new TimeSpan(16, 45, 0))
                || (forceAll && currentTime >= new TimeSpan(15, 0, 0) && currentTime < new TimeSpan(17, 0, 0));

            bool inSnack = (currentTime >= new TimeSpan(17, 0, 0) && currentTime <= new TimeSpan(18, 45, 0))
                || (forceAll && currentTime >= new TimeSpan(17, 0, 0) && currentTime < new TimeSpan(19, 0, 0));

            bool inDinner = (currentTime >= new TimeSpan(19, 15, 0) && currentTime <= new TimeSpan(20, 45, 0))
                || (forceAll && currentTime >= new TimeSpan(19, 0, 0) && currentTime < new TimeSpan(21, 0, 0));

            bool inWaterEvening = (currentTime >= new TimeSpan(21, 0, 0) && currentTime <= new TimeSpan(22, 15, 0))
                || (forceAll && currentTime >= new TimeSpan(21, 0, 0) && currentTime < new TimeSpan(22, 20, 0));

            bool inSummary = (currentTime >= new TimeSpan(22, 20, 0) && currentTime <= new TimeSpan(23, 45, 0))
                || (forceAll && currentTime >= new TimeSpan(22, 20, 0));

            // Eğer forceAll true ise ve gece saatlerinde (00:00 - 08:30) tetiklendiyse, test amaçlı kahvaltı penceresini aç
            if (forceAll && !inBreakfast && !inWaterMorning && !inLunch && !inWaterAfternoon && !inSnack && !inDinner && !inWaterEvening && !inSummary)
            {
                inBreakfast = true;
            }

            foreach (var user in subscribedMembers)
            {
                var dailyLog = await _dailyTrackingRepository
                    .Where(x => x.UserId == user.Id && x.TrackingDate == today)
                    .FirstOrDefaultAsync();

                if (dailyLog == null)
                {
                    dailyLog = new DailyTrackingLog
                    {
                        UserId = user.Id,
                        TrackingDate = today,
                        WaterGlasses = 0,
                        ConsumedCalories = 0,
                        CompletedMealsJson = "[]",
                        SentNotificationsJson = "[]",
                        LastUpdated = turkeyNow
                    };
                    await _dailyTrackingRepository.AddAsync(dailyLog);
                    await _unitOfWork.CommitAsync();
                }

                var sentNotifications = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                if (!string.IsNullOrWhiteSpace(dailyLog.SentNotificationsJson))
                {
                    try
                    {
                        var list = JsonSerializer.Deserialize<List<string>>(dailyLog.SentNotificationsJson);
                        if (list != null)
                        {
                            foreach (var item in list) sentNotifications.Add(item);
                        }
                    }
                    catch { }
                }

                // Cooldown Kontrolü (Minimum 90 Dakika):
                // Bir kullanıcıya 90 dakikadan daha sık bildirim gönderilmesini engeller
                DateTime? lastNotificationTime = null;
                var lastSentTag = sentNotifications.FirstOrDefault(x => x.StartsWith("_last_sent:", StringComparison.OrdinalIgnoreCase));
                if (lastSentTag != null && DateTime.TryParse(lastSentTag.Substring("_last_sent:".Length), CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var parsedDt))
                {
                    lastNotificationTime = parsedDt;
                }

                if (!forceAll && lastNotificationTime.HasValue)
                {
                    var minutesSinceLast = (turkeyNow - lastNotificationTime.Value).TotalMinutes;
                    if (minutesSinceLast >= 0 && minutesSinceLast < 90)
                    {
                        continue;
                    }
                }

                var completedMeals = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                if (!string.IsNullOrWhiteSpace(dailyLog.CompletedMealsJson))
                {
                    try
                    {
                        var list = JsonSerializer.Deserialize<List<string>>(dailyLog.CompletedMealsJson);
                        if (list != null)
                        {
                            foreach (var item in list) completedMeals.Add(item);
                        }
                    }
                    catch { }
                }

                var userDiets = await _dietRepository
                    .Where(x => x.UserId == user.Id)
                    .OrderBy(x => x.Id)
                    .AsNoTracking()
                    .ToListAsync();

                bool anyNotificationSentForUser = false;

                // 1. KAHVALTI HATIRLATMASI (08:30 - 10:30)
                if (inBreakfast && !sentNotifications.Contains("breakfast_reminder"))
                {
                    var breakfastMeal = userDiets.FirstOrDefault(d =>
                        MatchMeal(d.MealName, "kahvalt", "sabah", "1. ogun", "1.ogun", "1 ogun", "birinci ogun")
                    ) ?? userDiets.FirstOrDefault();

                    bool isCompleted = breakfastMeal != null && (
                        completedMeals.Contains(breakfastMeal.MealName) ||
                        completedMeals.Contains($"id_{breakfastMeal.Id}")
                    );

                    if (!isCompleted)
                    {
                        string title = "🍳 Güne Güçlü Başla!";
                        string body = breakfastMeal != null
                            ? $"Günün ilk yakıtı ({breakfastMeal.MealName})! Kahvaltını yaptın mı? Öğününü ve proteinini uygulamadan işaretle."
                            : "Günün ilk yakıtı! Kahvaltını yaptın mı? Günlük kalori ve protein hedefini N1FIT'ten takip etmeyi unutma.";

                        bool sent = await SendPushNotificationAsync(user, title, body, "/app", "n1fit-meal");
                        if (sent)
                        {
                            sentNotifications.Add("breakfast_reminder");
                            sentNotifications.RemoveWhere(x => x.StartsWith("_last_sent:", StringComparison.OrdinalIgnoreCase));
                            sentNotifications.Add($"_last_sent:{turkeyNow.ToString("o", CultureInfo.InvariantCulture)}");
                            anyNotificationSentForUser = true;
                            report.SentCount++;
                            report.Details.Add($"{user.FirstName} {user.LastName} -> Kahvaltı Hatırlatması Gönderildi.");
                        }
                    }
                    else
                    {
                        sentNotifications.Add("breakfast_reminder");
                        dailyLog.SentNotificationsJson = JsonSerializer.Serialize(sentNotifications.ToList());
                        _dailyTrackingRepository.Update(dailyLog);
                        await _unitOfWork.CommitAsync();
                    }
                }
                // 2. SABAH SU HATIRLATMASI (11:15 - 12:45)
                else if (inWaterMorning && !sentNotifications.Contains("water_morning"))
                {
                    if (dailyLog.WaterGlasses < 4) // < 1 Litre
                    {
                        bool sent = await SendPushNotificationAsync(
                            user,
                            "💧 Metabolizmanı Canlandır!",
                            "Günün ilk yarısını geride bıraktın. Hedefin minimum 3 litre! Şimdi koca bir bardak su al ve listeden işaretle.",
                            "/app",
                            "n1fit-water"
                        );
                        if (sent)
                        {
                            sentNotifications.Add("water_morning");
                            sentNotifications.RemoveWhere(x => x.StartsWith("_last_sent:", StringComparison.OrdinalIgnoreCase));
                            sentNotifications.Add($"_last_sent:{turkeyNow.ToString("o", CultureInfo.InvariantCulture)}");
                            anyNotificationSentForUser = true;
                            report.SentCount++;
                            report.Details.Add($"{user.FirstName} {user.LastName} -> Sabah Su Hatırlatması Gönderildi ({dailyLog.WaterGlasses}/12 Bardak).");
                        }
                    }
                    else
                    {
                        sentNotifications.Add("water_morning");
                        dailyLog.SentNotificationsJson = JsonSerializer.Serialize(sentNotifications.ToList());
                        _dailyTrackingRepository.Update(dailyLog);
                        await _unitOfWork.CommitAsync();
                    }
                }
                // 3. ÖĞLE YEMEĞİ HATIRLATMASI (13:00 - 14:45)
                else if (inLunch && !sentNotifications.Contains("lunch_reminder"))
                {
                    var lunchMeal = userDiets.FirstOrDefault(d =>
                        MatchMeal(d.MealName, "öğle", "ögle", "ogle", "2. ogun", "2.ogun", "2 ogun", "ikinci ogun", "lunch")
                    ) ?? (userDiets.Count >= 2 ? userDiets[1] : null);

                    bool isCompleted = lunchMeal != null && (
                        completedMeals.Contains(lunchMeal.MealName) ||
                        completedMeals.Contains($"id_{lunchMeal.Id}")
                    );

                    if (!isCompleted)
                    {
                        string title = "🥗 Öğle Öğünü Vakti!";
                        string body = lunchMeal != null
                            ? $"Enerjin düşmesin, kas yıkımına izin verme! ({lunchMeal.MealName}) menünü tüketip listeden işaretle."
                            : "Enerjin düşmesin, kas yıkımına izin verme! Sağlıklı bir öğle menüsüyle protein ihtiyacını karşıla ve uygulamadan kaydet.";

                        bool sent = await SendPushNotificationAsync(user, title, body, "/app", "n1fit-meal");
                        if (sent)
                        {
                            sentNotifications.Add("lunch_reminder");
                            sentNotifications.RemoveWhere(x => x.StartsWith("_last_sent:", StringComparison.OrdinalIgnoreCase));
                            sentNotifications.Add($"_last_sent:{turkeyNow.ToString("o", CultureInfo.InvariantCulture)}");
                            anyNotificationSentForUser = true;
                            report.SentCount++;
                            report.Details.Add($"{user.FirstName} {user.LastName} -> Öğle Yemeği Hatırlatması Gönderildi.");
                        }
                    }
                    else
                    {
                        sentNotifications.Add("lunch_reminder");
                        dailyLog.SentNotificationsJson = JsonSerializer.Serialize(sentNotifications.ToList());
                        _dailyTrackingRepository.Update(dailyLog);
                        await _unitOfWork.CommitAsync();
                    }
                }
                // 4. İKİNDİ SU HATIRLATMASI (15:15 - 16:45)
                else if (inWaterAfternoon && !sentNotifications.Contains("water_afternoon"))
                {
                    if (dailyLog.WaterGlasses < 7) // < 1.75 Litre
                    {
                        bool sent = await SendPushNotificationAsync(
                            user,
                            "💧 Hidrasyon Kontrolü",
                            "Antrenmanda kramplardan kaçınmak ve tam güç basmak için susuz kalma! Bugün kaç bardak su içtin?",
                            "/app",
                            "n1fit-water"
                        );
                        if (sent)
                        {
                            sentNotifications.Add("water_afternoon");
                            sentNotifications.RemoveWhere(x => x.StartsWith("_last_sent:", StringComparison.OrdinalIgnoreCase));
                            sentNotifications.Add($"_last_sent:{turkeyNow.ToString("o", CultureInfo.InvariantCulture)}");
                            anyNotificationSentForUser = true;
                            report.SentCount++;
                            report.Details.Add($"{user.FirstName} {user.LastName} -> İkindi Su Hatırlatması Gönderildi ({dailyLog.WaterGlasses}/12 Bardak).");
                        }
                    }
                    else
                    {
                        sentNotifications.Add("water_afternoon");
                        dailyLog.SentNotificationsJson = JsonSerializer.Serialize(sentNotifications.ToList());
                        _dailyTrackingRepository.Update(dailyLog);
                        await _unitOfWork.CommitAsync();
                    }
                }
                // 5. ARA ÖĞÜN / PRE-WORKOUT HATIRLATMASI (17:00 - 18:45)
                else if (inSnack && !sentNotifications.Contains("snack_reminder"))
                {
                    var snackMeal = userDiets.FirstOrDefault(d =>
                        MatchMeal(d.MealName, "ara", "pre", "antrenman oncesi", "antrenman öncesi", "ikindi", "snack", "3. ogun", "3.ogun")
                    ) ?? (userDiets.Count >= 4 ? userDiets[2] : null);

                    bool isCompleted = snackMeal != null && (
                        completedMeals.Contains(snackMeal.MealName) ||
                        completedMeals.Contains($"id_{snackMeal.Id}")
                    );

                    if (!isCompleted)
                    {
                        string title = "⚡ Antrenman Öncesi Enerji Depola!";
                        string body = snackMeal != null
                            ? $"Ağır kaldırışlar öncesi yakıtını aldın mı? ({snackMeal.MealName}) ara öğününü kaçırma, salona hazır gel!"
                            : "Ağır kaldırışlar öncesi yakıtını aldın mı? Ara öğününü kaçırma, salona tam performansla gel!";

                        bool sent = await SendPushNotificationAsync(user, title, body, "/app", "n1fit-meal");
                        if (sent)
                        {
                            sentNotifications.Add("snack_reminder");
                            sentNotifications.RemoveWhere(x => x.StartsWith("_last_sent:", StringComparison.OrdinalIgnoreCase));
                            sentNotifications.Add($"_last_sent:{turkeyNow.ToString("o", CultureInfo.InvariantCulture)}");
                            anyNotificationSentForUser = true;
                            report.SentCount++;
                            report.Details.Add($"{user.FirstName} {user.LastName} -> Ara Öğün Hatırlatması Gönderildi.");
                        }
                    }
                    else
                    {
                        sentNotifications.Add("snack_reminder");
                        dailyLog.SentNotificationsJson = JsonSerializer.Serialize(sentNotifications.ToList());
                        _dailyTrackingRepository.Update(dailyLog);
                        await _unitOfWork.CommitAsync();
                    }
                }
                // 6. AKŞAM YEMEĞİ HATIRLATMASI (19:15 - 20:45)
                else if (inDinner && !sentNotifications.Contains("dinner_reminder"))
                {
                    var dinnerMeal = userDiets.FirstOrDefault(d =>
                        MatchMeal(d.MealName, "akşam", "aksam", "dinner", "son ogun", "4. ogun", "4.ogun")
                    ) ?? (userDiets.Count >= 3 ? userDiets.LastOrDefault() : null);

                    bool isCompleted = dinnerMeal != null && (
                        completedMeals.Contains(dinnerMeal.MealName) ||
                        completedMeals.Contains($"id_{dinnerMeal.Id}")
                    );

                    if (!isCompleted)
                    {
                        string title = "🥩 Akşam Öğünü & Protein Zamanı";
                        string body = dinnerMeal != null
                            ? $"Günün yorgunluğunu atmak ve kasları onarmak için ({dinnerMeal.MealName}) akşam öğününü tamamla ve sisteme kaydet."
                            : "Günün yorgunluğunu atmak ve kasları onarmak için akşam öğününü tamamla ve formunu koru.";

                        bool sent = await SendPushNotificationAsync(user, title, body, "/app", "n1fit-meal");
                        if (sent)
                        {
                            sentNotifications.Add("dinner_reminder");
                            sentNotifications.RemoveWhere(x => x.StartsWith("_last_sent:", StringComparison.OrdinalIgnoreCase));
                            sentNotifications.Add($"_last_sent:{turkeyNow.ToString("o", CultureInfo.InvariantCulture)}");
                            anyNotificationSentForUser = true;
                            report.SentCount++;
                            report.Details.Add($"{user.FirstName} {user.LastName} -> Akşam Yemeği Hatırlatması Gönderildi.");
                        }
                    }
                    else
                    {
                        sentNotifications.Add("dinner_reminder");
                        dailyLog.SentNotificationsJson = JsonSerializer.Serialize(sentNotifications.ToList());
                        _dailyTrackingRepository.Update(dailyLog);
                        await _unitOfWork.CommitAsync();
                    }
                }
                // 7. AKŞAM SU HATIRLATMASI (21:00 - 22:15)
                else if (inWaterEvening && !sentNotifications.Contains("water_evening"))
                {
                    if (dailyLog.WaterGlasses < 12) // < 3 Litre
                    {
                        bool sent = await SendPushNotificationAsync(
                            user,
                            "💧 Günün Hedefini Tamamla",
                            "Kas tamiri ve toparlanma gece devam eder. 3 litre hedefine ulaşmak için kalan suyunu içmeyi unutma!",
                            "/app",
                            "n1fit-water"
                        );
                        if (sent)
                        {
                            sentNotifications.Add("water_evening");
                            sentNotifications.RemoveWhere(x => x.StartsWith("_last_sent:", StringComparison.OrdinalIgnoreCase));
                            sentNotifications.Add($"_last_sent:{turkeyNow.ToString("o", CultureInfo.InvariantCulture)}");
                            anyNotificationSentForUser = true;
                            report.SentCount++;
                            report.Details.Add($"{user.FirstName} {user.LastName} -> Akşam Su Kapanış Hatırlatması Gönderildi ({dailyLog.WaterGlasses}/12 Bardak).");
                        }
                    }
                    else
                    {
                        sentNotifications.Add("water_evening");
                        dailyLog.SentNotificationsJson = JsonSerializer.Serialize(sentNotifications.ToList());
                        _dailyTrackingRepository.Update(dailyLog);
                        await _unitOfWork.CommitAsync();
                    }
                }
                // 8. GÜNLÜK KALORİ & KAPANIŞ ÖZETİ (22:20 - 23:45)
                else if (inSummary && !sentNotifications.Contains("daily_summary"))
                {
                    int targetCalories = user.TargetCalories ?? userDiets.Sum(d => d.Calories ?? 0);
                    bool isCaloriesShort = targetCalories > 0 && dailyLog.ConsumedCalories < (targetCalories * 0.8);
                    bool isMealsIncomplete = userDiets.Any() && completedMeals.Count < userDiets.Count;

                    if (isCaloriesShort || isMealsIncomplete || dailyLog.WaterGlasses < 10)
                    {
                        bool sent = await SendPushNotificationAsync(
                            user,
                            "🏆 Günü Tamamla!",
                            "Bugünü hedefini tutturarak mı kapattın? Tükettiğin son besinleri ve suyunu kaydet, formunu zirvede tut.",
                            "/app",
                            "n1fit-summary"
                        );
                        if (sent)
                        {
                            sentNotifications.Add("daily_summary");
                            sentNotifications.RemoveWhere(x => x.StartsWith("_last_sent:", StringComparison.OrdinalIgnoreCase));
                            sentNotifications.Add($"_last_sent:{turkeyNow.ToString("o", CultureInfo.InvariantCulture)}");
                            anyNotificationSentForUser = true;
                            report.SentCount++;
                            report.Details.Add($"{user.FirstName} {user.LastName} -> Günlük Kapanış & Kalori Özeti Gönderildi.");
                        }
                    }
                    else
                    {
                        sentNotifications.Add("daily_summary");
                        dailyLog.SentNotificationsJson = JsonSerializer.Serialize(sentNotifications.ToList());
                        _dailyTrackingRepository.Update(dailyLog);
                        await _unitOfWork.CommitAsync();
                    }
                }

                if (anyNotificationSentForUser)
                {
                    dailyLog.SentNotificationsJson = JsonSerializer.Serialize(sentNotifications.ToList());
                    dailyLog.LastUpdated = turkeyNow;
                    _dailyTrackingRepository.Update(dailyLog);
                    await _unitOfWork.CommitAsync();
                }
            }

            return report;
        }
    }
}
