using Fitness.Core.Entities;
using Fitness.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Fitness.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ExerciseController : ControllerBase
    {
        private readonly IExerciseService _exerciseService;

        public ExerciseController(IExerciseService exerciseService)
        {
            _exerciseService = exerciseService;
        }

        // Herkes görebilir (Müşteri antrenman bakarken lazım)
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            return Ok(await _exerciseService.GetAllAsync());
        }

        // Sadece belli bölgeyi getir (Göğüs, Sırt vb.)
        [HttpGet("category/{muscleGroup}")]
        public async Task<IActionResult> GetByCategory(string muscleGroup)
        {
            return Ok(await _exerciseService.GetByMuscleGroupAsync(muscleGroup));
        }

        // Sadece Admin hareket ekleyebilir
        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> Create(Exercise exercise)
        {
            return Ok(await _exerciseService.AddAsync(exercise));
        }
    }
}
