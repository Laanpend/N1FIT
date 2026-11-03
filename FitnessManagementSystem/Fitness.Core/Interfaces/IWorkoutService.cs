using Fitness.Core.DTOs;
using Fitness.Core.Entities;
using System.Threading.Tasks;

namespace Fitness.Core.Interfaces
{
    public interface IWorkoutService : IService<WorkoutProgram>
    {
        Task<WorkoutProgram?> GetMemberProgramAsync(int userId);
        Task SaveWorkoutProgramAsync(int userId, SaveWorkoutProgramDto dto);
    }
}
