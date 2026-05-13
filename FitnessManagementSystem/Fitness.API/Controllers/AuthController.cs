using Microsoft.AspNetCore.Mvc;
using Fitness.Core.DTOs;
using Fitness.Core.Interfaces;

namespace Fitness.API.Controllers
{


    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(UserCreateDto userCreateDto)
        {
            await _authService.RegisterAsync(userCreateDto);
            return Ok("Kayıt başarılı, N1FIT'e hoş geldiniz!");
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        {
            var token = await _authService.LoginAsync(loginDto.Email, loginDto.Password);
            return Ok(new { Token = token });
        }
    }
}
