using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using Fitness.Core.Entities;
using Fitness.Core.DTOs;
using Fitness.Core.DTOs.Fitness.Core.DTOs;

namespace Fitness.Service.Mapping
{
   
    public class MapProfile : Profile
    {
        public MapProfile()
        {
            CreateMap<User, UserDto>().ReverseMap();
            CreateMap<UserCreateDto, User>();
            // Diğer eşlemeleri (Measurement, Exercise vb.) buraya ekleyeceğiz.

            // Bu satırı eklemezsen sistem User'ı MemberListDto'ya çeviremez
            // MapProfile.cs içindeki constructor'ın içine çak bunu
            CreateMap<User, MemberListDto>()
                .ForMember(dest => dest.FullName, opt =>
                    opt.MapFrom(src => $"{src.FirstName} {src.LastName}"));

            // Eğer Login/Register için de mapping kullanıyorsan onları da kontrol et
            CreateMap<UserCreateDto, User>();

            CreateMap<DietProgram, DietDto>().ReverseMap();
            CreateMap<Measurement, MeasurementDto>().ReverseMap();
        }
    }
}
