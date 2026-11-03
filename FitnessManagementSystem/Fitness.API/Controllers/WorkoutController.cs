using Fitness.Core.Entities;
using Fitness.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Fitness.API.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class WorkoutController : ControllerBase
    {
        private readonly IWorkoutService _workoutService;

        public WorkoutController(IWorkoutService workoutService) => _workoutService = workoutService;

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] WorkoutProgram workout)
        {
            return Ok(await _workoutService.AddAsync(workout));
        }

        [HttpGet("my-program/{userId}")]
        public async Task<IActionResult> GetMyProgram(int userId)
        {
            var isAdmin = User.IsInRole("Admin");
            var currentUserIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!isAdmin && (!int.TryParse(currentUserIdStr, out int currentUserId) || currentUserId != userId))
            {
                return Forbid();
            }

            return Ok(await _workoutService.GetMemberProgramAsync(userId));
        }
    }
}
