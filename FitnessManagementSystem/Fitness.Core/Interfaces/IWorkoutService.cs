using Fitness.Core.DTOs;
using Fitness.Core.Entities;
using System.Threading.Tasks;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Fitness.Core.DTOs.Fitness.Core.DTOs;


namespace Fitness.Core.Interfaces
{
    public interface IWorkoutService : IService<WorkoutProgram>
    {
        // BAK BU SİLİNMİŞTİ, GERİ GETİRDİK AMQ
        Task<WorkoutProgram> GetMemberProgramAsync(int userId);

        Task SaveWorkoutProgramAsync(int userId, SaveWorkoutProgramDto dto);
    }
}
