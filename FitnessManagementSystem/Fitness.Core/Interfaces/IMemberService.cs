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
        Task<object> GetMyWorkoutAsync(int userId);
        Task<object> GetMyDietAsync(int userId);
        Task<IEnumerable<object>> GetMyMeasurementsAsync(int userId);
        Task SavePushSubscriptionAsync(int userId, string endpoint, string p256dh, string auth);
    }
}
