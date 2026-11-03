using Fitness.Core.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Fitness.Core.Interfaces
{
    public interface IFoodService
    {
        Task SeedDefaultFoodsAsync();
        Task<List<FoodDto>> SearchFoodsAsync(string? query, string? category = null, bool includeExternalApi = false);
        Task<FoodDto> CreateOrCacheFoodAsync(FoodDto dto);
    }
}
