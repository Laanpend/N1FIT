using AutoMapper;
using Fitness.Core.DTOs;
using Fitness.Core.Entities;
using Fitness.Core.Enums;
using Fitness.Core.Interfaces;
using Fitness.Service.Helpers;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace Fitness.Service.Service
{
    public class AdminService : IAdminService
    {
        private readonly IGenericRepository<User> _userRepository;
        private readonly IGenericRepository<Measurement> _measurementRepository;
        private readonly IGenericRepository<DietProgram> _dietRepository;
        private readonly IGenericRepository<DietMealFood> _dietMealFoodRepository;
        private readonly IGenericRepository<Exercise> _exerciseRepository;
        private readonly IGenericRepository<MembershipPackage> _packageRepository;
        private readonly IGenericRepository<PendingMembershipPayment> _pendingPaymentRepository;
        private readonly IFoodService _foodService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public AdminService(
            IGenericRepository<User> userRepository,
            IGenericRepository<DietProgram> dietRepository,
            IGenericRepository<DietMealFood> dietMealFoodRepository,
            IGenericRepository<Measurement> measurementRepository,
            IGenericRepository<Exercise> exerciseRepository,
            IGenericRepository<MembershipPackage> packageRepository,
            IGenericRepository<PendingMembershipPayment> pendingPaymentRepository,
            IFoodService foodService,
            IUnitOfWork unitOfWork,
            IMapper mapper)
        {
            _userRepository = userRepository;
            _measurementRepository = measurementRepository;
            _dietRepository = dietRepository;
            _dietMealFoodRepository = dietMealFoodRepository;
            _exerciseRepository = exerciseRepository;
            _packageRepository = packageRepository;
            _pendingPaymentRepository = pendingPaymentRepository;
            _foodService = foodService;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task AddMemberAsync(AdminAddMemberDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
                throw new ArgumentException("E-posta ve şifre alanları zorunludur.");

            var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
            bool emailExists = await _userRepository.Where(x => x.Email.ToLower() == normalizedEmail).AnyAsync();
            if (emailExists)
                throw new InvalidOperationException("Bu e-posta adresi ile kayıtlı bir üye zaten mevcut.");

            string passwordHash = PasswordHasher.HashPassword(dto.Password);
            var startDate = dto.MembershipStartDate ?? DateTime.Now;
            DateTime? endDate = dto.SubscriptionEndDate;

            decimal totalDebt = 0;
            MembershipPackage? selectedPackage = null;
            if (dto.PackageId.HasValue && dto.PackageId.Value > 0)
            {
                selectedPackage = await _packageRepository.GetByIdAsync(dto.PackageId.Value);
                if (selectedPackage != null)
                {
                    totalDebt = selectedPackage.Price;
                    if (!endDate.HasValue || endDate.Value.Year <= 1970)
                    {
                        endDate = startDate.AddMonths(selectedPackage.DurationMonths);
                    }
                }
            }

            var today = DateTime.Now.Date;
            bool isStarted = startDate.Date <= today;
            bool isNotExpired = !endDate.HasValue || endDate.Value.Date >= today;
            bool isActive = isStarted && isNotExpired;

            var newMember = new User
            {
                FirstName = dto.FirstName?.Trim() ?? string.Empty,
                LastName = dto.LastName?.Trim() ?? string.Empty,
                Email = dto.Email.Trim(),
                PasswordHash = passwordHash,
                Role = UserRole.Member,
                SubscriptionEndDate = endDate,
                IsActive = isActive,
                PhoneNumber = dto.PhoneNumber?.Trim() ?? string.Empty,
                MembershipStartDate = startDate,
                PackageId = dto.PackageId,
                CurrentPackageId = dto.PackageId,
                TotalDebt = totalDebt,
                PaidAmount = Math.Max(0, dto.PaidAmount)
            };

            await _userRepository.AddAsync(newMember);
            await _unitOfWork.CommitAsync();

            if (newMember.PaidAmount > 0)
            {
                await _pendingPaymentRepository.AddAsync(new PendingMembershipPayment
                {
                    UserId = newMember.Id,
                    MemberFullName = $"{newMember.FirstName} {newMember.LastName}".Trim(),
                    PackageId = newMember.PackageId,
                    PackageName = selectedPackage?.Name ?? "Yeni Üyelik Kaydı",
                    PaymentType = "NewRegistration",
                    Amount = newMember.PaidAmount,
                    CreatedAt = DateTime.Now,
                    Status = "Pending"
                });
                await _unitOfWork.CommitAsync();
            }
        }

        public async Task<IEnumerable<MemberListDto>> GetAllMembersAsync()
        {
            var members = await _userRepository
                .Where(x => x.Role == UserRole.Member)
                .AsNoTracking()
                .ToListAsync();

            var today = DateTime.Now.Date;
            var dtoList = _mapper.Map<List<MemberListDto>>(members);

            foreach (var item in dtoList)
            {
                bool isStarted = !item.MembershipStartDate.HasValue || item.MembershipStartDate.Value.Date <= today;
                bool isNotExpired = !item.SubscriptionEndDate.HasValue || item.SubscriptionEndDate.Value.Date >= today;

                item.IsStarted = isStarted;
                if (!isStarted && item.MembershipStartDate.HasValue)
                {
                    var diff = item.MembershipStartDate.Value.Date - today;
                    item.DaysUntilStart = (int)Math.Ceiling(diff.TotalDays);
                }
                else
                {
                    item.DaysUntilStart = 0;
                }

                if (!item.IsFrozen)
                {
                    item.IsActive = isStarted && isNotExpired;
                }
            }

            return dtoList;
        }

        public async Task ToggleMemberStatusAsync(int id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user != null)
            {
                user.IsActive = !user.IsActive;
                _userRepository.Update(user);
                await _unitOfWork.CommitAsync();
            }
        }

        public async Task<MemberProfileDto?> GetMemberByIdAsync(int id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) return null;

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

            decimal remainingDebt = Math.Max(0, user.TotalDebt - user.PaidAmount);

            var diets = await _dietRepository
                .Where(x => x.UserId == id)
                .Include(x => x.Foods)
                .OrderBy(x => x.Time)
                .AsNoTracking()
                .ToListAsync();

            var measurements = await _measurementRepository
                .Where(x => x.UserId == id)
                .OrderByDescending(x => x.RecordDate)
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
                Diets = _mapper.Map<List<DietDto>>(diets),
                Measurements = _mapper.Map<List<MeasurementDto>>(measurements),
                Workouts = new List<ExerciseDto>()
            };
        }

        public async Task AddMeasurementAsync(int userId, MeasurementDto dto)
        {
            var measurement = new Measurement
            {
                UserId = userId,
                Weight = dto.Weight,
                Shoulder = dto.Shoulder,
                Chest = dto.Chest,
                LeftArm = dto.LeftArm,
                RightArm = dto.RightArm,
                Waist = dto.Waist,
                Neck = dto.Neck,
                Hips = dto.Hips,
                RightLeg = dto.RightLeg,
                LeftLeg = dto.LeftLeg,
                RecordDate = DateTime.Now
            };

            await _measurementRepository.AddAsync(measurement);
            await _unitOfWork.CommitAsync();
        }

        public async Task<IEnumerable<Measurement>> GetMeasurementsAsync(int userId)
        {
            return await _measurementRepository
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.RecordDate)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<bool> DeleteMeasurementAsync(int id)
        {
            var measurement = await _measurementRepository.GetByIdAsync(id);
            if (measurement == null)
                return false;

            _measurementRepository.Remove(measurement);
            await _unitOfWork.CommitAsync();
            return true;
        }

        public async Task UpdateMeasurementAsync(int id, MeasurementDto dto)
        {
            var measurement = await _measurementRepository.GetByIdAsync(id);
            if (measurement != null)
            {
                measurement.Weight = dto.Weight;
                measurement.Shoulder = dto.Shoulder;
                measurement.Chest = dto.Chest;
                measurement.LeftArm = dto.LeftArm;
                measurement.RightArm = dto.RightArm;
                measurement.Waist = dto.Waist;
                measurement.Neck = dto.Neck;
                measurement.Hips = dto.Hips;
                measurement.RightLeg = dto.RightLeg;
                measurement.LeftLeg = dto.LeftLeg;

                _measurementRepository.Update(measurement);
                await _unitOfWork.CommitAsync();
            }
        }

        public async Task<IEnumerable<DietProgram>> GetDietProgramAsync(int userId)
        {
            return await _dietRepository
                .Where(x => x.UserId == userId)
                .Include(x => x.Foods)
                .OrderBy(x => x.Time)
                .AsNoTracking()
                .ToListAsync();
        }

        private async Task<List<DietMealFood>> PrepareMealFoodsAsync(List<DietMealFoodDto>? foodDtos)
        {
            var result = new List<DietMealFood>();
            if (foodDtos == null || !foodDtos.Any())
                return result;

            foreach (var f in foodDtos)
            {
                if (string.IsNullOrWhiteSpace(f.FoodName))
                    continue;

                int? foodId = (f.FoodId.HasValue && f.FoodId.Value > 0) ? f.FoodId : null;

                // Dış API'den (OpenFoodFacts) veya özel olarak ilk kez ekleniyorsa yerel veritabanına önbellekle (Auto-Cache)
                if (!foodId.HasValue && (f.CaloriesPer100g > 0 || !string.IsNullOrWhiteSpace(f.ExternalApiId)))
                {
                    var cached = await _foodService.CreateOrCacheFoodAsync(new FoodDto
                    {
                        Name = f.FoodName,
                        Brand = f.Brand,
                        Category = string.IsNullOrWhiteSpace(f.Category) ? "Genel" : f.Category,
                        CaloriesPer100g = f.CaloriesPer100g,
                        ProteinPer100g = f.ProteinPer100g,
                        CarbsPer100g = f.CarbsPer100g,
                        FatPer100g = f.FatPer100g,
                        DefaultUnit = string.IsNullOrWhiteSpace(f.DefaultUnit) ? (f.Unit ?? "Gram") : f.DefaultUnit,
                        DefaultWeightGrams = f.DefaultWeightGrams > 0 ? f.DefaultWeightGrams : 100,
                        Source = string.IsNullOrWhiteSpace(f.Source) ? "OpenFoodFacts" : f.Source,
                        ExternalApiId = f.ExternalApiId
                    });
                    foodId = cached.Id;
                }

                result.Add(new DietMealFood
                {
                    FoodId = foodId,
                    FoodName = f.FoodName.Trim(),
                    Brand = f.Brand?.Trim(),
                    Amount = f.Amount > 0 ? f.Amount : 100,
                    Unit = string.IsNullOrWhiteSpace(f.Unit) ? "Gram" : f.Unit.Trim(),
                    CalculatedCalories = Math.Max(0, f.CalculatedCalories),
                    CalculatedProtein = Math.Round(Math.Max(0, f.CalculatedProtein), 1),
                    CalculatedCarbs = Math.Round(Math.Max(0, f.CalculatedCarbs), 1),
                    CalculatedFat = Math.Round(Math.Max(0, f.CalculatedFat), 1)
                });
            }

            return result;
        }

        public async Task AddMealAsync(int userId, DietDto dto)
        {
            var mealFoods = await PrepareMealFoodsAsync(dto.Foods);
            int? finalCalories = dto.Calories;
            if ((!finalCalories.HasValue || finalCalories.Value <= 0) && mealFoods.Any())
            {
                finalCalories = mealFoods.Sum(x => x.CalculatedCalories);
            }

            var meal = new DietProgram
            {
                UserId = userId,
                MealName = dto.MealName ?? "İsimsiz Öğün",
                Time = dto.Time ?? "00:00",
                Content = dto.Content ?? string.Empty,
                Calories = finalCalories,
                CreatedDate = DateTime.Now,
                Foods = mealFoods
            };

            await _dietRepository.AddAsync(meal);
            await _unitOfWork.CommitAsync();
        }

        public async Task UpdateMealAsync(int mealId, DietDto dto)
        {
            var meal = await _dietRepository.GetByIdAsync(mealId);
            if (meal != null)
            {
                meal.MealName = dto.MealName ?? meal.MealName;
                meal.Time = dto.Time ?? meal.Time;
                meal.Content = dto.Content ?? meal.Content;

                // Eski öğün besinlerini temizle ve yenilerini ekle
                var existingFoods = await _dietMealFoodRepository.Where(x => x.DietProgramId == mealId).ToListAsync();
                foreach (var oldFood in existingFoods)
                {
                    _dietMealFoodRepository.Remove(oldFood);
                }

                var mealFoods = await PrepareMealFoodsAsync(dto.Foods);
                foreach (var newFood in mealFoods)
                {
                    newFood.DietProgramId = mealId;
                    await _dietMealFoodRepository.AddAsync(newFood);
                }

                int? finalCalories = dto.Calories;
                if ((!finalCalories.HasValue || finalCalories.Value <= 0) && mealFoods.Any())
                {
                    finalCalories = mealFoods.Sum(x => x.CalculatedCalories);
                }
                meal.Calories = finalCalories;

                _dietRepository.Update(meal);
                await _unitOfWork.CommitAsync();
            }
        }

        public async Task DeleteMealAsync(int mealId)
        {
            var meal = await _dietRepository.GetByIdAsync(mealId);
            if (meal != null)
            {
                _dietRepository.Remove(meal);
                await _unitOfWork.CommitAsync();
            }
        }

        public async Task SaveDietProgramAsync(int userId, SaveDietProgramDto dto)
        {
            var oldMeals = await _dietRepository.Where(x => x.UserId == userId).ToListAsync();
            foreach (var meal in oldMeals)
            {
                _dietRepository.Remove(meal);
            }

            if (dto?.TargetCalories != null)
            {
                var user = await _userRepository.GetByIdAsync(userId);
                if (user != null)
                {
                    user.TargetCalories = dto.TargetCalories;
                    _userRepository.Update(user);
                }
            }

            if (dto?.Meals != null && dto.Meals.Any())
            {
                foreach (var m in dto.Meals)
                {
                    var mealFoods = await PrepareMealFoodsAsync(m.Foods);
                    int? finalCalories = m.Calories;
                    if ((!finalCalories.HasValue || finalCalories.Value <= 0) && mealFoods.Any())
                    {
                        finalCalories = mealFoods.Sum(x => x.CalculatedCalories);
                    }

                    var newMeal = new DietProgram
                    {
                        UserId = userId,
                        MealName = string.IsNullOrWhiteSpace(m.MealName) ? "İsimsiz Öğün" : m.MealName,
                        Time = string.IsNullOrWhiteSpace(m.Time) ? "00:00" : m.Time,
                        Content = m.Content ?? string.Empty,
                        Calories = finalCalories,
                        CreatedDate = DateTime.Now,
                        Foods = mealFoods
                    };
                    await _dietRepository.AddAsync(newMeal);
                }
            }

            await _unitOfWork.CommitAsync();
        }

        public async Task SetTargetCaloriesAsync(int userId, SetTargetCaloriesDto dto)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
                throw new KeyNotFoundException("Üye bulunamadı.");

            user.TargetCalories = dto.TargetCalories;
            if (dto.Age.HasValue && dto.Age.Value > 0) user.Age = dto.Age;
            if (dto.Height.HasValue && dto.Height.Value > 0) user.Height = dto.Height;
            if (!string.IsNullOrWhiteSpace(dto.Gender)) user.Gender = dto.Gender;

            _userRepository.Update(user);
            await _unitOfWork.CommitAsync();
        }

        public async Task<IEnumerable<ExerciseDto>> GetAllExercisesAsync()
        {
            var exercises = await _exerciseRepository.GetAll().AsNoTracking().ToListAsync();
            return exercises.Select(e => new ExerciseDto
            {
                Id = e.Id,
                Name = e.Name,
                MuscleGroup = e.MuscleGroup,
                Description = e.Description ?? string.Empty,
                VideoUrl = e.VideoUrl ?? string.Empty
            }).ToList();
        }

        public async Task AddExerciseAsync(ExerciseDto dto)
        {
            var newExercise = new Exercise
            {
                Name = string.IsNullOrWhiteSpace(dto.Name) ? "İsimsiz Hareket" : dto.Name,
                MuscleGroup = string.IsNullOrWhiteSpace(dto.MuscleGroup) ? "Göğüs" : dto.MuscleGroup,
                Description = dto.Description ?? string.Empty,
                VideoUrl = dto.VideoUrl ?? string.Empty,
                ImageUrl = string.Empty
            };
            await _exerciseRepository.AddAsync(newExercise);
            await _unitOfWork.CommitAsync();
        }

        public async Task UpdateExerciseAsync(int id, ExerciseDto dto)
        {
            var exercise = await _exerciseRepository.GetByIdAsync(id);
            if (exercise != null)
            {
                exercise.Name = string.IsNullOrWhiteSpace(dto.Name) ? exercise.Name : dto.Name;
                exercise.MuscleGroup = string.IsNullOrWhiteSpace(dto.MuscleGroup) ? exercise.MuscleGroup : dto.MuscleGroup;
                exercise.Description = dto.Description ?? string.Empty;
                exercise.VideoUrl = dto.VideoUrl ?? string.Empty;

                _exerciseRepository.Update(exercise);
                await _unitOfWork.CommitAsync();
            }
        }

        public async Task DeleteExerciseAsync(int id)
        {
            var exercise = await _exerciseRepository.GetByIdAsync(id);
            if (exercise != null)
            {
                _exerciseRepository.Remove(exercise);
                await _unitOfWork.CommitAsync();
            }
        }

        public async Task<IEnumerable<MembershipPackage>> GetAllPackagesAsync()
        {
            return await _packageRepository.GetAll().AsNoTracking().ToListAsync();
        }

        public async Task AddPackageAsync(MembershipPackage package)
        {
            await _packageRepository.AddAsync(package);
            await _unitOfWork.CommitAsync();
        }

        public async Task UpdatePackageAsync(int id, MembershipPackage package)
        {
            var existingPackage = await _packageRepository.GetByIdAsync(id);
            if (existingPackage != null)
            {
                existingPackage.Name = package.Name;
                existingPackage.Price = package.Price;
                existingPackage.DurationMonths = package.DurationMonths;
                existingPackage.ShowOnWebsite = package.ShowOnWebsite;

                _packageRepository.Update(existingPackage);
                await _unitOfWork.CommitAsync();
            }
        }

        public async Task<bool> TogglePackageWebsiteAsync(int id)
        {
            var existingPackage = await _packageRepository.GetByIdAsync(id);
            if (existingPackage == null) return false;

            existingPackage.ShowOnWebsite = !existingPackage.ShowOnWebsite;
            _packageRepository.Update(existingPackage);
            await _unitOfWork.CommitAsync();
            return existingPackage.ShowOnWebsite;
        }

        public async Task DeletePackageAsync(int id)
        {
            var existingPackage = await _packageRepository.GetByIdAsync(id);
            if (existingPackage != null)
            {
                _packageRepository.Remove(existingPackage);
                await _unitOfWork.CommitAsync();
            }
        }

        public async Task UpdateMemberAsync(int id, UpdateMemberDto dto)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null)
                throw new KeyNotFoundException("Güncellenecek üye bulunamadı.");

            if (!string.IsNullOrWhiteSpace(dto.Email))
            {
                var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
                bool emailTakenByOther = await _userRepository
                    .Where(x => x.Id != id && x.Email.ToLower() == normalizedEmail)
                    .AnyAsync();

                if (emailTakenByOther)
                    throw new InvalidOperationException("Bu e-posta adresi başka bir üye tarafından kullanılmaktadır.");

                user.Email = dto.Email.Trim();
            }

            decimal previousPaid = user.PaidAmount;

            user.FirstName = dto.FirstName?.Trim() ?? user.FirstName;
            user.LastName = dto.LastName?.Trim() ?? user.LastName;
            user.PhoneNumber = dto.PhoneNumber?.Trim();
            user.MembershipStartDate = dto.MembershipStartDate;
            user.SubscriptionEndDate = dto.SubscriptionEndDate;
            user.PaidAmount = Math.Max(0, dto.PaidAmount);

            if (dto.PackageId.HasValue && user.PackageId != dto.PackageId)
            {
                user.PackageId = dto.PackageId;
                user.CurrentPackageId = dto.PackageId;
                var package = await _packageRepository.GetByIdAsync(dto.PackageId.Value);
                if (package != null)
                {
                    user.TotalDebt = package.Price;
                }
            }

            if (!string.IsNullOrWhiteSpace(dto.Password))
            {
                user.PasswordHash = PasswordHasher.HashPassword(dto.Password);
            }

            var today = DateTime.Now.Date;
            bool isStarted = !user.MembershipStartDate.HasValue || user.MembershipStartDate.Value.Date <= today;
            bool isNotExpired = !user.SubscriptionEndDate.HasValue || user.SubscriptionEndDate.Value.Date >= today;

            if (!user.IsFrozen)
            {
                user.IsActive = isStarted && isNotExpired;
            }

            _userRepository.Update(user);

            if (user.PaidAmount > previousPaid)
            {
                decimal diff = user.PaidAmount - previousPaid;
                await _pendingPaymentRepository.AddAsync(new PendingMembershipPayment
                {
                    UserId = user.Id,
                    MemberFullName = $"{user.FirstName} {user.LastName}".Trim(),
                    PackageId = user.PackageId,
                    PackageName = "Tahsilat Güncellemesi",
                    PaymentType = "DebtPayment",
                    Amount = diff,
                    CreatedAt = DateTime.Now,
                    Status = "Pending"
                });
            }

            await _unitOfWork.CommitAsync();
        }

        public async Task DeleteMemberAsync(int id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user != null)
            {
                _userRepository.Remove(user);
                await _unitOfWork.CommitAsync();
            }
        }

        public async Task ToggleFreezeAsync(int id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) return;

            if (!user.IsFrozen)
            {
                user.IsFrozen = true;
                user.FreezeDate = DateTime.Now;
            }
            else
            {
                user.IsFrozen = false;

                if (user.FreezeDate.HasValue && user.SubscriptionEndDate.HasValue)
                {
                    var frozenDuration = DateTime.Now - user.FreezeDate.Value;
                    if (frozenDuration.TotalSeconds > 0)
                    {
                        user.SubscriptionEndDate = user.SubscriptionEndDate.Value.Add(frozenDuration);
                    }
                }

                user.FreezeDate = null;
                if (user.SubscriptionEndDate.HasValue)
                {
                    user.IsActive = user.SubscriptionEndDate.Value.Date >= DateTime.Now.Date;
                }
            }

            _userRepository.Update(user);
            await _unitOfWork.CommitAsync();
        }

        public async Task<bool> RenewMembershipAsync(int userId, int packageId, decimal paidAmount, DateTime? startDate = null, DateTime? endDate = null)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null) return false;

            var package = await _packageRepository.GetByIdAsync(packageId);
            if (package == null)
                throw new KeyNotFoundException("Seçilen üyelik paketi bulunamadı.");

            // Eğer üye dondurulmuş durumdaysa önce donuk kaldığı süreyi bitiş tarihine ekle
            if (user.IsFrozen && user.FreezeDate.HasValue && user.SubscriptionEndDate.HasValue)
            {
                var frozenDuration = DateTime.Now - user.FreezeDate.Value;
                if (frozenDuration.TotalSeconds > 0)
                {
                    user.SubscriptionEndDate = user.SubscriptionEndDate.Value.Add(frozenDuration);
                }
            }

            var today = DateTime.Now.Date;

            // Bitiş tarihi mantığı:
            // 1. Admin özel bitiş tarihi (endDate) göndermişse onu baz al
            // 2. Göndermemişse:
            //    - startDate verilmişse: startDate + durationMonths
            //    - startDate verilmemişse: mevcut bitiş tarihi gelecekteyse (mevcut bitiş + durationMonths), değilse (today + durationMonths)
            if (endDate.HasValue && endDate.Value.Year > 1970)
            {
                user.SubscriptionEndDate = endDate.Value;
            }
            else if (startDate.HasValue && startDate.Value.Year > 1970)
            {
                user.SubscriptionEndDate = startDate.Value.AddMonths(package.DurationMonths);
            }
            else if (user.SubscriptionEndDate.HasValue && user.SubscriptionEndDate.Value.Date >= today)
            {
                user.SubscriptionEndDate = user.SubscriptionEndDate.Value.AddMonths(package.DurationMonths);
            }
            else
            {
                user.SubscriptionEndDate = today.AddMonths(package.DurationMonths);
            }

            // Başlangıç tarihi güncellemesi:
            if (startDate.HasValue && startDate.Value.Year > 1970)
            {
                // Eğer üyenin üyeliği daha önce bitmişse veya başlangıç tarihi henüz yoksa yeni başlangıç tarihini ata
                if (!user.MembershipStartDate.HasValue || (user.SubscriptionEndDate.HasValue && user.SubscriptionEndDate.Value.Date < today))
                {
                    user.MembershipStartDate = startDate.Value;
                }
            }

            user.PackageId = package.Id;
            user.CurrentPackageId = package.Id;
            user.TotalDebt += package.Price;
            user.PaidAmount += Math.Max(0, paidAmount);
            user.IsFrozen = false;
            user.FreezeDate = null;

            // Aktiflik durumu:
            DateTime checkStart = startDate ?? user.MembershipStartDate ?? today;
            bool isStarted = checkStart.Date <= today;
            bool isNotExpired = user.SubscriptionEndDate.HasValue && user.SubscriptionEndDate.Value.Date >= today;
            user.IsActive = isStarted && isNotExpired;

            _userRepository.Update(user);

            if (paidAmount > 0)
            {
                await _pendingPaymentRepository.AddAsync(new PendingMembershipPayment
                {
                    UserId = user.Id,
                    MemberFullName = $"{user.FirstName} {user.LastName}".Trim(),
                    PackageId = package.Id,
                    PackageName = package.Name,
                    PaymentType = "Renewal",
                    Amount = paidAmount,
                    CreatedAt = DateTime.Now,
                    Status = "Pending"
                });
            }

            await _unitOfWork.CommitAsync();

            return true;
        }

        public async Task<bool> PayDebtAsync(int userId, decimal amount)
        {
            if (amount <= 0)
                throw new ArgumentException("Ödeme tutarı sıfırdan büyük olmalıdır.");

            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null) return false;

            user.PaidAmount += amount;

            _userRepository.Update(user);

            await _pendingPaymentRepository.AddAsync(new PendingMembershipPayment
            {
                UserId = user.Id,
                MemberFullName = $"{user.FirstName} {user.LastName}".Trim(),
                PackageId = user.PackageId,
                PackageName = "Borç Tahsilatı",
                PaymentType = "DebtPayment",
                Amount = amount,
                CreatedAt = DateTime.Now,
                Status = "Pending"
            });

            await _unitOfWork.CommitAsync();
            return true;
        }

        private string GetFacilityConfigFilePath()
        {
            var baseDir = AppContext.BaseDirectory;
            return Path.Combine(baseDir, "facilities_config.json");
        }

        public async Task<FacilityConfigDto> GetFacilityConfigAsync()
        {
            var filePath = GetFacilityConfigFilePath();
            try
            {
                if (File.Exists(filePath))
                {
                    var json = await File.ReadAllTextAsync(filePath);
                    var config = JsonSerializer.Deserialize<FacilityConfigDto>(json, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });
                    if (config != null && (config.EquipmentCards?.Count > 0 || config.GalleryPhotos?.Count > 0))
                    {
                        if (config.AvailablePhotos == null || config.AvailablePhotos.Count == 0)
                        {
                            config.AvailablePhotos = GetDefaultAvailablePhotos();
                            await SaveFacilityConfigAsync(config);
                        }
                        return config;
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error reading facilities config: {ex.Message}");
            }

            var defaultConfig = GetDefaultFacilityConfig();
            await SaveFacilityConfigAsync(defaultConfig);
            return defaultConfig;
        }

        public async Task<FacilityConfigDto> SaveFacilityConfigAsync(FacilityConfigDto config)
        {
            if (config == null) throw new ArgumentNullException(nameof(config));
            var filePath = GetFacilityConfigFilePath();

            var json = JsonSerializer.Serialize(config, new JsonSerializerOptions
            {
                WriteIndented = true
            });

            await File.WriteAllTextAsync(filePath, json);
            return config;
        }

        public async Task<FacilityConfigDto> ResetFacilityConfigAsync()
        {
            var defaultConfig = GetDefaultFacilityConfig();
            await SaveFacilityConfigAsync(defaultConfig);
            return defaultConfig;
        }

        private FacilityConfigDto GetDefaultFacilityConfig()
        {
            return new FacilityConfigDto
            {
                EquipmentCards = new List<FacilityCardDto>
                {
                    new FacilityCardDto
                    {
                        Id = 1,
                        Cat = "free",
                        Title = "1.5 kg - 40 kg Tam Set Dumbell Parkuru",
                        Desc = "1.5 kg’dan 40 kg’a kadar çift istasyon tam set kauçuk dumbellar, ayarlanabilir profesyonel sehpalar ve serbest ağırlık alanı.",
                        Tag = "Serbest Ağırlık",
                        Img = "/SalonunFotolari/Salon1.jpeg",
                        IsVisible = true,
                        DisplayOrder = 1
                    },
                    new FacilityCardDto
                    {
                        Id = 2,
                        Cat = "machines",
                        Title = "Leg Press & Alt Gövde İstasyonu",
                        Desc = "Ağır bacak geliştirme ve alt gövde kuvvet artışı için tasarlanmış, biyomekanik açılı profesyonel Leg Press istasyonu.",
                        Tag = "Özel Makine",
                        Img = "/SalonunFotolari/Salon2.jpeg",
                        IsVisible = true,
                        DisplayOrder = 2
                    },
                    new FacilityCardDto
                    {
                        Id = 3,
                        Cat = "free",
                        Title = "Squat Kafesi (Power Rack)",
                        Desc = "Ağır Squat, Overhead Press ve Deadlift için ayarlanabilir emniyet barlı sağlam kafes sistemi ile sıfır riskte maksimum güç.",
                        Tag = "Güç & Güvenlik",
                        Img = "/SalonunFotolari/Salon3.jpeg",
                        IsVisible = true,
                        DisplayOrder = 3
                    },
                    new FacilityCardDto
                    {
                        Id = 4,
                        Cat = "machines",
                        Title = "Chest Press & İzole Göğüs Makineleri",
                        Desc = "Omuz eklemini yormadan göğüs kas liflerini maksimum gerilimle hedef alan biyomekanik izole Chest Press istasyonu.",
                        Tag = "İzole İstasyon",
                        Img = "/SalonunFotolari/Salon4.jpeg",
                        IsVisible = true,
                        DisplayOrder = 4
                    },
                    new FacilityCardDto
                    {
                        Id = 5,
                        Cat = "cardio",
                        Title = "Yüksek Tempolu Koşu Bantları",
                        Desc = "Dokunmatik dijital göstergeli, eğim ve hız kontrollü profesyonel kardiyo parkuru ile yağ yakımınızı hızlandırın.",
                        Tag = "Kardiyo",
                        Img = "/SalonunFotolari/Salon5.jpeg",
                        IsVisible = true,
                        DisplayOrder = 5
                    },
                    new FacilityCardDto
                    {
                        Id = 6,
                        Cat = "pilates",
                        Title = "Reformer & Grup Pilates Stüdyosu",
                        Desc = "Esneklik, core direnci ve postür düzeltmeye odaklı özel ekipmanlı, ferah kadın ve grup pilates stüdyosu.",
                        Tag = "Pilates Stüdyosu",
                        Img = "/SalonunFotolari/Salon6.jpeg",
                        IsVisible = true,
                        DisplayOrder = 6
                    },
                    new FacilityCardDto
                    {
                        Id = 7,
                        Cat = "machines",
                        Title = "Lat Pulldown & Kablo İstasyonları",
                        Desc = "Çok yönlü kablo açıları, Lat Pulldown ve triceps/biceps çekiş mekanizmalarıyla eksiksiz sırt ve kol gelişimi.",
                        Tag = "Kablo Parkuru",
                        Img = "/SalonunFotolari/Salon10.jpeg",
                        IsVisible = true,
                        DisplayOrder = 7
                    }
                },
                GalleryPhotos = new List<FacilityPhotoDto>
                {
                    new FacilityPhotoDto { Id = 1, Img = "/SalonunFotolari/Salon1.jpeg", Title = "Serbest Ağırlık ve Dumbell Alanı", Subtitle = "1.5 - 40 kg çift set dumbell parkuru ve sehpalar", IsVisible = true, DisplayOrder = 1 },
                    new FacilityPhotoDto { Id = 2, Img = "/SalonunFotolari/Salon2.jpeg", Title = "Bacak ve Güç İstasyonları", Subtitle = "Biyomekanik Leg Press ve squat makineleri", IsVisible = true, DisplayOrder = 2 },
                    new FacilityPhotoDto { Id = 3, Img = "/SalonunFotolari/Salon3.jpeg", Title = "Squat Kafesi & Serbest Ağırlık", Subtitle = "Emniyet barlı olimpik rack ve serbest ağırlık", IsVisible = true, DisplayOrder = 3 },
                    new FacilityPhotoDto { Id = 4, Img = "/SalonunFotolari/Salon4.jpeg", Title = "İzole Makine Parkuru", Subtitle = "Hedefe yönelik izole göğüs ve sırt ekipmanları", IsVisible = true, DisplayOrder = 4 },
                    new FacilityPhotoDto { Id = 5, Img = "/SalonunFotolari/Salon5.jpeg", Title = "Kardiyo ve Yağ Yakım Hattı", Subtitle = "Profesyonel koşu bantları ve bisikletler", IsVisible = true, DisplayOrder = 5 },
                    new FacilityPhotoDto { Id = 6, Img = "/SalonunFotolari/Salon6.jpeg", Title = "Pilates & Mat Stüdyosu", Subtitle = "Kadın saatleri ve pilates çalışma alanı", IsVisible = true, DisplayOrder = 6 },
                    new FacilityPhotoDto { Id = 7, Img = "/SalonunFotolari/Salon7.jpeg", Title = "Pilates ve Esneme Ekipmanları", Subtitle = "Reformer topları, lastikler ve denge ekipmanları", IsVisible = true, DisplayOrder = 7 },
                    new FacilityPhotoDto { Id = 8, Img = "/SalonunFotolari/Salon8.jpeg", Title = "Grup Egzersiz ve Fonksiyonel Alan", Subtitle = "Core ve esneme hareketleri için izole zemin", IsVisible = true, DisplayOrder = 8 },
                    new FacilityPhotoDto { Id = 9, Img = "/SalonunFotolari/Salon9.jpeg", Title = "Reformer Pilates Çalışma Bölümü", Subtitle = "Bireysel ve kadın odaklı kondisyon seansları", IsVisible = true, DisplayOrder = 9 },
                    new FacilityPhotoDto { Id = 10, Img = "/SalonunFotolari/Salon10.jpeg", Title = "Kablo ve Sırt İstasyonları", Subtitle = "Çok fonksiyonlu kablo çekiş ve Lat Pulldown", IsVisible = true, DisplayOrder = 10 }
                },
                AvailablePhotos = GetDefaultAvailablePhotos()
            };
        }

        private List<SalonPhotoItemDto> GetDefaultAvailablePhotos()
        {
            return new List<SalonPhotoItemDto>
            {
                new SalonPhotoItemDto { Id = 1, Url = "/SalonunFotolari/Salon1.jpeg", Label = "Salon 1 (Dumbell & Serbest Ağırlık Parkuru)", IsDefault = true },
                new SalonPhotoItemDto { Id = 2, Url = "/SalonunFotolari/Salon2.jpeg", Label = "Salon 2 (Leg Press & Alt Gövde İstasyonu)", IsDefault = true },
                new SalonPhotoItemDto { Id = 3, Url = "/SalonunFotolari/Salon3.jpeg", Label = "Salon 3 (Squat Kafesi / Power Rack)", IsDefault = true },
                new SalonPhotoItemDto { Id = 4, Url = "/SalonunFotolari/Salon4.jpeg", Label = "Salon 4 (Chest Press & Makineler)", IsDefault = true },
                new SalonPhotoItemDto { Id = 5, Url = "/SalonunFotolari/Salon5.jpeg", Label = "Salon 5 (Koşu Bantları & Kardiyo Hattı)", IsDefault = true },
                new SalonPhotoItemDto { Id = 6, Url = "/SalonunFotolari/Salon6.jpeg", Label = "Salon 6 (Pilates & Reformer Stüdyosu 1)", IsDefault = true },
                new SalonPhotoItemDto { Id = 7, Url = "/SalonunFotolari/Salon7.jpeg", Label = "Salon 7 (Pilates Stüdyosu / Toplar & Minderler)", IsDefault = true },
                new SalonPhotoItemDto { Id = 8, Url = "/SalonunFotolari/Salon8.jpeg", Label = "Salon 8 (Grup Dersleri & Esneme Alanı)", IsDefault = true },
                new SalonPhotoItemDto { Id = 9, Url = "/SalonunFotolari/Salon9.jpeg", Label = "Salon 9 (Pilates & Kadın Çalışma Alanı)", IsDefault = true },
                new SalonPhotoItemDto { Id = 10, Url = "/SalonunFotolari/Salon10.jpeg", Label = "Salon 10 (Kablo Parkuru & Lat Pulldown)", IsDefault = true }
            };
        }

        private string GetSiteStudioConfigFilePath()
        {
            var baseDir = AppContext.BaseDirectory;
            return Path.Combine(baseDir, "site_studio_config.json");
        }

        private string GetSiteLeadsFilePath()
        {
            var baseDir = AppContext.BaseDirectory;
            return Path.Combine(baseDir, "site_leads.json");
        }

        private List<WeeklyScheduleItemDto> GetDefaultWeeklySchedule()
        {
            return new List<WeeklyScheduleItemDto>
            {
                new WeeklyScheduleItemDto { DayName = "Pazartesi", IsWomenDay = false, WomenOnlyHours = "-", GeneralHours = "09:00 - 23:00", Note = "Tam Gün Genel / Karma Antrenman" },
                new WeeklyScheduleItemDto { DayName = "Salı", IsWomenDay = false, WomenOnlyHours = "-", GeneralHours = "09:00 - 23:00", Note = "Tam Gün Genel / Karma Antrenman" },
                new WeeklyScheduleItemDto { DayName = "Çarşamba", IsWomenDay = true, WomenOnlyHours = "09:00 - 20:00", GeneralHours = "20:00 - 23:00", Note = "🌸 20:00'a Kadar Kadınlara Özel • Sonrası Genel" },
                new WeeklyScheduleItemDto { DayName = "Perşembe", IsWomenDay = false, WomenOnlyHours = "-", GeneralHours = "09:00 - 23:00", Note = "Tam Gün Genel / Karma Antrenman" },
                new WeeklyScheduleItemDto { DayName = "Cuma", IsWomenDay = true, WomenOnlyHours = "18:00 - 23:00", GeneralHours = "09:00 - 18:00", Note = "🌸 18:00'dan Kapanışa Kadar Kadınlara Özel" },
                new WeeklyScheduleItemDto { DayName = "Cumartesi", IsWomenDay = false, WomenOnlyHours = "-", GeneralHours = "09:00 - 23:00", Note = "Tam Gün Genel / Karma Antrenman" },
                new WeeklyScheduleItemDto { DayName = "Pazar", IsWomenDay = true, WomenOnlyHours = "09:00 - 17:00", GeneralHours = "17:00 - 23:00", Note = "🌸 17:00'a Kadar Kadınlara Özel • Sonrası Genel" }
            };
        }

        private SiteContainerDto GetDefaultFaqContainer(int order = 7)
        {
            return new SiteContainerDto
            {
                Id = "faq-main",
                Type = "FAQ",
                Order = order,
                IsActive = true,
                Title = "SIKÇA SORULAN SORULAR (SSS)",
                Subtitle = "Salona kayıt olmadan önce aklınıza takılan tüm soruların şeffaf ve net yanıtları.",
                BadgeText = "MERAK EDİLENLER",
                Items = new List<ContainerItemDto>
                {
                    new ContainerItemDto
                    {
                        Id = 1,
                        Title = "Kadınlara özel seanslarda erkek üye veya personel bulunuyor mu?",
                        Tag = "Kadın Seansları",
                        Description = "Hayır. Kadınlara özel seanslarımızda (Çarşamba 09:00-20:00, Cuma 18:00-23:00 ve Pazar 09:00-17:00) salonumuz tamamen kadın üyelerimize tahsis edilir ve yalnızca kadın eğitmenimiz görev yapar."
                    },
                    new ContainerItemDto
                    {
                        Id = 2,
                        Title = "Spora yeni başlıyorum, antrenman ve beslenme programı veriyor musunuz?",
                        Tag = "Program & Diyet",
                        Description = "Evet! Kayıt olduğunuz ilk gün vücut analiziniz yapılır; hedefinize uygun kişisel antrenman ve Mifflin-St Jeor bazal metabolizma hesabına dayalı beslenme programınız N1FIT Mobil Uygulamanıza tanımlanır."
                    },
                    new ContainerItemDto
                    {
                        Id = 3,
                        Title = "Üyeliğimi dondurma (askıya alma) hakkım var mı?",
                        Tag = "Üyelik İşlemleri",
                        Description = "Evet, uzun süreli seyahat, sağlık veya sınav dönemlerinizde yönetimle görüşerek üyeliğinizi dondurabilir, döndüğünüzde hak kaybı yaşamadan kaldığınız günden devam edebilirsiniz."
                    },
                    new ContainerItemDto
                    {
                        Id = 4,
                        Title = "Salonda duş, kilitli dolap ve ücretsiz otopark mevcut mu?",
                        Tag = "Tesis & Konfor",
                        Description = "Tesisimizde sıcak duş kabinleri, kişisel kilitli soyunma dolapları, yüksek kapasiteli taze hava sirkülasyonu ve salon önünde ücretsiz otopark alanı mevcuttur."
                    }
                }
            };
        }

        public async Task<SiteStudioConfigDto> GetSiteStudioConfigAsync()
        {
            var filePath = GetSiteStudioConfigFilePath();
            try
            {
                if (File.Exists(filePath))
                {
                    var json = await File.ReadAllTextAsync(filePath);
                    var config = JsonSerializer.Deserialize<SiteStudioConfigDto>(json, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });
                    if (config != null && config.Containers?.Count > 0)
                    {
                        bool needsSave = false;
                        if (config.BrandConfig == null) { config.BrandConfig = new BrandConfigDto(); needsSave = true; }
                        if (config.CountdownConfig == null) { config.CountdownConfig = new CountdownBannerConfigDto(); needsSave = true; }
                        if (config.TopBarConfig == null) { config.TopBarConfig = new TopAnnouncementConfigDto(); needsSave = true; }
                        if (config.GreetingConfig == null) { config.GreetingConfig = new DynamicGreetingConfigDto(); needsSave = true; }
                        if (config.SeoConfig == null) { config.SeoConfig = new SeoConfigDto(); needsSave = true; }
                        if (config.ThemeConfig == null) { config.ThemeConfig = new ThemeConfigDto(); needsSave = true; }

                        var hoursContainer = config.Containers.FirstOrDefault(c => c.Type == "HOURS");
                        if (hoursContainer != null && (hoursContainer.WeeklySchedule == null || hoursContainer.WeeklySchedule.Count == 0))
                        {
                            hoursContainer.WeeklySchedule = GetDefaultWeeklySchedule();
                            hoursContainer.ShowWeeklyTable = true;
                            needsSave = true;
                        }

                        if (!config.Containers.Any(c => c.Type == "FAQ"))
                        {
                            int contactIdx = config.Containers.FindIndex(c => c.Type == "CONTACT");
                            var faqContainer = GetDefaultFaqContainer(config.Containers.Count + 1);
                            if (contactIdx >= 0)
                            {
                                config.Containers.Insert(contactIdx, faqContainer);
                                for (int i = 0; i < config.Containers.Count; i++)
                                    config.Containers[i].Order = i + 1;
                            }
                            else
                            {
                                config.Containers.Add(faqContainer);
                            }
                            needsSave = true;
                        }

                        if (config.AvailablePhotos == null || config.AvailablePhotos.Count == 0)
                        {
                            var fac = await GetFacilityConfigAsync();
                            config.AvailablePhotos = fac.AvailablePhotos?.Count > 0 ? fac.AvailablePhotos : GetDefaultAvailablePhotos();
                            needsSave = true;
                        }

                        if (needsSave)
                        {
                            await SaveSiteStudioConfigAsync(config);
                        }
                        return config;
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error reading site studio config: {ex.Message}");
            }

            var defaultConfig = await GetDefaultSiteStudioConfigAsync();
            await SaveSiteStudioConfigAsync(defaultConfig);
            return defaultConfig;
        }

        public async Task<SiteStudioConfigDto> SaveSiteStudioConfigAsync(SiteStudioConfigDto config)
        {
            if (config == null) throw new ArgumentNullException(nameof(config));
            var filePath = GetSiteStudioConfigFilePath();

            var json = JsonSerializer.Serialize(config, new JsonSerializerOptions
            {
                WriteIndented = true
            });

            await File.WriteAllTextAsync(filePath, json);
            return config;
        }

        public async Task<SiteStudioConfigDto> ResetSiteStudioConfigAsync()
        {
            var defaultConfig = await GetDefaultSiteStudioConfigAsync();
            await SaveSiteStudioConfigAsync(defaultConfig);
            return defaultConfig;
        }

        public async Task<PublicSiteStudioDto> GetPublicSiteStudioConfigAsync()
        {
            var fullConfig = await GetSiteStudioConfigAsync();
            var publicDto = new PublicSiteStudioDto
            {
                BrandConfig = fullConfig.BrandConfig ?? new BrandConfigDto(),
                PopupConfig = fullConfig.PopupConfig ?? new CampaignPopupConfigDto(),
                CountdownConfig = fullConfig.CountdownConfig ?? new CountdownBannerConfigDto(),
                TopBarConfig = fullConfig.TopBarConfig ?? new TopAnnouncementConfigDto(),
                GreetingConfig = fullConfig.GreetingConfig ?? new DynamicGreetingConfigDto(),
                SeoConfig = fullConfig.SeoConfig ?? new SeoConfigDto(),
                ThemeConfig = fullConfig.ThemeConfig ?? new ThemeConfigDto(),
                Containers = fullConfig.Containers?
                    .Where(c => c.IsActive)
                    .OrderBy(c => c.Order)
                    .ToList() ?? new List<SiteContainerDto>()
            };
            return publicDto;
        }

        private async Task<SiteStudioConfigDto> GetDefaultSiteStudioConfigAsync()
        {
            List<SalonPhotoItemDto> photos;
            try
            {
                var fac = await GetFacilityConfigAsync();
                photos = fac.AvailablePhotos?.Count > 0 ? fac.AvailablePhotos : GetDefaultAvailablePhotos();
            }
            catch
            {
                photos = GetDefaultAvailablePhotos();
            }

            return new SiteStudioConfigDto
            {
                AvailablePhotos = photos,
                BrandConfig = new BrandConfigDto
                {
                    LogoUrl = "/favicon.png",
                    BrandNamePrefix = "N1",
                    BrandNameAccent = "FIT",
                    DisplayMode = "logo_and_text",
                    InstagramUrl = "https://www.instagram.com/n1fitspormerkezi/",
                    WhatsAppNumber = "905396078154",
                    YouTubeUrl = "https://www.youtube.com/@N1F%C4%B0TSPORMERKEZ%C4%B0",
                    FloatingWhatsAppEnabled = true,
                    FloatingWhatsAppText = "Canlı Destek & Fiyat Al",
                    FloatingWhatsAppMessage = "Merhaba, N1FIT web sitesinden yazıyorum. Üyelik paketleri ve salon hakkında bilgi alabilir miyim?",
                    FloatingWhatsAppShowOnMobile = true
                },
                PopupConfig = new CampaignPopupConfigDto
                {
                    Enabled = false,
                    Title = "N1FIT'te Yeni Sezon Avantajları!",
                    Subtitle = "Sınırlı Süreliğine Özel Fırsat",
                    Description = "Kişiselleştirilmiş antrenman programı, bilimsel diyet ve kadın seansları avantajıyla hemen kaydolun.",
                    ImageUrl = "/SalonunFotolari/Salon1.jpeg",
                    BadgeText = "ÖZEL KAMPANYA",
                    ButtonText = "Paketleri İncele",
                    ButtonLink = "#packages",
                    SecondaryButtonText = "Kapat",
                    ShowFrequency = "once_per_day",
                    AutoSchedule = false,
                    StartDate = string.Empty,
                    EndDate = string.Empty
                },
                CountdownConfig = new CountdownBannerConfigDto
                {
                    Enabled = false,
                    BadgeText = "SINIRLI SÜRE",
                    Title = "YENİ SEZON ERKEN KAYIT İNDİRİMİ",
                    Subtitle = "Kontenjanlar dolmadan önce avantajlı üyelik fırsatını yakalayın!",
                    TargetDate = DateTime.Now.AddDays(14).ToString("yyyy-MM-ddTHH:mm:ss"),
                    ButtonText = "Fırsatı Yakala",
                    ButtonLink = "#packages",
                    BackgroundColor = "#990000"
                },
                TopBarConfig = new TopAnnouncementConfigDto
                {
                    Enabled = true,
                    BadgeText = "DUYURU",
                    Text = "🌸 Çarşamba, Cuma ve Pazar günleri Kadınlara Özel Bağımsız Seanslarımız devam ediyor! • 🎁 Ücretsiz vücut analizi ve tanışma antrenmanı için hemen ön kayıt formunu doldurun.",
                    ScrollingMarquee = false,
                    BackgroundColor = "#141824",
                    TextColor = "#ffffff",
                    ButtonText = "Ön Kayıt Formu",
                    ButtonLink = "#contact"
                },
                GreetingConfig = new DynamicGreetingConfigDto
                {
                    Enabled = true,
                    MorningGreeting = "Güne Güçlü ve Enerjik Başla, Gölyaka!",
                    AfternoonGreeting = "Günün Zirve Performansını Yakala!",
                    EveningGreeting = "Günün Yorgunluğunu ve Stresini Salonda Bırak!",
                    NightGreeting = "Yarın İçin Hazırlan, Hedeflerinden Asla Vazgeçme!"
                },
                SeoConfig = new SeoConfigDto
                {
                    MetaTitle = "N1FIT Spor Merkezi | Gölyaka Fitness & Vücut Geliştirme",
                    MetaDescription = "Bilimsel antrenman, profesyonel ekipmanlar, kadınlara özel seanslar ve 15 yıllık tecrübeyle Gölyaka'da fitness standartlarını yükseltiyoruz.",
                    Keywords = "gölyaka spor salonu, düzce fitness, n1fit, vücut geliştirme, kadın seansları, kişisel antrenör",
                    OgTitle = "N1FIT Spor Merkezi Gölyaka",
                    OgDescription = "Bilimin, disiplinin ve 15 yıllık tecrübenin buluştuğu yer. Hemen keşfedin!",
                    OgImageUrl = "/SalonunFotolari/Salon1.jpeg",
                    CanonicalUrl = "https://n1fit.com.tr",
                    StructuredDataEnabled = true
                },
                ThemeConfig = new ThemeConfigDto
                {
                    Preset = "red_power",
                    AccentColor = "#e50914",
                    AccentGlow = "rgba(229, 9, 20, 0.4)",
                    BackgroundPattern = "carbon_fiber",
                    CornerStyle = "rounded",
                    NavbarStyle = "blur_glass"
                },
                Containers = new List<SiteContainerDto>
                {
                    new SiteContainerDto
                    {
                        Id = "hero-main",
                        Type = "HERO",
                        Order = 1,
                        IsActive = true,
                        Title = "BİLİMİN VE DİSİPLİNİN BULUŞTUĞU YER",
                        Subtitle = "Kişiselleştirilmiş antrenman programları, bilimsel beslenme takibi ve Düzce Gölyaka'nın en kapsamlı fitness merkeziyle potansiyelini zirveye taşı.",
                        BadgeText = "GÖLYAKA'NIN EN BÜYÜK VE MODERN SPOR MERKEZİ",
                        BackgroundImage = "/SalonunFotolari/Salon1.jpeg",
                        PrimaryButtonText = "ÜYELİK PAKETLERİNİ İNCELE",
                        PrimaryButtonLink = "#packages",
                        SecondaryButtonText = "MOBİL UYGULAMAYI KEŞFET",
                        SecondaryButtonLink = "#app-section",
                        Items = new List<ContainerItemDto>
                        {
                            new ContainerItemDto { Id = 1, ExtraInfo = "1000m²", Title = "Ferah ve Hijyenik Antrenman Alanı" },
                            new ContainerItemDto { Id = 2, ExtraInfo = "80+", Title = "Profesyonel İzole & Serbest Ekipman" },
                            new ContainerItemDto { Id = 3, ExtraInfo = "15 Yıl", Title = "Kümülatif Antrenör ve Saha Deneyimi" },
                            new ContainerItemDto { Id = 4, ExtraInfo = "Kadınlara Özel", Title = "Haftada 3 Gün Bağımsız Seanslar" }
                        }
                    },
                    new SiteContainerDto
                    {
                        Id = "app-body-main",
                        Type = "APP_BODY",
                        Order = 2,
                        IsActive = true,
                        Title = "İNTERAKTİF ANTRENMAN & CEBİNDEKİ SPOR SALONU",
                        Subtitle = "Görsel anatomi haritasında çalıştırmak istediğin kas grubuna tıkla, antrenmanını anında keşfet!",
                        BadgeText = "N1FIT PRO MOBİL SİSTEMİ",
                        PrimaryButtonText = "HEMEN ÜYE GİRİŞİ YAP",
                        PrimaryButtonLink = "/login"
                    },
                    new SiteContainerDto
                    {
                        Id = "about-main",
                        Type = "ABOUT",
                        Order = 3,
                        IsActive = true,
                        Title = "BİZ KİMİZ?",
                        Subtitle = "N1FIT felsefesi: Disiplin, Bilim ve Kesintisiz Motivasyon.",
                        Description = "Düzce Gölyaka'da kurulan N1FIT Spor Merkezi, sporu sadece ağırlık kaldırmak olarak değil; doğru biyomekanik, sürdürülebilir beslenme ve sağlıklı bir yaşam biçimi olarak ele alır.",
                        BadgeText = "KULÜP FELSEFEMİZ",
                        Items = new List<ContainerItemDto>
                        {
                            new ContainerItemDto { Id = 1, Title = "Uzman Antrenör Kadrosu", Description = "Her hedefe uygun akademik temelli antrenman planlaması.", Tag = "Profesyonellik" },
                            new ContainerItemDto { Id = 2, Title = "Biyomekanik Ekipmanlar", Description = "Eklemleri koruyan, kasa maksimum gerilim veren istasyonlar.", Tag = "Güvenlik" },
                            new ContainerItemDto { Id = 3, Title = "Akıllı Beslenme Takibi", Description = "Mifflin-St Jeor bilimsel formülleriyle kalori ve makro hesabı.", Tag = "Bilimsellik" },
                            new ContainerItemDto { Id = 4, Title = "Özel Seanslar & Hijyen", Description = "Kadınlara özel bağımsız seanslar ve 7/24 havalandırmalı temiz ortam.", Tag = "Konfor" }
                        }
                    },
                    new SiteContainerDto
                    {
                        Id = "equipment-main",
                        Type = "EQUIPMENT_GALLERY",
                        Order = 4,
                        IsActive = true,
                        Title = "SALONUMUZ VE EKİPMANLARIMIZ",
                        Subtitle = "Hedeflerinize en kısa sürede ulaşmanız için titizlikle seçilmiş biyomekanik makineler ve serbest ağırlık parkuru.",
                        BadgeText = "PREMIUM EKİPMAN PARKURU",
                        GalleryPhotos = new List<string>
                        {
                            "/SalonunFotolari/Salon1.jpeg",
                            "/SalonunFotolari/Salon2.jpeg",
                            "/SalonunFotolari/Salon3.jpeg",
                            "/SalonunFotolari/Salon4.jpeg",
                            "/SalonunFotolari/Salon5.jpeg",
                            "/SalonunFotolari/Salon6.jpeg",
                            "/SalonunFotolari/Salon7.jpeg",
                            "/SalonunFotolari/Salon8.jpeg",
                            "/SalonunFotolari/Salon9.jpeg",
                            "/SalonunFotolari/Salon10.jpeg"
                        },
                        Items = new List<ContainerItemDto>
                        {
                            new ContainerItemDto { Id = 1, Title = "1.5 kg - 40 kg Tam Set Dumbell Parkuru", Description = "1.5 kg’dan 40 kg’a kadar çift istasyon tam set kauçuk dumbellar, ayarlanabilir profesyonel sehpalar.", Tag = "Serbest Ağırlık", ImageUrl = "/SalonunFotolari/Salon1.jpeg" },
                            new ContainerItemDto { Id = 2, Title = "Olimpik Biyomekanik Leg Press", Description = "45 derece açılı diz ve bel dostu lineer rulmanlı ağır bacak presi.", Tag = "Alt Gövde", ImageUrl = "/SalonunFotolari/Salon2.jpeg" },
                            new ContainerItemDto { Id = 3, Title = "Olimpik Power Rack & Squat Kafesi", Description = "Ayarlanabilir emniyet kolları ve çene çekme barı ile güvenli serbest squat istasyonu.", Tag = "Serbest Güç", ImageUrl = "/SalonunFotolari/Salon3.jpeg" },
                            new ContainerItemDto { Id = 4, Title = "Çok Fonksiyonlu Chest Press İstasyonu", Description = "Göğüs kaslarına doğrudan izole baskı uygulayan ayarlanabilir açılı pres mekanizması.", Tag = "İzole İstasyon", ImageUrl = "/SalonunFotolari/Salon4.jpeg" },
                            new ContainerItemDto { Id = 5, Title = "Yüksek Tempolu Koşu Bantları", Description = "Dokunmatik dijital göstergeli, eğim ve hız kontrollü profesyonel kardiyo parkuru.", Tag = "Kardiyo", ImageUrl = "/SalonunFotolari/Salon5.jpeg" },
                            new ContainerItemDto { Id = 6, Title = "Reformer & Grup Pilates Stüdyosu", Description = "Esneklik, core direnci ve postür düzeltmeye odaklı özel ekipmanlı stüdyo.", Tag = "Pilates Stüdyosu", ImageUrl = "/SalonunFotolari/Salon6.jpeg" },
                            new ContainerItemDto { Id = 7, Title = "Lat Pulldown & Kablo İstasyonları", Description = "Çok yönlü kablo açıları ve triceps/biceps çekiş mekanizmaları.", Tag = "Kablo Parkuru", ImageUrl = "/SalonunFotolari/Salon10.jpeg" }
                        }
                    },
                    new SiteContainerDto
                    {
                        Id = "hours-main",
                        Type = "HOURS",
                        Order = 5,
                        IsActive = true,
                        Title = "KADINLARA ÖZEL SAATLER & ÇALIŞMA DÜZENİ",
                        Subtitle = "Her üyemizin kendini rahat, özgür ve güvende hissederek spor yapabilmesi için titizlikle ayrılmış seanslar.",
                        BadgeText = "ÖZEL SEANSLAR & PROGRAM",
                        ShowWeeklyTable = true,
                        WeeklySchedule = GetDefaultWeeklySchedule(),
                        Items = new List<ContainerItemDto>
                        {
                            new ContainerItemDto
                            {
                                Id = 1,
                                Title = "Kadınlara Özel Bağımsız Seanslar",
                                Description = "Çarşamba (09:00-20:00), Cuma (18:00-23:00) ve Pazar (09:00-17:00) saatleri arasında salonumuz yalnızca kadın üyelerimize ve kadın eğitmenimize tahsis edilmektedir.",
                                Tag = "Çarşamba - Cuma - Pazar",
                                ExtraInfo = "Özel Seanslar"
                            },
                            new ContainerItemDto
                            {
                                Id = 2,
                                Title = "Genel Antrenman Saatleri",
                                Description = "Haftanın 7 günü sabahın erken saatlerinden geceye kadar dilediğiniz gibi antrenman yapabilirsiniz.",
                                Tag = "Pazartesi - Pazar",
                                ExtraInfo = "09:00 - 23:00"
                            }
                        }
                    },
                    new SiteContainerDto
                    {
                        Id = "packages-main",
                        Type = "PACKAGES",
                        Order = 6,
                        IsActive = true,
                        AutoSyncPackages = true,
                        Title = "ÜYELİK PAKETLERİ",
                        Subtitle = "Hedeflerinize ve bütçenize en uygun paketi seçin, antrenmana bugün başlayın.",
                        BadgeText = "ŞEFFAF FİYATLANDIRMA",
                        PrimaryButtonText = "HEMEN KAYDOL",
                        PrimaryButtonLink = "/login"
                    },
                    GetDefaultFaqContainer(7),
                    new SiteContainerDto
                    {
                        Id = "contact-main",
                        Type = "CONTACT",
                        Order = 8,
                        IsActive = true,
                        Title = "İLETİŞİM & LOKASYON",
                        Subtitle = "Sorularınız, kayıt detayları veya ücretsiz tanışma antrenmanı için bize dilediğiniz zaman ulaşabilirsiniz.",
                        BadgeText = "BİZE ULAŞIN",
                        Description = "Kültür, Yavuz Selim Sk. No:8, 81100 Gölyaka / Düzce",
                        PrimaryButtonText = "WhatsApp ile Mesaj At",
                        PrimaryButtonLink = "https://wa.me/905396078154",
                        SecondaryButtonText = "Haritada Göster",
                        SecondaryButtonLink = "https://maps.google.com"
                    }
                }
            };
        }

        // --- WEB BAŞVURULARI (LEAD HAVUZU) YÖNETİMİ ---
        public async Task<List<SiteLeadDto>> GetSiteLeadsAsync()
        {
            var filePath = GetSiteLeadsFilePath();
            try
            {
                if (File.Exists(filePath))
                {
                    var json = await File.ReadAllTextAsync(filePath);
                    var leads = JsonSerializer.Deserialize<List<SiteLeadDto>>(json, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });
                    if (leads != null)
                        return leads.OrderByDescending(l => l.CreatedAt).ToList();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error reading site leads: {ex.Message}");
            }
            return new List<SiteLeadDto>();
        }

        private async Task SaveSiteLeadsListAsync(List<SiteLeadDto> leads)
        {
            var filePath = GetSiteLeadsFilePath();
            var json = JsonSerializer.Serialize(leads, new JsonSerializerOptions { WriteIndented = true });
            await File.WriteAllTextAsync(filePath, json);
        }

        public async Task<SiteLeadDto> AddSiteLeadAsync(CreateSiteLeadDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.FullName) || string.IsNullOrWhiteSpace(dto.Phone))
                throw new ArgumentException("Ad Soyad ve Telefon Numarası zorunludur.");

            var leads = await GetSiteLeadsAsync();
            var newLead = new SiteLeadDto
            {
                Id = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                FullName = dto.FullName.Trim(),
                Phone = dto.Phone.Trim(),
                Goal = string.IsNullOrWhiteSpace(dto.Goal) ? "Genel Bilgi & Fiyat" : dto.Goal.Trim(),
                PreferredTime = string.IsNullOrWhiteSpace(dto.PreferredTime) ? "Farketmez" : dto.PreferredTime.Trim(),
                Note = dto.Note?.Trim() ?? string.Empty,
                Status = "Bekliyor",
                AdminNote = string.Empty,
                CreatedAt = DateTime.Now
            };

            leads.Insert(0, newLead);
            await SaveSiteLeadsListAsync(leads);
            return newLead;
        }

        public async Task<SiteLeadDto?> UpdateSiteLeadStatusAsync(long id, UpdateSiteLeadStatusDto dto)
        {
            var leads = await GetSiteLeadsAsync();
            var target = leads.FirstOrDefault(l => l.Id == id);
            if (target == null) return null;

            if (!string.IsNullOrWhiteSpace(dto.Status))
                target.Status = dto.Status.Trim();
            if (dto.AdminNote != null)
                target.AdminNote = dto.AdminNote.Trim();

            await SaveSiteLeadsListAsync(leads);
            return target;
        }

        public async Task<bool> DeleteSiteLeadAsync(long id)
        {
            var leads = await GetSiteLeadsAsync();
            var removed = leads.RemoveAll(l => l.Id == id);
            if (removed > 0)
            {
                await SaveSiteLeadsListAsync(leads);
                return true;
            }
            return false;
        }

        public async Task<int> SyncStandardMuscleGroupsAsync()
        {
            var exercises = await _exerciseRepository.GetAll().ToListAsync();
            int updatedCount = 0;

            foreach (var ex in exercises)
            {
                var name = (ex.Name ?? "").ToLower().Trim();
                var currentMg = (ex.MuscleGroup ?? "").Trim();
                string targetMg = currentMg;

                // 1. Trapez & Üst Sırt
                if (name.Contains("shrug") || name.Contains("upright row"))
                {
                    targetMg = "Trapez & Üst Sırt";
                }
                // 2. Arka Omuz (Rear Delts)
                else if (name.Contains("rear delt") || name.Contains("face pull"))
                {
                    targetMg = "Arka Omuz";
                }
                // 3. Kalça (Gluteus)
                else if (name.Contains("hip thurust") || name.Contains("hip thrust") || name.Contains("kickback") ||
                         name.Contains("sumo squat") || (name.Contains("bulgarian") && name.Contains("kalça")))
                {
                    targetMg = "Kalça (Gluteus)";
                }
                // 4. Kalf & Baldır
                else if (name.Contains("calf") || name.Contains("baldır"))
                {
                    targetMg = "Kalf & Baldır";
                }
                // 5. Arka Bacak (Hamstrings)
                else if (name.Contains("romain") || name.Contains("romanian") || name.Contains("leg curl") ||
                         (name.Contains("leg press") && (name.Contains("arka") || name.Contains("kalça"))))
                {
                    targetMg = "Arka Bacak (Hamstrings)";
                }
                // 6. Bel & Alt Sırt
                else if (name.Contains("deadlift") && !name.Contains("romain") && !name.Contains("romanian"))
                {
                    targetMg = "Bel & Alt Sırt";
                }
                // 7. Ön Bacak (Quadriceps) - Ayrıca Göğüs olarak hatalı kaydedilmiş Bulgarian Split Squat (Bacak) düzeltmesi
                else if (name.Contains("leg extension") || name.Contains("squat") || name.Contains("lunge") ||
                         name.Contains("step up") || (name.Contains("leg press") && !name.Contains("arka") && !name.Contains("kalça")))
                {
                    targetMg = "Ön Bacak (Quadriceps)";
                }
                // 8. Göğüs
                else if (currentMg.Contains("Göğüs") || currentMg.Contains("Gs") ||
                         name.Contains("chest") || name.Contains("bench") || name.Contains("pec deck") ||
                         name.Contains("crossover") || (name.Contains("fly") && !name.Contains("rear")) ||
                         (name.Contains("press") && (name.Contains("incline") || name.Contains("decline"))))
                {
                    targetMg = "Göğüs";
                }
                // 9. Omuz (Deltoids)
                else if (name.Contains("shoulder") || name.Contains("lateral") || name.Contains("arnold") ||
                         name.Contains("military") || name.Contains("front raise") || currentMg.Contains("Omuz"))
                {
                    targetMg = "Omuz";
                }
                // 10. Biceps (Ön Kol)
                else if (name.Contains("curl") || currentMg.Contains("Biceps") || currentMg.Contains("Ön Kol") || currentMg.Contains("n Kol"))
                {
                    targetMg = "Biceps (Ön Kol)";
                }
                // 11. Triceps (Arka Kol)
                else if (name.Contains("pushdown") || name.Contains("skull") || name.Contains("triceps") ||
                         (name.Contains("overhead") && name.Contains("extension")) || currentMg.Contains("Triceps") || currentMg.Contains("Arka Kol"))
                {
                    targetMg = "Triceps (Arka Kol)";
                }
                // 12. Sırt & Kanat
                else if (name.Contains("pulldown") || name.Contains("row") || name.Contains("pullover") ||
                         name.Contains("lat pull") || currentMg.Contains("Sırt") || currentMg.Contains("Srt"))
                {
                    targetMg = "Sırt & Kanat";
                }
                // 13. Karın (Abs & Core)
                else if (name.Contains("crunch") || name.Contains("plank") || name.Contains("knee raise") ||
                         name.Contains("leg raise") || name.Contains("rollout") || name.Contains("climbers") ||
                         name.Contains("dead bugs") || name.Contains("liftover") || currentMg.Contains("Karın") || currentMg.Contains("Karn") || currentMg.Contains("Abs"))
                {
                    targetMg = "Karın (Abs & Core)";
                }
                // 14. Kardiyo
                else if (name.Contains("koşu") || name.Contains("bisiklet") || name.Contains("ip atlama") || currentMg.Contains("Kardiyo"))
                {
                    targetMg = "Kardiyo";
                }

                if (ex.MuscleGroup != targetMg)
                {
                    ex.MuscleGroup = targetMg;
                    _exerciseRepository.Update(ex);
                    updatedCount++;
                }
            }

            if (updatedCount > 0)
            {
                await _unitOfWork.CommitAsync();
            }

            return updatedCount;
        }
    }
}
