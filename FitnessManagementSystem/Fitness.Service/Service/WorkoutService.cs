using Fitness.Core.DTOs;
using Fitness.Core.Entities;
using Fitness.Core.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Fitness.Service.Service
{
    public class WorkoutService : Service<WorkoutProgram>, IWorkoutService
    {
        private readonly IGenericRepository<WorkoutProgram> _workoutProgramRepository;

        public WorkoutService(IGenericRepository<WorkoutProgram> repository, IUnitOfWork unitOfWork) : base(repository, unitOfWork)
        {
            _workoutProgramRepository = repository;
        }

        public async Task<WorkoutProgram?> GetMemberProgramAsync(int userId)
        {
            return await _workoutProgramRepository
                .Where(x => x.UserId == userId && x.IsActive)
                .Include(x => x.Days)
                    .ThenInclude(d => d.Exercises)
                    .ThenInclude(e => e.Exercise)
                .FirstOrDefaultAsync();
        }

        public async Task SaveWorkoutProgramAsync(int userId, SaveWorkoutProgramDto dto)
        {
            var oldPrograms = await _workoutProgramRepository
                .Where(x => x.UserId == userId && x.IsActive)
                .ToListAsync();

            foreach (var p in oldPrograms)
            {
                p.IsActive = false;
                _workoutProgramRepository.Update(p);
            }

            var days = dto?.Days ?? new List<WorkoutDayDto>();

            var newProgram = new WorkoutProgram
            {
                UserId = userId,
                Name = "Aktif Antrenman Programı",
                IsActive = true,
                Days = days.Select(d => new WorkoutDay
                {
                    Title = string.IsNullOrWhiteSpace(d.Title) ? "İsimsiz Gün" : d.Title,
                    DayName = string.IsNullOrWhiteSpace(d.Title) ? "İsimsiz Gün" : d.Title,
                    Exercises = (d.Exercises ?? new List<WorkoutDayExerciseDto>()).Select(e => new WorkoutDayExercise
                    {
                        ExerciseId = e.ExerciseId,
                        Sets = e.Sets,
                        Reps = e.Reps ?? string.Empty,
                        RestTime = e.RestTime ?? string.Empty,
                        Duration = e.Duration ?? string.Empty,
                        Speed = e.Speed ?? string.Empty,
                        Incline = e.Incline ?? string.Empty
                    }).ToList()
                }).ToList()
            };

            await _workoutProgramRepository.AddAsync(newProgram);
            await _unitOfWork.CommitAsync();
        }
    }
}
