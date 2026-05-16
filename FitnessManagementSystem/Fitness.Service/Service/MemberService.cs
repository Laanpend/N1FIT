using AutoMapper;
using Fitness.Core.DTOs;
using Fitness.Core.Entities;
using Fitness.Core.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Fitness.Core.DTOs.Fitness.Core.DTOs;

namespace Fitness.Service.Service
{
    public class MemberService : IMemberService
    {
        private readonly IGenericRepository<User> _userRepository;
        private readonly IGenericRepository<MembershipPackage> _packageRepository;
        private readonly IGenericRepository<DietProgram> _dietRepository;
        private readonly IGenericRepository<Measurement> _measurementRepository;
        private readonly IGenericRepository<WorkoutDayExercise> _workoutDayExerciseRepository;
        // Eğer antrenman repounun adı farklıysa (örn: WorkoutProgram) onu ekle:
        // private readonly IGenericRepository<Exercise> _exerciseRepository; 

        public MemberService(
            IGenericRepository<User> userRepository,
            IGenericRepository<MembershipPackage> packageRepository,
            IGenericRepository<DietProgram> dietRepository,
            IGenericRepository<Measurement> measurementRepository,
            IGenericRepository<WorkoutDayExercise> workoutDayExerciseRepository)
        {
            _userRepository = userRepository;
            _packageRepository = packageRepository;
            _dietRepository = dietRepository;
            _measurementRepository = measurementRepository;
            _workoutDayExerciseRepository = workoutDayExerciseRepository;
        }

        public async Task<MemberProfileDto> GetMyProfileAsync(int userId)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null) throw new Exception("Kimsin lan sen?");

            string packageName = "Paket Yok";
            if (user.PackageId.HasValue)
            {
                var package = await _packageRepository.GetByIdAsync(user.PackageId.Value);
                if (package != null) packageName = package.Name;
            }
            decimal packagePrice = 0;
            if (user.PackageId.HasValue)
            {
                // Burada "package" sadece bu süslü parantezlerin içinde yaşar
                var package = await _packageRepository.GetByIdAsync(user.PackageId.Value);
                if (package != null)
                {
                    packageName = package.Name;
                    packagePrice = package.Price; // Fiyatı bulduk, güvenli cebe (dışarı) aktardık!
                }
            }

            decimal kalanBorc = Math.Max(0, user.TotalDebt - user.PaidAmount);  

            int daysLeft = 0;
            if (user.SubscriptionEndDate.HasValue)
            {
                var referansTarih = (user.IsFrozen && user.FreezeDate.HasValue) ? user.FreezeDate.Value : DateTime.Now;
                var diff = user.SubscriptionEndDate.Value - referansTarih;
                daysLeft = diff.TotalDays > 0 ? (int)Math.Ceiling(diff.TotalDays) : 0;
            }

            var diets = await _dietRepository
                .Where(x => x.UserId == userId)
                .OrderBy(x => x.Time)
                .AsNoTracking()
                .ToListAsync();

