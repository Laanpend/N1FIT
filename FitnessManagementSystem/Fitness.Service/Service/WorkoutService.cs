using Fitness.Core.DTOs;
using Fitness.Core.DTOs.Fitness.Core.DTOs;
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
    public class WorkoutService : Service<WorkoutProgram>, IWorkoutService
    {
        private readonly IGenericRepository<WorkoutProgram> _workoutProgramRepository;

        // Constructor'da da WorkoutProgram istiyoruz
        public WorkoutService(IGenericRepository<WorkoutProgram> repository, IUnitOfWork unitOfWork) : base(repository, unitOfWork)
        {
            _workoutProgramRepository = repository;
        }

        public async Task<WorkoutProgram> GetMemberProgramAsync(int userId)
        {
            return await _workoutProgramRepository
                .Where(x => x.UserId == userId && x.IsActive == true)
                .Include(x => x.Days)               // Günleri SQL'den çek
                    .ThenInclude(d => d.Exercises)  // O günlerin içindeki hareketleri de çek
                    .ThenInclude(e => e.Exercise)
                .FirstOrDefaultAsync();
        }


        public async Task SaveWorkoutProgramAsync(int userId, SaveWorkoutProgramDto dto)
        {
            // 1. Eski programı bul ve pasife çek
            var oldProgram = await _workoutProgramRepository
                .Where(x => x.UserId == userId && x.IsActive)
                .ToListAsync();

            foreach (var p in oldProgram)
            {
                p.IsActive = false;
            }

            // 2. Yeni programı fırından çıkarıyoruz (Patlayan yer burasıydı, düzelttik)
            var newProgram = new WorkoutProgram
            {
                UserId = userId,
                Name = "Aktif Antrenman Programı",
                IsActive = true,
                Days = dto.Days.Select(d => new WorkoutDay
                {
                    // Eğer Title boş gelirse "İsimsiz Gün" yazsın
                    Title = d.Title ?? "İsimsiz Gün",
                    DayName = d.Title ?? "İsimsiz Gün",

                    Exercises = d.Exercises.Select(e => new WorkoutDayExercise
                    {
                        ExerciseId = e.ExerciseId,
                        Sets = e.Sets,
                        // Eğer boş gelirse patlamasın diye ?? "" çaktık
                        Reps = e.Reps ?? "",
                        RestTime = e.RestTime ?? "",
                        Duration = e.Duration ?? "",
                        Speed = e.Speed ?? "",
                        Incline = e.Incline ?? ""
                    }).ToList()
                }).ToList()
            };

            // 3. SQL'e göm
            await _workoutProgramRepository.AddAsync(newProgram);
            await _unitOfWork.CommitAsync();
        }
    }
}
