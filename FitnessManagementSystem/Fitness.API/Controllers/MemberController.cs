using Fitness.Core.DTOs;
using Fitness.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Fitness.API.Controllers
{
    [Authorize(Roles = "Member,Admin")]
    [Route("api/[controller]")]
    [ApiController]
    public class MemberController : ControllerBase
    {
        private readonly IMemberService _memberService;

        public MemberController(IMemberService memberService)
        {
            _memberService = memberService;
        }

        private bool TryGetUserId(out int userId)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdString, out userId);
        }

        [HttpGet("my-profile")]
        public async Task<IActionResult> GetMyProfile()
        {
            if (!TryGetUserId(out int userId))
                return Unauthorized(new { message = "Geçersiz oturum, lütfen yeniden giriş yapın." });

            try
            {
                var profile = await _memberService.GetMyProfileAsync(userId);
                return Ok(profile);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpGet("my-workout")]
        public async Task<IActionResult> GetMyWorkout()
        {
            if (!TryGetUserId(out int userId))
                return Unauthorized(new { message = "Geçersiz oturum." });

            var workout = await _memberService.GetMyWorkoutAsync(userId);
            return Ok(workout);
        }

        [HttpGet("my-diet")]
        public async Task<IActionResult> GetMyDiet()
        {
            if (!TryGetUserId(out int userId))
                return Unauthorized(new { message = "Geçersiz oturum." });

            var diet = await _memberService.GetMyDietAsync(userId);
            return Ok(diet);
        }

        [HttpGet("my-measurements")]
        public async Task<IActionResult> GetMyMeasurements()
        {
            if (!TryGetUserId(out int userId))
                return Unauthorized(new { message = "Geçersiz oturum." });

            var measurements = await _memberService.GetMyMeasurementsAsync(userId);
            return Ok(measurements);
        }

        [HttpPost("save-subscription")]
        [Authorize]
        public async Task<IActionResult> SaveSubscription([FromBody] PushSubscriptionDto dto)
        {
            if (!TryGetUserId(out int userId))
                return Unauthorized(new { message = "Geçersiz oturum." });

            await _memberService.SavePushSubscriptionAsync(userId, dto.Endpoint, dto.P256dh, dto.Auth);
            return Ok(new { message = "Bildirim aboneliği başarıyla kaydedildi." });
        }

        [AllowAnonymous]
        [HttpGet("packages")]
        public async Task<IActionResult> GetPublicPackages([FromServices] IAdminService adminService)
        {
            var packages = await adminService.GetAllPackagesAsync();
            var publicPackages = packages.Where(p => p.ShowOnWebsite).ToList();
            // Eğer yönetici henüz vitrin paketi seçmediyse ilk 3 paketi varsayılan göster
            if (!publicPackages.Any())
            {
                publicPackages = packages.Take(3).ToList();
            }
            return Ok(publicPackages);
        }

        [AllowAnonymous]
        [HttpGet("facilities")]
        public async Task<IActionResult> GetPublicFacilities([FromServices] IAdminService adminService)
        {
            var config = await adminService.GetFacilityConfigAsync();
            return Ok(config);
        }

        [HttpGet("body-profile")]
        public async Task<IActionResult> GetBodyProfile()
        {
            if (!TryGetUserId(out int userId))
                return Unauthorized(new { message = "Geçersiz oturum." });

            try
            {
                var bodyProfile = await _memberService.GetBodyProfileAsync(userId);
                return Ok(bodyProfile);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpPost("calculate-body-composition")]
        public async Task<IActionResult> CalculateBodyComposition([FromBody] BodyCompositionRequestDto dto)
        {
            if (!TryGetUserId(out int userId))
                return Unauthorized(new { message = "Geçersiz oturum." });

            try
            {
                var result = await _memberService.CalculateBodyCompositionAsync(userId, dto);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("daily-tracking/sync")]
        public async Task<IActionResult> SyncDailyTracking([FromBody] SyncDailyTrackingDto dto)
        {
            if (!TryGetUserId(out int userId))
                return Unauthorized(new { message = "Geçersiz oturum." });

            await _memberService.SyncDailyTrackingAsync(userId, dto);
            return Ok(new { message = "Günlük takip başarıyla eşitlendi." });
        }

        [HttpGet("daily-tracking")]
        public async Task<IActionResult> GetDailyTracking([FromQuery] string date)
        {
            if (!TryGetUserId(out int userId))
                return Unauthorized(new { message = "Geçersiz oturum." });

            var log = await _memberService.GetDailyTrackingAsync(userId, date);
            return Ok(log);
        }
    }
}
