using Fitness.Core.DTOs;
using Fitness.Core.Entities;
using Fitness.Core.Interfaces;
using Fitness.Service.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Fitness.API.Controllers
{
    [Authorize(Roles = "Admin")]
    [Route("api/[controller]")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;
        private readonly IWorkoutService _workoutService;
        private readonly IFoodService _foodService;

        public AdminController(IAdminService adminService, IWorkoutService workoutService, IFoodService foodService)
        {
            _adminService = adminService;
            _workoutService = workoutService;
            _foodService = foodService;
        }

        [HttpGet("members")]
        public async Task<IActionResult> GetMembers()
        {
            var allMembers = await _adminService.GetAllMembersAsync();

            if (allMembers == null || !allMembers.Any())
                return Ok(new List<MemberListDto>());

            var sortedMembers = allMembers
                .OrderByDescending(m => m.SubscriptionEndDate ?? DateTime.MinValue)
                .ToList();

            return Ok(sortedMembers);
        }

        [HttpPost("add-member")]
        [HttpPost("members")]
        public async Task<IActionResult> AddMember([FromBody] AdminAddMemberDto dto)
        {
            try
            {
                await _adminService.AddMemberAsync(dto);
                return Ok(new { message = "Üye sisteme eklendi!" });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("member/{id}")]
        [HttpGet("members/{id}")]
        [HttpGet("member-detail/{id}")]
        public async Task<IActionResult> GetMemberById(int id)
        {
            var member = await _adminService.GetMemberByIdAsync(id);
            if (member == null)
                return NotFound(new { message = "Üye bulunamadı!" });

            return Ok(member);
        }

        [HttpPut("update-member/{id}")]
        [HttpPut("members/{id}")]
        public async Task<IActionResult> UpdateMember(int id, [FromBody] UpdateMemberDto dto)
        {
            try
            {
                await _adminService.UpdateMemberAsync(id, dto);
                return Ok(new { message = "Üyenin bilgileri güncellendi!" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
        }

        [HttpDelete("delete-member/{id}")]
        [HttpDelete("members/{id}")]
        public async Task<IActionResult> DeleteMember(int id)
        {
            await _adminService.DeleteMemberAsync(id);
            return Ok(new { message = "Üye silindi!" });
        }

        [HttpPatch("toggle-freeze/{id}")]
        [HttpPatch("members/{id}/toggle-freeze")]
        public async Task<IActionResult> ToggleFreeze(int id)
        {
            await _adminService.ToggleFreezeAsync(id);
            return Ok(new { message = "Üyenin durumu güncellendi!" });
        }

        [HttpPost("members/{id}/renew")]
        public async Task<IActionResult> RenewMembership(int id, [FromBody] RenewDto dto)
        {
            try
            {
                var success = await _adminService.RenewMembershipAsync(id, dto.PackageId, dto.PaidAmount, dto.StartDate, dto.EndDate);
                if (!success)
                    return NotFound(new { message = "Üye bulunamadı!" });

                return Ok(new { message = "Üyenin süresi uzatıldı!" });
            }
            catch (KeyNotFoundException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("members/{id}/pay-debt")]
        public async Task<IActionResult> PayDebt(int id, [FromBody] PayDebtDto dto)
        {
            try
            {
                var success = await _adminService.PayDebtAsync(id, dto.Amount);
                if (!success)
                    return NotFound(new { message = "Üye bulunamadı!" });

                return Ok(new { message = "Ödeme gerçekleştirildi!" });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // --- DİYET İŞLEMLERİ ---
        [HttpGet("members/{id}/diet")]
        [HttpGet("member/{id}/diet")]
        public async Task<IActionResult> GetDietProgram(int id)
        {
            var meals = await _adminService.GetDietProgramAsync(id);
            return Ok(meals);
        }

        [HttpPost("member/{id}/diet")]
        [HttpPost("members/{id}/diet")]
        public async Task<IActionResult> AddMeal(int id, [FromBody] DietDto dto)
        {
            await _adminService.AddMealAsync(id, dto);
            return Ok(new { message = "Öğün menüye eklendi!" });
        }

        [HttpPut("diet/{mealId}")]
        public async Task<IActionResult> UpdateMeal(int mealId, [FromBody] DietDto dto)
        {
            await _adminService.UpdateMealAsync(mealId, dto);
            return Ok(new { message = "Öğün güncellendi!" });
        }

        [HttpDelete("diet/{mealId}")]
        public async Task<IActionResult> DeleteMeal(int mealId)
        {
            await _adminService.DeleteMealAsync(mealId);
            return Ok(new { message = "Öğün silindi!" });
        }

        [HttpPost("members/{id}/diet-program")]
        public async Task<IActionResult> SaveDietProgram(int id, [FromBody] SaveDietProgramDto dto)
        {
            await _adminService.SaveDietProgramAsync(id, dto);
            return Ok(new { message = "Diyet düzeni kaydedildi!" });
        }

        [HttpPost("member/{id}/target-calories")]
        [HttpPost("members/{id}/target-calories")]
        public async Task<IActionResult> SetTargetCalories(int id, [FromBody] SetTargetCaloriesDto dto)
        {
            await _adminService.SetTargetCaloriesAsync(id, dto);
            return Ok(new { message = "Hedef kalori başarıyla kaydedildi!", targetCalories = dto.TargetCalories });
        }

        // --- BESİN KÜTÜPHANESİ & OPEN FOOD FACTS ENTEGRASYONU ---
        [HttpGet("foods/search")]
        [HttpGet("foods")]
        public async Task<IActionResult> SearchFoods([FromQuery] string? q = null, [FromQuery] string? category = null, [FromQuery] bool external = false)
        {
            var results = await _foodService.SearchFoodsAsync(q, category, external);
            return Ok(results);
        }

        [HttpPost("foods")]
        [HttpPost("foods/cache")]
        public async Task<IActionResult> CreateOrCacheFood([FromBody] FoodDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest(new { message = "Besin adı zorunludur." });

            var savedFood = await _foodService.CreateOrCacheFoodAsync(dto);
            return Ok(savedFood);
        }

        // --- ANTRENMAN İŞLEMLERİ ---
        [HttpGet("members/{id}/workout-program")]
        [HttpGet("member/{id}/workout-program")]
        public async Task<IActionResult> GetWorkoutProgram(int id)
        {
            var program = await _workoutService.GetMemberProgramAsync(id);

            if (program == null)
            {
                return Ok(new { days = new List<object>() });
            }

            var result = new
            {
                program.Id,
                Days = program.Days.Select(d => new
                {
                    d.Id,
                    d.Title,
                    Exercises = d.Exercises.Select(e => new
                    {
                        e.ExerciseId,
                        ExerciseName = e.Exercise?.Name ?? "Bilinmeyen Hareket",
                        e.Sets,
                        e.Reps,
                        e.RestTime,
                        e.Duration,
                        e.Speed,
                        e.Incline
                    }).ToList()
                }).ToList()
            };

            return Ok(result);
        }

        [HttpPost("members/{id}/workout-program")]
        [HttpPost("member/{id}/workout-program")]
        public async Task<IActionResult> SaveWorkoutProgram(int id, [FromBody] SaveWorkoutProgramDto dto)
        {
            await _workoutService.SaveWorkoutProgramAsync(id, dto);
            return Ok(new { message = "Antrenman programı kaydedildi!" });
        }

        // --- HAREKET KÜTÜPHANESİ İŞLEMLERİ ---
        [HttpGet("exercises")]
        public async Task<IActionResult> GetAllExercises()
        {
            var exercises = await _adminService.GetAllExercisesAsync();
            return Ok(exercises);
        }

        [HttpPost("exercises")]
        public async Task<IActionResult> AddExercise([FromBody] ExerciseDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            await _adminService.AddExerciseAsync(dto);
            return Ok(new { message = "Hareket kütüphaneye eklendi!" });
        }

        [HttpPut("exercises/{id}")]
        public async Task<IActionResult> UpdateExercise(int id, [FromBody] ExerciseDto dto)
        {
            await _adminService.UpdateExerciseAsync(id, dto);
            return Ok(new { message = "Hareket güncellendi!" });
        }

        [HttpDelete("exercises/{id}")]
        public async Task<IActionResult> DeleteExercise(int id)
        {
            await _adminService.DeleteExerciseAsync(id);
            return Ok(new { message = "Hareket silindi!" });
        }

        // --- ÜYELİK PAKETLERİ İŞLEMLERİ ---
        [HttpGet("packages")]
        public async Task<IActionResult> GetPackages()
        {
            var packages = await _adminService.GetAllPackagesAsync();
            return Ok(packages);
        }

        [HttpPost("packages")]
        public async Task<IActionResult> AddPackage([FromBody] MembershipPackage package)
        {
            await _adminService.AddPackageAsync(package);
            return Ok(new { message = "Paket eklendi!" });
        }

        [HttpPut("packages/{id}")]
        public async Task<IActionResult> UpdatePackage(int id, [FromBody] MembershipPackage package)
        {
            await _adminService.UpdatePackageAsync(id, package);
            return Ok(new { message = "Paket güncellendi!" });
        }

        [HttpDelete("packages/{id}")]
        public async Task<IActionResult> DeletePackage(int id)
        {
            await _adminService.DeletePackageAsync(id);
            return Ok(new { message = "Paket silindi!" });
        }

        [HttpPatch("packages/{id}/toggle-website")]
        [HttpPost("packages/{id}/toggle-website")]
        public async Task<IActionResult> TogglePackageWebsite(int id)
        {
            var isVisible = await _adminService.TogglePackageWebsiteAsync(id);
            return Ok(new { message = "Paket vitrin durumu güncellendi!", showOnWebsite = isVisible });
        }

        // --- ÖLÇÜM İŞLEMLERİ ---
        [HttpPost("member/{id}/measurements")]
        [HttpPost("members/{id}/measurements")]
        public async Task<IActionResult> AddMeasurement(int id, [FromBody] MeasurementDto dto)
        {
            await _adminService.AddMeasurementAsync(id, dto);
            return Ok(new { message = "Ölçü eklendi!" });
        }

        [HttpGet("member/{id}/measurements")]
        [HttpGet("members/{id}/measurements")]
        public async Task<IActionResult> GetMeasurements(int id)
        {
            var measurements = await _adminService.GetMeasurementsAsync(id);
            return Ok(measurements);
        }

        [HttpDelete("measurements/{id}")]
        public async Task<IActionResult> DeleteMeasurement(int id)
        {
            var success = await _adminService.DeleteMeasurementAsync(id);
            if (!success)
                return NotFound(new { message = "Ölçü bulunamadı!" });

            return Ok(new { message = "Ölçü silindi!" });
        }

        [HttpPut("measurements/{id}")]
        public async Task<IActionResult> UpdateMeasurement(int id, [FromBody] MeasurementDto dto)
        {
            await _adminService.UpdateMeasurementAsync(id, dto);
            return Ok(new { message = "Ölçü güncellendi!" });
        }

        [HttpPost("test-sms")]
        public async Task<IActionResult> SendTestSms([FromServices] ISmsService smsService, [FromQuery] string phone = "5352850216")
        {
            var msg = Fitness.Service.Service.JobService.BuildExpiringSubscriptionSmsMessage("Değerli", "Üyemiz", 500m);
            var result = await smsService.SendSmsAsync(phone, msg);
            return Ok(new
            {
                success = result.Success,
                responseCode = result.ResponseCode,
                rawResponse = result.RawResponse,
                sentMessage = msg
            });
        }

        // --- SALON & EKİPMAN / FOTOĞRAF YÖNETİMİ ---
        [HttpGet("facilities")]
        public async Task<IActionResult> GetFacilities()
        {
            var config = await _adminService.GetFacilityConfigAsync();
            return Ok(config);
        }

        [HttpPost("facilities")]
        public async Task<IActionResult> SaveFacilities([FromBody] FacilityConfigDto config)
        {
            if (config == null) return BadRequest("Geçersiz yapılandırma.");
            var saved = await _adminService.SaveFacilityConfigAsync(config);
            return Ok(saved);
        }

        [HttpPost("facilities/reset")]
        public async Task<IActionResult> ResetFacilities()
        {
            var reset = await _adminService.ResetFacilityConfigAsync();
            return Ok(reset);
        }

        // --- WEB SİTESİ STÜDYOSU (MODÜLER KONTEYNIR CMS & POPUP) ---
        [HttpGet("site-studio")]
        public async Task<IActionResult> GetSiteStudio()
        {
            var config = await _adminService.GetSiteStudioConfigAsync();
            return Ok(config);
        }

        [HttpPost("site-studio")]
        public async Task<IActionResult> SaveSiteStudio([FromBody] SiteStudioConfigDto config)
        {
            if (config == null) return BadRequest("Geçersiz stüdyo yapılandırması.");
            var saved = await _adminService.SaveSiteStudioConfigAsync(config);
            return Ok(saved);
        }

        [HttpPost("site-studio/reset")]
        public async Task<IActionResult> ResetSiteStudio()
        {
            var reset = await _adminService.ResetSiteStudioConfigAsync();
            return Ok(reset);
        }

        [AllowAnonymous]
        [HttpGet("public/site-studio")]
        public async Task<IActionResult> GetPublicSiteStudio()
        {
            var config = await _adminService.GetPublicSiteStudioConfigAsync();
            return Ok(config);
        }

        [AllowAnonymous]
        [HttpPost("public/site-lead")]
        public async Task<IActionResult> SubmitPublicSiteLead([FromBody] CreateSiteLeadDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.FullName) || string.IsNullOrWhiteSpace(dto.Phone))
                return BadRequest(new { message = "Lütfen Ad Soyad ve Telefon Numarası alanlarını doldurun." });

            var created = await _adminService.AddSiteLeadAsync(dto);
            return Ok(new { message = "Başvurunuz başarıyla alındı! En kısa sürede sizinle iletişime geçeceğiz.", lead = created });
        }

        [HttpGet("site-leads")]
        public async Task<IActionResult> GetSiteLeads()
        {
            var leads = await _adminService.GetSiteLeadsAsync();
            return Ok(leads);
        }

        [HttpPut("site-leads/{id}/status")]
        public async Task<IActionResult> UpdateSiteLeadStatus(long id, [FromBody] UpdateSiteLeadStatusDto dto)
        {
            var updated = await _adminService.UpdateSiteLeadStatusAsync(id, dto);
            if (updated == null) return NotFound(new { message = "Başvuru kaydı bulunamadı." });
            return Ok(updated);
        }

        [HttpDelete("site-leads/{id}")]
        public async Task<IActionResult> DeleteSiteLead(long id)
        {
            var deleted = await _adminService.DeleteSiteLeadAsync(id);
            if (!deleted) return NotFound(new { message = "Başvuru kaydı bulunamadı." });
            return Ok(new { message = "Başvuru kaydı silindi." });
        }

        [HttpPost("exercises/sync-muscle-groups")]
        public async Task<IActionResult> SyncMuscleGroups()
        {
            var count = await _adminService.SyncStandardMuscleGroupsAsync();
            return Ok(new { message = $"{count} egzersizin kas grubu anatomik standartla senkronize edildi.", updatedCount = count });
        }

        [HttpPost("push/test")]
        public async Task<IActionResult> TestPushNotification(
            [FromBody] PushTestDto dto,
            [FromServices] JobService jobService,
            [FromServices] IGenericRepository<User> userRepo)
        {
            User? targetUser = null;
            if (dto.UserId.HasValue)
            {
                targetUser = await userRepo.GetByIdAsync(dto.UserId.Value);
            }
            else
            {
                targetUser = await userRepo
                    .Where(u => !string.IsNullOrWhiteSpace(u.PushEndpoint))
                    .OrderByDescending(u => u.Id)
                    .FirstOrDefaultAsync();
            }

            if (targetUser == null)
            {
                return NotFound(new { message = "Bildirim gönderilebilecek, push aboneliği bulunan üye bulunamadı." });
            }

            bool sent = await jobService.SendPushNotificationAsync(
                targetUser,
                dto.Title ?? "N1FIT Test Bildirimi",
                dto.Message ?? "Bu bir test bildirimidir.",
                dto.Url ?? "/app"
            );

            return Ok(new
            {
                success = sent,
                message = sent ? $"'{targetUser.FirstName} {targetUser.LastName}' adlı üyeye push bildirimi başarıyla iletildi!" : "Bildirim iletilemedi. Push servisi hata verdi veya abonelik geçersiz.",
                targetUser = $"{targetUser.FirstName} {targetUser.LastName} ({targetUser.Email})"
            });
        }

        [HttpPost("push/trigger-diet-reminders")]
        public async Task<IActionResult> TriggerDietReminders([FromQuery] bool forceAll, [FromServices] JobService jobService)
        {
            var report = await jobService.CheckDietAndWaterReminders(forceAll);
            return Ok(report);
        }

        [HttpPost("upload-photo")]
        public async Task<IActionResult> UploadPhoto(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Lütfen geçerli bir fotoğraf dosyası seçin." });

            if (file.Length > 15 * 1024 * 1024)
                return BadRequest(new { message = "Fotoğraf boyutu 15 MB'tan büyük olamaz." });

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            if (!allowedExtensions.Contains(ext))
                return BadRequest(new { message = "Yalnızca JPG, JPEG, PNG veya WEBP formatındaki fotoğraflar yüklenebilir." });

            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "uploads", "salon");
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            var fileName = $"salon_{DateTime.UtcNow:yyyyMMdd_HHmmss}_{Guid.NewGuid().ToString("N").Substring(0, 8)}{ext}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var baseUrl = $"{Request.Scheme}://{Request.Host}";
            var fileUrl = $"{baseUrl}/uploads/salon/{fileName}";

            return Ok(new
            {
                url = fileUrl,
                fileName = fileName,
                message = "Fotoğraf başarıyla yüklendi."
            });
        }

        [HttpPost("delete-photo")]
        public IActionResult DeletePhoto([FromBody] DeletePhotoDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Url))
                return BadRequest(new { message = "Geçersiz fotoğraf bağlantısı." });

            // 1. Sistem varsayılan fotoğraflarını koru (/SalonunFotolari/ vb.)
            if (dto.Url.Contains("/SalonunFotolari/", StringComparison.OrdinalIgnoreCase))
            {
                return Ok(new { success = true, message = "Sistem varsayılan fotoğrafı listeden kaldırıldı (fiziksel sistem dosyası korundu)." });
            }

            // 2. Yüklenen dosya ise diskten sil
            try
            {
                string rawPath = dto.Url.Trim();
                string fileName = string.Empty;

                if (Uri.TryCreate(rawPath, UriKind.Absolute, out var uri))
                {
                    fileName = Path.GetFileName(uri.LocalPath);
                }
                else
                {
                    fileName = Path.GetFileName(rawPath);
                }

                if (string.IsNullOrWhiteSpace(fileName))
                {
                    return BadRequest(new { message = "Dosya adı tespit edilemedi." });
                }

                // Path traversal engelleme
                fileName = Path.GetFileName(fileName);

                var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "uploads", "salon");
                var filePath = Path.Combine(uploadsFolder, fileName);

                if (System.IO.File.Exists(filePath))
                {
                    System.IO.File.Delete(filePath);
                    return Ok(new { success = true, message = $"'{fileName}' sunucu diskinden fiziksel olarak silindi." });
                }

                return Ok(new { success = true, message = "Dosya diskte bulunamadı veya zaten silinmiş." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Dosya silinirken hata oluştu: {ex.Message}" });
            }
        }
    }
}
