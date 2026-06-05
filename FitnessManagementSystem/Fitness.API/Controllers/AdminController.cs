using Fitness.Core.DTOs;
using Fitness.Core.DTOs.Fitness.Core.DTOs;
using Fitness.Core.Entities;
using Fitness.Core.Interfaces;
using Fitness.Service.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Fitness.API.Controllers
{
    [Authorize(Roles = "Admin")]
    [Route("api/[controller]")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;
        private readonly IWorkoutService _workoutService;

        public AdminController(IAdminService adminService,IWorkoutService workoutService)
        {
            _adminService = adminService;
            _workoutService = workoutService; // Eşleştirmeyi yapıyoruz
        }

        [HttpGet("members")]
        public async Task<IActionResult> GetMembers()
        {
            var members = await _adminService.GetAllMembersAsync();
            return Ok(members);
        }

        [HttpPost("add-member")]
        public async Task<IActionResult> AddMember([FromBody] AdminAddMemberDto dto)
        {   
            // Değişken atamasını (var result =) siliyoruz çünkü metod bir şey dönmüyor
            await _adminService.AddMemberAsync(dto);

            return Ok(new { message = "Üye sisteme eklendi!" });
        }


        [HttpGet("members/{id}/diet")]
        public async Task<IActionResult> GetDietProgram(int id)
        {
            var meals = await _adminService.GetDietProgramAsync(id);
            return Ok(meals);
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
            return Ok(new { message = "Diet düzeni eklendi!" });
        }

        [HttpGet("members/{id}/workout-program")]
        public async Task<IActionResult> GetWorkoutProgram(int id)
        {
            // WorkoutService içindeki GetMemberProgramAsync metodunun 
            // .Include(x => x.Days).ThenInclude(x => x.Exercises).ThenInclude(x => x.Exercise)
            // şeklinde her şeyi çektiğinden emin ol!
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
                        // BURASI KRİTİK: React'ta ismi görmek için Exercise.Name lazım
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
        public async Task<IActionResult> SaveWorkoutProgram(int id, [FromBody] SaveWorkoutProgramDto dto)
        {
            await _workoutService.SaveWorkoutProgramAsync(id, dto);
            return Ok(new { message = "Antrenman programı eklendi!" });
        }

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

        [HttpGet("packages")]
        public async Task<IActionResult> GetPackages()
        {
            // YANLIŞ YAPTIĞIN YER BURASIYDI, ÜYELERİ DEĞİL PAKETLERİ ÇEKECEKSİN
            var packages = await _adminService.GetAllPackagesAsync();
            return Ok(packages);
        }

        // AdminController.cs dosyasının en altına şu 3 fişeği ekle:

        [HttpPost("packages")]
        public async Task<IActionResult> AddPackage([FromBody] MembershipPackage package)
        {
            await _adminService.AddPackageAsync(package); // Service tarafında bu metotları da yazmayı unutma
            return Ok(new { message = "Paket dükkana eklendi!" });
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

        [HttpPut("update-member/{id}")]
        public async Task<IActionResult> UpdateMember(int id, [FromBody] UpdateMemberDto dto)
        {
            await _adminService.UpdateMemberAsync(id, dto);
            return Ok(new { message = "Üyenin bilgileri güncellendi!" });
        }

        [HttpDelete("delete-member/{id}")]
        public async Task<IActionResult> DeleteMember(int id)
        {
            await _adminService.DeleteMemberAsync(id);
            return Ok(new { message = "Üye silindi!" });
        }

        // AdminController.cs içine zımbala
        [HttpPatch("toggle-freeze/{id}")]
        public async Task<IActionResult> ToggleFreeze(int id)
        {
            await _adminService.ToggleFreezeAsync(id);
            return Ok(new { message = "Üyenin durumu değişti!" });
        }

        // 1. ADAMI ÇAĞIRMA KAPISI
        [HttpGet("member/{id}")]
        public async Task<IActionResult> GetMemberById(int id)
        {
            var member = await _adminService.GetMemberByIdAsync(id);
            if (member == null) return NotFound("Böyle bir üye yok!");
            return Ok(member);
        }

        // 2. ÖLÇÜ EKLEME VE GETİRME KAPILARI
        [HttpPost("member/{id}/measurements")]
        public async Task<IActionResult> AddMeasurement(int id, [FromBody] MeasurementDto dto)
        {
            await _adminService.AddMeasurementAsync(id, dto);
            return Ok(new { message = "Ölçü eklendi!" });
        }

        [HttpGet("member/{id}/measurements")]
        public async Task<IActionResult> GetMeasurements(int id)
        {
            var measurements = await _adminService.GetMeasurementsAsync(id);
            return Ok(measurements);
        }

        // 3. DİYET EKLEME VE GETİRME KAPILARI
        [HttpPost("member/{id}/diet")]
        public async Task<IActionResult> AddMeal(int id, [FromBody] DietDto dto)
        {
            await _adminService.AddMealAsync(id, dto);
            return Ok(new { message = "Öğün menüye eklendi!" });
        }

        [HttpGet("member/{id}/diet")]
        public async Task<IActionResult> GetDiet(int id)
        {
            var diet = await _adminService.GetDietProgramAsync(id);
            return Ok(diet);
        }

        [HttpGet("member-detail/{id}")]
        public async Task<IActionResult> GetMemberDetail(int id)
        {
            var profile = await _adminService.GetMemberByIdAsync(id);
            if (profile == null) return NotFound("Üye bulunamadı!");
            return Ok(profile);
        }

        // AdminController.cs içine bunu çak:
        [HttpDelete("measurements/{id}")]
        public async Task<IActionResult> DeleteMeasurement(int id)
        {
            // Artık mimariye uygun, aslanlar gibi kendi servisinden çağırıyorsun!
            var success = await _adminService.DeleteMeasurementAsync(id);

            if (!success)
                return NotFound("Ölçü bulunamadı!");

            return Ok(new { message = "Ölçü silindi!" });
        }

        [HttpPut("measurements/{id}")]
        public async Task<IActionResult> UpdateMeasurement(int id, [FromBody] MeasurementDto dto)
        {
            await _adminService.UpdateMeasurementAsync(id, dto);
            return Ok(new { message = "Ölçü gibi güncellendi!" });
        }

        [HttpPost("members/{id}/renew")]
        public async Task<IActionResult> RenewMembership(int id, [FromBody] RenewDto dto)
        {
            var success = await _adminService.RenewMembershipAsync(id, dto.PackageId, dto.PaidAmount);

            if (!success) return NotFound("Böyle bir üye yok!");

            return Ok(new { message = "Üyenin süresi uzatıldı!" });
        }
        [HttpPost("members/{id}/pay-debt")]
        public async Task<IActionResult> PayDebt(int id, [FromBody] PayDebtDto dto)
        {
            // Artık çıplak rakam değil, kutunun içindeki Amount'u alıyoruz
            var success = await _adminService.PayDebtAsync(id, dto.Amount);

            if (!success) return NotFound("Üye bulunamadı!");

            return Ok(new { message = "Ödeme Gerçekleştirildi!" });
        }
    }
}
