using Fitness.Core.Entities;
using Fitness.Core.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fitness.Service.Service
{
    public class ExerciseService : Service<Exercise>, IExerciseService
    {
        private readonly IGenericRepository<Exercise> _exerciseRepository;

        public ExerciseService(IGenericRepository<Exercise> repository, IUnitOfWork unitOfWork) : base(repository, unitOfWork)
        {
            _exerciseRepository = repository;
        }

        public async Task<IEnumerable<Exercise>> GetByMuscleGroupAsync(string muscleGroup)
        {
            return await _exerciseRepository.Where(x => x.MuscleGroup == muscleGroup).ToListAsync();
        }
    }
}
