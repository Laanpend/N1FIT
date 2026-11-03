using Fitness.Core.DTOs;
using Fitness.Core.Entities;
using Fitness.Core.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace Fitness.Service.Service
{
    public class MemberService : IMemberService
    {
        private readonly IGenericRepository<User> _userRepository;
        private readonly IGenericRepository<MembershipPackage> _packageRepository;
        private readonly IGenericRepository<DietProgram> _dietRepository;
        private readonly IGenericRepository<Measurement> _measurementRepository;
        private readonly IGenericRepository<WorkoutDayExercise> _workoutDayExerciseRepository;
        private readonly IGenericRepository<DailyTrackingLog> _dailyTrackingRepository;
        private readonly IUnitOfWork _unitOfWork;

        public MemberService(
            IGenericRepository<User> userRepository,
            IGenericRepository<MembershipPackage> packageRepository,
            IGenericRepository<DietProgram> dietRepository,
            IGenericRepository<Measurement> measurementRepository,
            IGenericRepository<WorkoutDayExercise> workoutDayExerciseRepository,
            IGenericRepository<DailyTrackingLog> dailyTrackingRepository,
            IUnitOfWork unitOfWork)
        {
            _userRepository = userRepository;
            _packageRepository = packageRepository;
            _dietRepository = dietRepository;
            _measurementRepository = measurementRepository;
            _workoutDayExerciseRepository = workoutDayExerciseRepository;
            _dailyTrackingRepository = dailyTrackingRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<MemberProfileDto> GetMyProfileAsync(int userId)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
                throw new KeyNotFoundException("Üye profili bulunamadı.");

            string packageName = "Paket Yok";
            decimal packagePrice = 0;
            int? effectivePackageId = user.PackageId ?? user.CurrentPackageId;

            if (effectivePackageId.HasValue && effectivePackageId.Value > 0)
            {
                var package = await _packageRepository.GetByIdAsync(effectivePackageId.Value);
                if (package != null)
                {
                    packageName = package.Name;
                    packagePrice = package.Price;
                }
            }

            decimal remainingDebt = Math.Max(0, user.TotalDebt - user.PaidAmount);

            var today = DateTime.Now.Date;
            bool isStarted = !user.MembershipStartDate.HasValue || user.MembershipStartDate.Value.Date <= today;
            bool isNotExpired = !user.SubscriptionEndDate.HasValue || user.SubscriptionEndDate.Value.Date >= today;
            bool isActive = !user.IsFrozen && isStarted && isNotExpired;

            int daysUntilStart = 0;
            if (!isStarted && user.MembershipStartDate.HasValue)
            {
                var diff = user.MembershipStartDate.Value.Date - today;
                daysUntilStart = (int)Math.Ceiling(diff.TotalDays);
            }

            int daysLeft = 0;
            if (user.SubscriptionEndDate.HasValue)
            {
                var referenceDate = (user.IsFrozen && user.FreezeDate.HasValue) ? user.FreezeDate.Value : DateTime.Now;
                var diff = user.SubscriptionEndDate.Value - referenceDate;
                daysLeft = diff.TotalDays > 0 ? (int)Math.Ceiling(diff.TotalDays) : 0;
            }

            var diets = await _dietRepository
                .Where(x => x.UserId == userId)
                .Include(x => x.Foods)
                .OrderBy(x => x.Time)
                .AsNoTracking()
                .ToListAsync();

            var measurements = await _measurementRepository
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.RecordDate)
                .AsNoTracking()
                .ToListAsync();

            var workouts = await _workoutDayExerciseRepository
                .Where(x => x.WorkoutDay.WorkoutProgram.UserId == userId
                         && x.WorkoutDay.WorkoutProgram.IsActive)
                .Select(x => new ExerciseDto
                {
                    Id = x.ExerciseId,
                    Name = x.Exercise.Name,
                    MuscleGroup = x.Exercise.MuscleGroup,
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
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                PackageId = effectivePackageId,
                PackageName = packageName,
                PackagePrice = packagePrice,
                MembershipStartDate = user.MembershipStartDate,
                SubscriptionEndDate = user.SubscriptionEndDate,
                IsActive = isActive,
                IsStarted = isStarted,
                DaysUntilStart = daysUntilStart,
                IsFrozen = user.IsFrozen,
                FreezeDate = user.FreezeDate,
                DaysLeft = daysLeft,
                GrossTotalDebt = user.TotalDebt,
                PaidAmount = user.PaidAmount,
                RemainingDebt = remainingDebt,
                TotalDebt = remainingDebt,
                Age = user.Age,
                Height = user.Height,
                Gender = user.Gender,
                TargetCalories = user.TargetCalories,
                Diets = diets.Select(d => new DietDto
                {
                    Id = d.Id,
                    MealName = d.MealName,
                    Time = d.Time,
                    Content = d.Content,
                    Calories = d.Calories,
                    Foods = (d.Foods ?? new List<DietMealFood>()).Select(f => new DietMealFoodDto
                    {
                        Id = f.Id,
                        FoodId = f.FoodId,
                        FoodName = f.FoodName,
                        Brand = f.Brand,
                        Amount = f.Amount,
                        Unit = f.Unit,
                        CalculatedCalories = f.CalculatedCalories,
                        CalculatedProtein = f.CalculatedProtein,
                        CalculatedCarbs = f.CalculatedCarbs,
                        CalculatedFat = f.CalculatedFat
                    }).ToList()
                }).ToList(),
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
                    Hips = m.Hips,
                    RightLeg = m.RightLeg,
                    LeftLeg = m.LeftLeg,
                    RecordDate = m.RecordDate
                }).ToList()
            };
        }

        public async Task<object> GetMyWorkoutAsync(int userId)
        {
            var exercises = await _workoutDayExerciseRepository
                .Where(x => x.WorkoutDay.WorkoutProgram.UserId == userId && x.WorkoutDay.WorkoutProgram.IsActive)
                .OrderBy(x => x.Id)
                .Select(x => new
                {
                    DayId = x.WorkoutDay.Id,
                    DayTitle = x.WorkoutDay.Title,
                    ExerciseId = x.ExerciseId,
                    Name = x.Exercise.Name,
                    VideoUrl = x.Exercise.VideoUrl,
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

            var days = exercises
                .GroupBy(x => new { x.DayId, x.DayTitle })
                .Select(g => new
                {
                    title = g.Key.DayTitle,
                    exercises = g.Select(ex => new
                    {
                        exerciseId = ex.ExerciseId,
                        name = ex.Name,
                        videoUrl = ex.VideoUrl,
                        muscleGroup = ex.MuscleGroup,
                        sets = ex.Sets,
                        reps = ex.Reps,
                        restTime = ex.RestTime,
                        duration = ex.Duration,
                        speed = ex.Speed,
                        incline = ex.Incline
                    }).ToList()
                }).ToList();

            return new { days };
        }

        public async Task<object> GetMyDietAsync(int userId)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            var diets = await _dietRepository
                .Where(x => x.UserId == userId)
                .Include(x => x.Foods)
                .OrderBy(x => x.Time)
                .AsNoTracking()
                .ToListAsync();

            var meals = diets.Select(d => new
            {
                id = d.Id,
                mealName = d.MealName,
                time = d.Time,
                content = d.Content,
                calories = d.Calories ?? 0,
                foods = (d.Foods ?? new List<DietMealFood>()).Select(f => new
                {
                    id = f.Id,
                    foodId = f.FoodId,
                    foodName = f.FoodName,
                    brand = f.Brand,
                    amount = f.Amount,
                    unit = f.Unit,
                    calculatedCalories = f.CalculatedCalories,
                    calculatedProtein = f.CalculatedProtein,
                    calculatedCarbs = f.CalculatedCarbs,
                    calculatedFat = f.CalculatedFat
                }).ToList()
            }).ToList();

            return new
            {
                targetCalories = user?.TargetCalories,
                meals
            };
        }

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
                    rightArm = m.RightArm,
                    leftArm = m.LeftArm,
                    neck = m.Neck,
                    hips = m.Hips,
                    rightLeg = m.RightLeg,
                    leftLeg = m.LeftLeg
                })
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task SavePushSubscriptionAsync(int userId, string endpoint, string p256dh, string auth)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user != null)
            {
                user.PushEndpoint = endpoint;
                user.PushP256DH = p256dh;
                user.PushAuth = auth;

                _userRepository.Update(user);
                await _unitOfWork.CommitAsync();
            }
        }

        public async Task<BodyProfileDto> GetBodyProfileAsync(int userId)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
                throw new KeyNotFoundException("Üye bulunamadı.");

            var latestMeasurement = await _measurementRepository
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.RecordDate)
                .AsNoTracking()
                .FirstOrDefaultAsync();

            return new BodyProfileDto
            {
                Age = user.Age,
                Height = user.Height,
                Gender = user.Gender ?? "male",
                LatestWeight = latestMeasurement?.Weight,
                LatestNeck = latestMeasurement?.Neck,
                LatestWaist = latestMeasurement?.Waist,
                LatestHips = latestMeasurement?.Hips,
                LatestMeasurementDate = latestMeasurement?.RecordDate
            };
        }

        public async Task<BodyCompositionResultDto> CalculateBodyCompositionAsync(int userId, BodyCompositionRequestDto dto)
        {
            if (dto.Age < 10 || dto.Age > 100)
                throw new ArgumentException("Lütfen geçerli bir yaş giriniz (10-100).");
            if (dto.Height < 100 || dto.Height > 250)
                throw new ArgumentException("Lütfen geçerli bir boy (cm) giriniz (100-250).");
            if (dto.Weight < 25 || dto.Weight > 300)
                throw new ArgumentException("Lütfen geçerli bir kilo (kg) giriniz.");
            if (dto.Neck <= 15 || dto.Waist <= 30)
                throw new ArgumentException("Lütfen geçerli boyun ve bel ölçüleri (cm) giriniz.");

            var user = await _userRepository.GetByIdAsync(userId);
            if (user != null)
            {
                user.Age = dto.Age;
                user.Height = dto.Height;
                user.Gender = dto.Gender?.ToLowerInvariant() == "female" ? "female" : "male";
                _userRepository.Update(user);
                await _unitOfWork.CommitAsync();
            }

            bool isFemale = dto.Gender?.ToLowerInvariant() == "female";
            double bodyFatPct;

            if (!isFemale)
            {
                if (dto.Waist - dto.Neck <= 0)
                    throw new ArgumentException("Erkek ölçümünde bel çevresi boyun çevresinden büyük olmalıdır.");

                bodyFatPct = 495.0 / (1.0324 - 0.19077 * Math.Log10(dto.Waist - dto.Neck) + 0.15456 * Math.Log10(dto.Height)) - 450.0;
            }
            else
            {
                double hips = dto.Hips ?? 0;
                if (hips <= 40)
                    throw new ArgumentException("Kadın yağ oranı hesaplaması (U.S. Navy) için kalça ölçüsü zorunludur.");
                if (dto.Waist + hips - dto.Neck <= 0)
                    throw new ArgumentException("Bel ve kalça toplamı boyun ölçüsünden büyük olmalıdır.");

                bodyFatPct = 495.0 / (1.29579 - 0.35004 * Math.Log10(dto.Waist + hips - dto.Neck) + 0.22100 * Math.Log10(dto.Height)) - 450.0;
            }

            bodyFatPct = Math.Clamp(bodyFatPct, 3.0, 60.0);

            double fatMassKg = dto.Weight * (bodyFatPct / 100.0);
            double leanBodyMassKg = dto.Weight - fatMassKg;
            double heightM = dto.Height / 100.0;
            double bmi = dto.Weight / (heightM * heightM);
            double ffmi = leanBodyMassKg / (heightM * heightM);
            double normalizedFfmi = ffmi + 6.1 * (1.80 - heightM);
            double waistToHeightRatio = dto.Waist / dto.Height;

            double idealWeightMinKg = 18.5 * (heightM * heightM);
            double idealWeightMaxKg = 24.9 * (heightM * heightM);

            // Yaş ve Cinsiyete Göre Referans Yağ Oranı Aralıkları (Gallagher et al. / ACSM)
            double idealBfMin, idealBfMax;
            if (!isFemale)
            {
                if (dto.Age < 40) { idealBfMin = 8.0; idealBfMax = 19.0; }
                else if (dto.Age < 60) { idealBfMin = 11.0; idealBfMax = 21.0; }
                else { idealBfMin = 13.0; idealBfMax = 24.0; }
            }
            else
            {
                if (dto.Age < 40) { idealBfMin = 21.0; idealBfMax = 32.0; }
                else if (dto.Age < 60) { idealBfMin = 23.0; idealBfMax = 33.0; }
                else { idealBfMin = 24.0; idealBfMax = 35.0; }
            }

            // Yağ Oranı Kategorisi
            string bfCategory;
            string bfColor;
            if (!isFemale)
            {
                if (bodyFatPct < 6.0) { bfCategory = "Zayıf (Esansiyel Yağ Sınırında)"; bfColor = "#38bdf8"; }
                else if (bodyFatPct < 14.0) { bfCategory = "Atletik / Çok Fit"; bfColor = "#4ade80"; }
                else if (bodyFatPct < 18.0) { bfCategory = "Fit / İdeal"; bfColor = "#4ade80"; }
                else if (bodyFatPct < 25.0) { bfCategory = "Normal / Hafif Kilolu"; bfColor = "#f59e0b"; }
                else { bfCategory = "Fazla Kilolu / Yüksek Yağlı"; bfColor = "#d90429"; }
            }
            else
            {
                if (bodyFatPct < 14.0) { bfCategory = "Zayıf (Esansiyel Yağ Sınırında)"; bfColor = "#38bdf8"; }
                else if (bodyFatPct < 21.0) { bfCategory = "Atletik / Çok Fit"; bfColor = "#4ade80"; }
                else if (bodyFatPct < 25.0) { bfCategory = "Fit / İdeal"; bfColor = "#4ade80"; }
                else if (bodyFatPct < 32.0) { bfCategory = "Normal / Hafif Kilolu"; bfColor = "#f59e0b"; }
                else { bfCategory = "Fazla Kilolu / Yüksek Yağlı"; bfColor = "#d90429"; }
            }

            // BMI Kategorisi
            string bmiCategory;
            if (bmi < 18.5) bmiCategory = "Zayıf";
            else if (bmi < 25.0) bmiCategory = "Normal Kilolu";
            else if (bmi < 30.0) bmiCategory = "Hafif Kilolu";
            else bmiCategory = "Obezite Sınırında";

            // FFMI & Potansiyel Doping Analizi (Kouri et al., 1995)
            string ffmiCategory;
            string ffmiColor;
            bool isPotentialDoping = false;

            if (!isFemale)
            {
                if (normalizedFfmi > 25.0)
                {
                    isPotentialDoping = true;
                    ffmiCategory = "Potansiyel Dopingli (Doğal Genetik Sınır Üstü)";
                    ffmiColor = "#a855f7";
                }
                else if (normalizedFfmi >= 22.0)
                {
                    ffmiCategory = "Mükemmel / Doğal Genetik Zirve";
                    ffmiColor = "#4ade80";
                }
                else if (normalizedFfmi >= 20.0)
                {
                    ffmiCategory = "Fit / Gelişmiş Kas Kütlesi";
                    ffmiColor = "#4ade80";
                }
                else if (normalizedFfmi >= 18.0)
                {
                    ffmiCategory = "Normal / Ortalama Kas Kütlesi";
                    ffmiColor = "#f59e0b";
                }
                else
                {
                    ffmiCategory = "Zayıf / Düşük Kas Kütlesi";
                    ffmiColor = "#38bdf8";
                }
            }
            else
            {
                if (normalizedFfmi > 21.5)
                {
                    isPotentialDoping = true;
                    ffmiCategory = "Potansiyel Dopingli (Doğal Genetik Sınır Üstü)";
                    ffmiColor = "#a855f7";
                }
                else if (normalizedFfmi >= 18.5)
                {
                    ffmiCategory = "Mükemmel / Doğal Genetik Zirve";
                    ffmiColor = "#4ade80";
                }
                else if (normalizedFfmi >= 16.5)
                {
                    ffmiCategory = "Fit / Gelişmiş Kas Kütlesi";
                    ffmiColor = "#4ade80";
                }
                else if (normalizedFfmi >= 14.5)
                {
                    ffmiCategory = "Normal / Ortalama Kas Kütlesi";
                    ffmiColor = "#f59e0b";
                }
                else
                {
                    ffmiCategory = "Zayıf / Düşük Kas Kütlesi";
                    ffmiColor = "#38bdf8";
                }
            }

            string summaryStatus = isPotentialDoping ? "Potansiyel Dopingli" : bfCategory;

            return new BodyCompositionResultDto
            {
                BodyFatPercentage = Math.Round(bodyFatPct, 1),
                FatMassKg = Math.Round(fatMassKg, 1),
                LeanBodyMassKg = Math.Round(leanBodyMassKg, 1),
                Bmi = Math.Round(bmi, 1),
                Ffmi = Math.Round(ffmi, 1),
                NormalizedFfmi = Math.Round(normalizedFfmi, 1),
                WaistToHeightRatio = Math.Round(waistToHeightRatio, 2),
                IdealWeightMinKg = Math.Round(idealWeightMinKg, 1),
                IdealWeightMaxKg = Math.Round(idealWeightMaxKg, 1),
                IdealBodyFatMinPct = idealBfMin,
                IdealBodyFatMaxPct = idealBfMax,
                BodyFatCategory = bfCategory,
                BodyFatColor = bfColor,
                BmiCategory = bmiCategory,
                FfmiCategory = ffmiCategory,
                FfmiColor = ffmiColor,
                IsPotentialDoping = isPotentialDoping,
                SummaryStatus = summaryStatus
            };
        }

        public async Task SyncDailyTrackingAsync(int userId, SyncDailyTrackingDto dto)
        {
            if (!DateTime.TryParse(dto.Date, out var dateParsed))
            {
                dateParsed = DateTime.Now.Date;
            }
            else
            {
                dateParsed = dateParsed.Date;
            }

            var existing = await _dailyTrackingRepository
                .Where(x => x.UserId == userId && x.TrackingDate == dateParsed)
                .FirstOrDefaultAsync();

            string mealsJson = JsonSerializer.Serialize(dto.CompletedMeals ?? new List<string>());

            if (existing != null)
            {
                existing.WaterGlasses = Math.Max(0, dto.WaterGlasses);
                existing.ConsumedCalories = Math.Max(0, dto.ConsumedCalories);
                existing.CompletedMealsJson = mealsJson;
                existing.LastUpdated = DateTime.Now;
                _dailyTrackingRepository.Update(existing);
            }
            else
            {
                var newLog = new DailyTrackingLog
                {
                    UserId = userId,
                    TrackingDate = dateParsed,
                    WaterGlasses = Math.Max(0, dto.WaterGlasses),
                    ConsumedCalories = Math.Max(0, dto.ConsumedCalories),
                    CompletedMealsJson = mealsJson,
                    LastUpdated = DateTime.Now
                };
                await _dailyTrackingRepository.AddAsync(newLog);
            }

            await _unitOfWork.CommitAsync();
        }

        public async Task<DailyTrackingResponseDto?> GetDailyTrackingAsync(int userId, string date)
        {
            if (!DateTime.TryParse(date, out var dateParsed))
            {
                dateParsed = DateTime.Now.Date;
            }
            else
            {
                dateParsed = dateParsed.Date;
            }

            var log = await _dailyTrackingRepository
                .Where(x => x.UserId == userId && x.TrackingDate == dateParsed)
                .AsNoTracking()
                .FirstOrDefaultAsync();

            if (log == null)
                return null;

            List<string> completedMeals = new();
            if (!string.IsNullOrWhiteSpace(log.CompletedMealsJson))
            {
                try
                {
                    completedMeals = JsonSerializer.Deserialize<List<string>>(log.CompletedMealsJson) ?? new();
                }
                catch { }
            }

            return new DailyTrackingResponseDto
            {
                Date = log.TrackingDate.ToString("yyyy-MM-dd"),
                WaterGlasses = log.WaterGlasses,
                ConsumedCalories = log.ConsumedCalories,
                CompletedMeals = completedMeals
            };
        }
    }
}
