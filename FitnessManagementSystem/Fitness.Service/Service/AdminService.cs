using AutoMapper;
using Fitness.Core.DTOs;
using Fitness.Core.DTOs.Fitness.Core.DTOs;
using Fitness.Core.Entities;
using Fitness.Core.Enums;
using Fitness.Core.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Fitness.Service.Service
{
    public class AdminService : IAdminService
    {
        private readonly IGenericRepository<User> _userRepository;
        // YENİ REPOYU BURAYA ÇAKTIK
        private readonly IGenericRepository<Measurement> _measurementRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly IGenericRepository<DietProgram> _dietRepository; // BUNU EKLE
        private readonly IGenericRepository<Exercise> _exerciseRepository; // BUNU EKLE
        private readonly IGenericRepository<MembershipPackage> _packageRepository;

        // Constructor (Yapıcı metot) içinde bunu bağlamayı unutma:
        // _packageRepository = packageRepository;

        // CONSTRUCTOR'A MEASUREMENT REPOSUNU EKLEDİK
        public AdminService(
            IGenericRepository<User> userRepository,
            IGenericRepository<DietProgram> dietRepository, // BUNU EKLE
            IGenericRepository<Measurement> measurementRepository,
            IGenericRepository<Exercise> exerciseRepository, // BUNU DA EKLE
            IGenericRepository<MembershipPackage> packageRepository,
            IUnitOfWork unitOfWork,
            IMapper mapper)
        {
            _userRepository = userRepository;
            _measurementRepository = measurementRepository;
            _dietRepository = dietRepository; // BUNU EKLE
            _exerciseRepository = exerciseRepository;
            _packageRepository = packageRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task AddMemberAsync(AdminAddMemberDto dto)
        {
            string passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);

            // 1. Önce adamın seçtiği paketin fiyatını SQL'den çekiyoruz
            decimal totalDebt = 0;
            if (dto.PackageId.HasValue)
            {
                var selectedPackage = await _packageRepository.GetByIdAsync(dto.PackageId.Value);
                if (selectedPackage != null)
                {
                    totalDebt = selectedPackage.Price; // Paketin fiyatı adamın borcu oldu
                }
            }

            // 2. Yeni üyeyi senin formatında ve yeni kolonlarla ayağa kaldırıyoruz
            var newMember = new User
            {
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Email = dto.Email,
                PasswordHash = passwordHash,
                Role = UserRole.Member,
                SubscriptionEndDate = dto.SubscriptionEndDate,
                IsActive = true,

                // YENİ DÖŞEDİĞİMİZ MUHASEBE VE İLETİŞİM BORULARI
                PhoneNumber = dto.PhoneNumber ?? "",
                MembershipStartDate = dto.MembershipStartDate ?? DateTime.Now,
                PackageId = dto.PackageId,
                TotalDebt = totalDebt,
                PaidAmount = dto.PaidAmount
            };

            await _userRepository.AddAsync(newMember);
            await _unitOfWork.CommitAsync();
        }

        public async Task<IEnumerable<MemberListDto>> GetAllMembersAsync()
        {
            // AsNoTracking çaktık, makine rahatladı
            var members = await _userRepository
                .Where(x => x.Role == UserRole.Member)
                .AsNoTracking()
                .ToListAsync();
            return _mapper.Map<IEnumerable<MemberListDto>>(members);
        }

        public async Task ToggleMemberStatusAsync(int id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user != null)
            {
                user.IsActive = !user.IsActive;
                await _unitOfWork.CommitAsync();
            }
        }

        public async Task<MemberProfileDto> GetMemberByIdAsync(int id)
        {
            // 1. INCLUDE FALAN YOK, adamı tertemiz çekiyoruz!
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) return null;

            // 2. Paketi kendi mekanından (Repository) manuel çekiyoruz. User.cs'yi bozmaya gerek yok!
            string packageName = "Paket Yok";
            if (user.PackageId.HasValue)
            {
                var package = await _packageRepository.GetByIdAsync(user.PackageId.Value);
                if (package != null) packageName = package.Name;
            }

            // 3. DTO'yu Dolduruyoruz
            var dto = new MemberProfileDto
            {
                FirstName = user.FirstName,
                LastName = user.LastName,
                PackageName = (await _packageRepository.GetByIdAsync(user.PackageId ?? 0))?.Name ?? "Paket Yok",
                MembershipStartDate = user.MembershipStartDate,
                SubscriptionEndDate = user.SubscriptionEndDate,
                IsFrozen = user.IsFrozen,
                DaysLeft = user.SubscriptionEndDate.HasValue ? (int)(user.SubscriptionEndDate.Value - DateTime.Now).TotalDays : 0
            };

            // 4. Diyet ve Ölçüleri çekip MAP'liyoruz
            var diets = await _dietRepository.Where(x => x.UserId == id).ToListAsync();
            dto.Diets = _mapper.Map<List<DietDto>>(diets);

            var measurements = await _measurementRepository.Where(x => x.UserId == id).OrderByDescending(x => x.RecordDate).ToListAsync();
            dto.Measurements = _mapper.Map<List<MeasurementDto>>(measurements);

            dto.Workouts = new List<ExerciseDto>();

            return dto;
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
                RecordDate = DateTime.Now
            };

            await _measurementRepository.AddAsync(measurement);
            await _unitOfWork.CommitAsync();
        }

        public async Task<IEnumerable<Measurement>> GetMeasurementsAsync(int userId)
        {
            // YİNE REPOSITORY ÜZERİNDEN ÇEKİYORUZ
            return await _measurementRepository
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.RecordDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<DietProgram>> GetDietProgramAsync(int userId)
        {
            // Adamın öğünlerini saate göre sıralayıp getiriyoruz
            return await _dietRepository
                .Where(x => x.UserId == userId)
                .OrderBy(x => x.Time)
                .ToListAsync();
        }

        public async Task AddMealAsync(int userId, DietDto dto)
        {
            var meal = new DietProgram
            {
                UserId = userId,
                MealName = dto.MealName,
                Time = dto.Time,
                Content = dto.Content,
                CreatedDate = DateTime.Now
            };

            await _dietRepository.AddAsync(meal);
            await _unitOfWork.CommitAsync();
        }

        public async Task UpdateMealAsync(int mealId, DietDto dto)
        {
            var meal = await _dietRepository.GetByIdAsync(mealId);
            if (meal != null)
            {
                meal.MealName = dto.MealName;
                meal.Time = dto.Time;
                meal.Content = dto.Content;
                await _unitOfWork.CommitAsync();
            }
        }

        public async Task DeleteMealAsync(int mealId)
        {
            var meal = await _dietRepository.GetByIdAsync(mealId);
            if (meal != null)
            {
                _dietRepository.Remove(meal); // Eğer senin repoda silme metodunun adı Delete ise Delete(meal) yap
                await _unitOfWork.CommitAsync();
            }
        }

        public async Task SaveDietProgramAsync(int userId, SaveDietProgramDto dto)
        {
            // 1. Eski öğünleri bul ve tek tek siktir et
            var oldMeals = await _dietRepository.Where(x => x.UserId == userId).ToListAsync();
            foreach (var meal in oldMeals)
            {
                _dietRepository.Remove(meal); // Eğer senin repoda metodun adı Delete ise Delete(meal) yap
            }

            // 2. Yeni öğünleri tek tek SQL'e zımbala
            if (dto.Meals != null && dto.Meals.Any())
            {
                foreach (var m in dto.Meals)
                {
                    var newMeal = new DietProgram
                    {
                        UserId = userId,
                        MealName = m.MealName ?? "İsimsiz Öğün",
                        Time = m.Time ?? "00:00",
                        Content = m.Content ?? "",
                        CreatedDate = DateTime.Now
                    };
                    await _dietRepository.AddAsync(newMeal);
                }
            }

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
                Description = e.Description ?? "",
                VideoUrl = e.VideoUrl ?? ""
            }).ToList();
        }

        public async Task AddExerciseAsync(ExerciseDto dto)
        {
            var newExercise = new Exercise
            {
                Name = dto.Name ?? "İsimsiz Hareket",
                MuscleGroup = dto.MuscleGroup ?? "Göğüs",
                Description = dto.Description ?? "",
                VideoUrl = dto.VideoUrl ?? "",
                // EĞER SQL TABLONDA ImageUrl DİYE BİR SÜTUN VARSA AŞAĞIDAKİNİ DE EKLE, BOŞ GİTSİN Kİ PATLAMASIN
                ImageUrl = ""
            };
            await _exerciseRepository.AddAsync(newExercise);
            await _unitOfWork.CommitAsync();
        }

        public async Task UpdateExerciseAsync(int id, ExerciseDto dto)
        {
            var exercise = await _exerciseRepository.GetByIdAsync(id);
            if (exercise != null)
            {
                exercise.Name = dto.Name ?? "İsimsiz Hareket";
                exercise.MuscleGroup = dto.MuscleGroup ?? "Göğüs";
                exercise.Description = dto.Description ?? "";
                exercise.VideoUrl = dto.VideoUrl ?? "";
                // exercise.ImageUrl = ""; // Gerekirse bunu da açarsın

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
            // Yeni paketi SQL'e saplıyoruz
            await _packageRepository.AddAsync(package);
            await _unitOfWork.CommitAsync();
        }

        public async Task UpdatePackageAsync(int id, MembershipPackage package)
        {
            // Önce eski paketi bul
            var existingPackage = await _packageRepository.GetByIdAsync(id);
            if (existingPackage != null)
            {
                // Yeni değerleri eskisinin üstüne çak
                existingPackage.Name = package.Name;
                existingPackage.Price = package.Price;
                existingPackage.DurationMonths = package.DurationMonths;

                _packageRepository.Update(existingPackage);
                await _unitOfWork.CommitAsync();
            }
        }

        public async Task DeletePackageAsync(int id)
        {
            // Paketi bul ve acımadan sil
            var existingPackage = await _packageRepository.GetByIdAsync(id);
            if (existingPackage != null)
            {
                _packageRepository.Remove(existingPackage);
                await _unitOfWork.CommitAsync();
            }
        }

        public async Task UpdateMemberAsync(int id, UpdateMemberDto dto)
        {
            // Adamı SQL'den ensesinden tutup getiriyoruz
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) throw new Exception("Böyle bir canavar dükkanda yok amq!");

            // Klasik bilgileri eskisinin üstüne çakıyoruz
            user.FirstName = dto.FirstName;
            user.LastName = dto.LastName;
            user.Email = dto.Email;
            user.PhoneNumber = dto.PhoneNumber;
            user.MembershipStartDate = dto.MembershipStartDate;
            user.SubscriptionEndDate = dto.SubscriptionEndDate;
            user.PaidAmount = dto.PaidAmount;

            // Eğer adam yeni bir paket seçtiyse borcunu (TotalDebt) ona göre kitliyoruz
            if (dto.PackageId.HasValue && user.PackageId != dto.PackageId)
            {
                user.PackageId = dto.PackageId;
                var package = await _packageRepository.GetByIdAsync(dto.PackageId.Value);
                if (package != null)
                {
                    user.TotalDebt = package.Price; // Yeni paketin fiyatını borç olarak yazdık
                }
            }

            // Adam formda şifre kısmına bir şey yazdıysa şifreyi de BCrypt ile kriptolayıp güncelliyoruz
            if (!string.IsNullOrEmpty(dto.Password))
            {
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
            }

            _userRepository.Update(user);
            await _unitOfWork.CommitAsync();
        }

        public async Task DeleteMemberAsync(int id)
        {
            // Adamı bul ve acımadan SQL'den kazı
            var user = await _userRepository.GetByIdAsync(id);
            if (user != null)
            {
                _userRepository.Remove(user);
                await _unitOfWork.CommitAsync();
            }
        }

        // AdminService.cs içine zımbala
        public async Task ToggleFreezeAsync(int id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) return;

            if (!user.IsFrozen)
            {
                // 1. DONDURMA İŞLEMİ: Adamı buzdolabına kaldırıyoruz
                user.IsFrozen = true;
                user.FreezeDate = DateTime.Now; // Dondurulduğu anı mühürle
            }
            else
            {
                // 2. ÇÖZME İŞLEMİ: İşte asıl matematik burada dönüyor amq
                user.IsFrozen = false;

                if (user.FreezeDate.HasValue && user.SubscriptionEndDate.HasValue)
                {
                    // Buzdolabında kaç gün geçmiş?
                    var frozenDuration = DateTime.Now - user.FreezeDate.Value;

                    // Bitiş tarihini, buzdolabında geçen süre kadar ileri fırlat!
                    user.SubscriptionEndDate = user.SubscriptionEndDate.Value.Add(frozenDuration);
                }

                // Çözüldüğü için FreezeDate'i temizle
                user.FreezeDate = null;
            }

            _userRepository.Update(user);
            await _unitOfWork.CommitAsync();
        }

        // AdminService.cs dosyasının içine bu metodu zımbala:
        public async Task<bool> DeleteMeasurementAsync(int id)
        {
            // Senin repository adın neyse onu kullan (Örn: _measurementRepository veya _context)
            var measurement = await _measurementRepository.GetByIdAsync(id);

            if (measurement == null)
                return false; // Öyle bir ölçü yoksa false dön

            _measurementRepository.Remove(measurement);
            await _unitOfWork.CommitAsync(); // Veritabanına fişi çektir

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

                _measurementRepository.Update(measurement);
                await _unitOfWork.CommitAsync();
            }
        }



    }
}