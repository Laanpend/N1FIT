using Fitness.Core.DTOs;
using Fitness.Core.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Fitness.Core.Interfaces
{
    public interface IAdminService
    {
        Task AddMemberAsync(AdminAddMemberDto dto);
        Task<IEnumerable<MemberListDto>> GetAllMembersAsync();
        Task ToggleMemberStatusAsync(int id);
        Task<MemberProfileDto?> GetMemberByIdAsync(int id);

        Task AddMeasurementAsync(int userId, MeasurementDto dto);
        Task<IEnumerable<Measurement>> GetMeasurementsAsync(int userId);
        Task<bool> DeleteMeasurementAsync(int id);
        Task UpdateMeasurementAsync(int id, MeasurementDto dto);

        Task<IEnumerable<DietProgram>> GetDietProgramAsync(int userId);
        Task AddMealAsync(int userId, DietDto dto);
        Task UpdateMealAsync(int mealId, DietDto dto);
        Task DeleteMealAsync(int mealId);
        Task SaveDietProgramAsync(int userId, SaveDietProgramDto dto);
        Task SetTargetCaloriesAsync(int userId, SetTargetCaloriesDto dto);

        Task<IEnumerable<ExerciseDto>> GetAllExercisesAsync();
        Task AddExerciseAsync(ExerciseDto dto);
        Task UpdateExerciseAsync(int id, ExerciseDto dto);
        Task DeleteExerciseAsync(int id);

        Task<IEnumerable<MembershipPackage>> GetAllPackagesAsync();
        Task AddPackageAsync(MembershipPackage package);
        Task UpdatePackageAsync(int id, MembershipPackage package);
        Task DeletePackageAsync(int id);
        Task<bool> TogglePackageWebsiteAsync(int id);

        Task UpdateMemberAsync(int id, UpdateMemberDto dto);
        Task DeleteMemberAsync(int id);
        Task ToggleFreezeAsync(int id);
        Task<bool> RenewMembershipAsync(int userId, int packageId, decimal paidAmount, DateTime? startDate = null, DateTime? endDate = null);
        Task<bool> PayDebtAsync(int userId, decimal amount);

        Task<FacilityConfigDto> GetFacilityConfigAsync();
        Task<FacilityConfigDto> SaveFacilityConfigAsync(FacilityConfigDto config);
        Task<FacilityConfigDto> ResetFacilityConfigAsync();
        Task<SiteStudioConfigDto> GetSiteStudioConfigAsync();
        Task<SiteStudioConfigDto> SaveSiteStudioConfigAsync(SiteStudioConfigDto config);
        Task<SiteStudioConfigDto> ResetSiteStudioConfigAsync();
        Task<PublicSiteStudioDto> GetPublicSiteStudioConfigAsync();
        Task<SiteLeadDto> AddSiteLeadAsync(CreateSiteLeadDto dto);
        Task<List<SiteLeadDto>> GetSiteLeadsAsync();
        Task<SiteLeadDto?> UpdateSiteLeadStatusAsync(long id, UpdateSiteLeadStatusDto dto);
        Task<bool> DeleteSiteLeadAsync(long id);
        Task<int> SyncStandardMuscleGroupsAsync();
    }
}
