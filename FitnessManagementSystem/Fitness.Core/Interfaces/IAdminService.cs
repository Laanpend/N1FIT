using Fitness.Core.DTOs;
using Fitness.Core.DTOs.Fitness.Core.DTOs;
using Fitness.Core.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fitness.Core.Interfaces
{
    public interface IAdminService
    {
        Task AddMemberAsync(AdminAddMemberDto dto);
        Task<IEnumerable<MemberListDto>> GetAllMembersAsync();
        Task ToggleMemberStatusAsync(int id); // Üyeyi aktif/pasif yapma

        Task<MemberProfileDto> GetMemberByIdAsync(int id);

        Task AddMeasurementAsync(int userId, MeasurementDto dto);
        Task<IEnumerable<Measurement>> GetMeasurementsAsync(int userId);

        Task<IEnumerable<DietProgram>> GetDietProgramAsync(int userId);
        Task AddMealAsync(int userId, DietDto dto);
        Task UpdateMealAsync(int mealId, DietDto dto);
        Task DeleteMealAsync(int mealId);

        Task SaveDietProgramAsync(int userId, SaveDietProgramDto dto);

        Task<IEnumerable<ExerciseDto>> GetAllExercisesAsync();
        Task AddExerciseAsync(ExerciseDto dto);
        Task UpdateExerciseAsync(int id, ExerciseDto dto);
        Task DeleteExerciseAsync(int id);

        Task<IEnumerable<MembershipPackage>> GetAllPackagesAsync();

        Task AddPackageAsync(MembershipPackage package);
        Task UpdatePackageAsync(int id, MembershipPackage package);
        Task DeletePackageAsync(int id);

        Task UpdateMemberAsync(int id, UpdateMemberDto dto);
        Task DeleteMemberAsync(int id);

        Task ToggleFreezeAsync(int id);
        Task<bool> DeleteMeasurementAsync(int id);
        Task UpdateMeasurementAsync(int id, MeasurementDto dto);
        Task<bool> RenewMembershipAsync(int userId, int packageId, decimal paidAmount);
        Task<bool> PayDebtAsync(int userId, decimal amount);
    }
}
