using Fitness.Core.Entities;
using Fitness.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Fitness.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class WorkoutController : ControllerBase
    {
        private readonly IWorkoutService _workoutService;

        public WorkoutController(IWorkoutService workoutService) => _workoutService = workoutService;

        // Admin'in üye için program oluşturduğu yer
        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> Create(WorkoutProgram workout)
        {
            return Ok(await _workoutService.AddAsync(workout));
        }

        // Üyenin kendi programını gördüğü yer
        [HttpGet("my-program/{userId}")]
        public async Task<IActionResult> GetMyProgram(int userId)
        {
            return Ok(await _workoutService.GetMemberProgramAsync(userId));
        }
    }
}
