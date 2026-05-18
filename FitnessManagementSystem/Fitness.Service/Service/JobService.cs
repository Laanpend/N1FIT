using AutoMapper.Execution;
using Fitness.Core.Entities;
using Fitness.Core.Enums;
using Fitness.Core.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WebPush;

namespace Fitness.Service.Service
{
    public class JobService
    {
        private readonly IGenericRepository<User> _userRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration _configuration;
        public JobService(IGenericRepository<User> userRepository, IUnitOfWork unitOfWork, IConfiguration configuration)
        {
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
            _configuration = configuration;
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
                if (!string.IsNullOrEmpty(user.PushEndpoint))
                {
                    var pushSubscription = new WebPush.PushSubscription(user.PushEndpoint, user.PushP256DH, user.PushAuth);
                    var vapidDetails = new WebPush.VapidDetails(
                        _configuration["VapidDetails:Subject"],
                        _configuration["VapidDetails:PublicKey"],
                        _configuration["VapidDetails:PrivateKey"]
                    );

                    var webPushClient = new WebPush.WebPushClient();
                    var payload = "{\"title\":\"AİDAT ZAMANI ASLANIM!\",\"message\":\"Paketinin süresi doluyor veya doldu. Kapıda rezil olma, gir aidatını öde!\",\"url\":\"/membership\"}";

                    try
                    {
                        webPushClient.SendNotification(pushSubscription, payload, vapidDetails);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Bildirim patladı amq: {ex.Message}");
                    }
                }
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
