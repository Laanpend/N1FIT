using Fitness.Core.Entities;
using Fitness.Core.Enums;
using Fitness.Core.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fitness.Service.Service
{
    public class JobService
    {
        private readonly IGenericRepository<User> _userRepository;
        private readonly IUnitOfWork _unitOfWork;

        public JobService(IGenericRepository<User> userRepository, IUnitOfWork unitOfWork)
        {
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
        }

        // Üyeliği bitenleri kontrol et ve (şimdilik) log at
        public async Task CheckExpiringSubscriptions()
        {
            var targetDate = DateTime.Now.AddDays(5).Date;
            var usersToNotify = await _userRepository
                .Where(x => x.SubscriptionEndDate.HasValue && x.SubscriptionEndDate.Value.Date == targetDate)
                .ToListAsync();

            foreach (var user in usersToNotify)
            {
                // Burada yarın bir gün SMS veya Mail metotlarını çağıracağız
                Console.WriteLine($"N1FIT BİLGİ: {user.FirstName} {user.LastName} üyeliği 5 gün sonra bitiyor!");
            }
        }

        // 3 ay boyunca pasif olan üyeleri sil
        public async Task ClearInactiveMembers()
        {
            var threeMonthsAgo = DateTime.Now.AddMonths(-3);
            var inactiveUsers = await _userRepository
                .Where(x => x.Role == UserRole.Member && x.CreatedDate < threeMonthsAgo && !x.IsActive)
                .ToListAsync();

            foreach (var user in inactiveUsers)
            {
                _userRepository.Remove(user);
            }
            await _unitOfWork.CommitAsync();
        }
    }
}
