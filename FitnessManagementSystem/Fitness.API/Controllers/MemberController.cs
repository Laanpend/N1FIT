using Fitness.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Fitness.API.Controllers
{
    [Authorize(Roles = "Member")] // KİLİT!
    [Route("api/[controller]")]
    [ApiController]
    public class MemberController : ControllerBase
    {
        private readonly IMemberService _memberService;

        public MemberController(IMemberService memberService)
        {
            _memberService = memberService;
        }

        [HttpGet("my-profile")]
        public async Task<IActionResult> GetMyProfile()
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdString))
                return Unauthorized(new { message = "Token patlak dayı, yeniden giriş yap!" });

            int userId = int.Parse(userIdString);
            var profile = await _memberService.GetMyProfileAsync(userId);

            return Ok(profile);
        }
    }
}