            var measurements = await _measurementRepository
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.RecordDate) // En yeni ölçü en üstte gelsin
                .AsNoTracking()
                .ToListAsync();

            // İŞTE ZURNANIN ZIRT DEDİĞİ YER: ANTRENMANLARI SQL'DEN ÇEKİYORUZ!
            // Select kullandığımız için Include yazmamıza gerek yok, EF Core kendisi lüpletiyor amq.
            var workouts = await _workoutDayExerciseRepository
    // SADECE AKTİF OLAN PROGRAMLARI ÇEKİYORUZ! Pasifler SQL'de kalır, ekrana çıkamaz.
            .Where(x => x.WorkoutDay.WorkoutProgram.UserId == userId
                     && x.WorkoutDay.WorkoutProgram.IsActive == true)
            .Select(x => new ExerciseDto
            {
                Id = x.ExerciseId,
                Name = x.Exercise.Name,
                Sets = x.Sets,
                Reps = x.Reps,
                VideoUrl = x.Exercise.VideoUrl,
                DayTitle = x.WorkoutDay.Title,
                Duration = x.Duration,
                Speed = x.Speed,
                Incline = x.Incline,
                RestTime = x.RestTime
            })
            .AsNoTracking()
            .ToListAsync();

            return new MemberProfileDto
            {
                FirstName = user.FirstName,
                LastName = user.LastName,
                PackageName = packageName,
                MembershipStartDate = user.MembershipStartDate,
                SubscriptionEndDate = user.SubscriptionEndDate,
                IsFrozen = user.IsFrozen,
                DaysLeft = daysLeft,
                Diets = diets.Select(d => new DietDto { Id = d.Id, MealName = d.MealName, Time = d.Time, Content = d.Content }).ToList(),
                PackagePrice = packagePrice,
                TotalDebt = kalanBorc > 0 ? kalanBorc : 0,
                // Doldurduğumuz kaslı idmanı buraya çaktık
                Workouts = workouts,

                Measurements = measurements.Select(m => new MeasurementDto
                {
                    Id = m.Id,
                    Weight = m.Weight,
                    Shoulder = m.Shoulder,
                    Chest = m.Chest,
                    LeftArm = m.LeftArm,
                    RightArm = m.RightArm,
                    Waist = m.Waist,
                    Neck = m.Neck,
                    RecordDate = m.RecordDate
                }).ToList()
            };
        }
        // --- ANTRENMAN MOTORU ---
        public async Task<object> GetMyWorkoutAsync(int userId)
        {
            // Veriyi çekerken hareketin adını ve videosunu da paketliyoruz (JOIN amq)!
            var exercises = await _workoutDayExerciseRepository
                .Where(x => x.WorkoutDay.WorkoutProgram.UserId == userId && x.WorkoutDay.WorkoutProgram.IsActive == true)
                .Select(x => new
                {
                    DayId = x.WorkoutDay.Id,
                    DayTitle = x.WorkoutDay.Title,
                    ExerciseId = x.ExerciseId,
                    Name = x.Exercise.Name,          // AHA! İsim geldi
                    VideoUrl = x.Exercise.VideoUrl,  // AHA! Video geldi
                    MuscleGroup = x.Exercise.MuscleGroup,
                    Sets = x.Sets,
                    Reps = x.Reps,
                    RestTime = x.RestTime,
                    Duration = x.Duration,
                    Speed = x.Speed,
                    Incline = x.Incline
                })
                .AsNoTracking()
                .ToListAsync();

            // JSON formatına eziyoruz
            var days = exercises
                .GroupBy(x => new { x.DayId, x.DayTitle })
                .Select(g => new
                {
                    title = g.Key.DayTitle,
                    exercises = g.Select(ex => new
                    {
                        exerciseId = ex.ExerciseId,
                        name = ex.Name,             // React artık bunu direkt okuyacak
                        videoUrl = ex.VideoUrl,     // Videoyu da buradan çekecek
                        muscleGroup = ex.MuscleGroup,
                        sets = ex.Sets,
                        reps = ex.Reps,
                        restTime = ex.RestTime,
                        duration = ex.Duration,
                        speed = ex.Speed,
                        incline = ex.Incline
                    }).ToList()
                }).ToList();

            return new { days = days };
        }

        // --- BESLENME MOTORU ---
        public async Task<object> GetMyDietAsync(int userId)
        {
            var diets = await _dietRepository
                .Where(x => x.UserId == userId)
                .OrderBy(x => x.Time)
                .AsNoTracking()
                .ToListAsync();

            // React'a yollarken küçük harfle yolluyoruz ki JSON'da patlamasın
            var meals = diets.Select(d => new
            {
                mealName = d.MealName,
                time = d.Time,
                content = d.Content // Senin veritabanında liste değil, dümdüz yazı var amq!
            }).ToList();

            return new { meals = meals };
        }

        // --- ÖLÇÜ MOTORU ---
        public async Task<IEnumerable<object>> GetMyMeasurementsAsync(int userId)
        {
            return await _measurementRepository
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.RecordDate)
                .Select(m => new
                {
                    date = m.RecordDate,
                    weight = m.Weight,
                    shoulder = m.Shoulder,
                    chest = m.Chest,
                    waist = m.Waist,
                    rightArm = m.RightArm, // Kol olarak sağ kolu basıyoruz
                    leftArm = m.LeftArm,
                    neck = m.Neck
                })
                .AsNoTracking()
                .ToListAsync();
        }
    }
}
