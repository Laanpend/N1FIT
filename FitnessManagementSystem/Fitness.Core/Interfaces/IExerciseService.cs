using Fitness.Core.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fitness.Core.Interfaces
{
    public interface IExerciseService : IService<Exercise>
    {
        Task<IEnumerable<Exercise>> GetByMuscleGroupAsync(string muscleGroup);
    }
}
