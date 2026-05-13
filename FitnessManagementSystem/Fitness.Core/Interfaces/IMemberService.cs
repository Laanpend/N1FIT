using Fitness.Core.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fitness.Core.Interfaces
{
    public interface IMemberService
    {
        Task<MemberProfileDto> GetMyProfileAsync(int userId);
    }
}
