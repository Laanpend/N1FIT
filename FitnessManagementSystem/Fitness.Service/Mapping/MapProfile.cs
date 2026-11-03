using AutoMapper;
using Fitness.Core.DTOs;
using Fitness.Core.Entities;

namespace Fitness.Service.Mapping
{
    public class MapProfile : Profile
    {
        public MapProfile()
        {
            CreateMap<User, UserDto>().ReverseMap();
            CreateMap<UserCreateDto, User>();

            CreateMap<User, MemberListDto>()
                .ForMember(dest => dest.FullName, opt =>
                    opt.MapFrom(src => $"{src.FirstName} {src.LastName}".Trim()));

            CreateMap<Food, FoodDto>().ReverseMap();
            CreateMap<DietMealFood, DietMealFoodDto>().ReverseMap();
            CreateMap<DietProgram, DietDto>().ReverseMap();
            CreateMap<Measurement, MeasurementDto>().ReverseMap();
        }
    }
}
