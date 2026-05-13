using Fitness.Core.DTOs.Fitness.Core.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fitness.Core.DTOs
{
    public class MemberProfileDto
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string PackageName { get; set; }
        public DateTime? MembershipStartDate { get; set; }
        public DateTime? SubscriptionEndDate { get; set; }
        public bool IsFrozen { get; set; }
        public int DaysLeft { get; set; }

        // Diyetleri listelemek için
        public List<DietDto> Diets { get; set; }

        // Antrenmanları listelemek için (Buranın DTO ismini sen kendi projene göre uyarla)
        public List<ExerciseDto> Workouts { get; set; }
        public List<MeasurementDto> Measurements { get; set; }

        public decimal PackagePrice { get; set; }
        public decimal TotalDebt { get; set; }
    }
}
