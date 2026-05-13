using Fitness.Core.DTOs.Fitness.Core.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fitness.Core.DTOs
{
    public class SaveDietProgramDto
    {
        public List<DietDto> Meals { get; set; } = new List<DietDto>();
    }
}
