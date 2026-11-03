using Fitness.Service.Service;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Fitness.API.Workers
{
    public class CleanupWorker : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<CleanupWorker> _logger;
        private DateTime _lastDailyRun = DateTime.MinValue;

        public CleanupWorker(IServiceProvider serviceProvider, ILogger<CleanupWorker> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using (var scope = _serviceProvider.CreateScope())
                    {
                        var jobService = scope.ServiceProvider.GetRequiredService<JobService>();

                        // 1. Akıllı Diyet, Su ve Öğün Bildirim Kontrolü (Her 15 dakikada bir pencereleri denetler)
                        try
                        {
                            var report = await jobService.CheckDietAndWaterReminders();
                            if (report.SentCount > 0)
                            {
                                _logger.LogInformation("N1FIT Bildirim Dağıtımı: {SentCount} üyeye bildirim iletildi.", report.SentCount);
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Diyet ve su bildirimleri kontrol edilirken hata oluştu.");
                        }

                        // 2. Günde 1-2 kez çalışan genel temizlik ve üyelik bitiş kontrolleri
                        var now = DateTime.UtcNow;
                        if ((now - _lastDailyRun).TotalHours >= 12)
                        {
                            _lastDailyRun = now;
                            try
                            {
                                await jobService.ClearInactiveMembers();
                            }
                            catch (Exception ex)
                            {
                                _logger.LogError(ex, "Pasif üyelerin temizliği sırasında hata oluştu.");
                            }

                            try
                            {
                                await jobService.CheckExpiringSubscriptions();
                            }
                            catch (Exception ex)
                            {
                                _logger.LogError(ex, "Üyelik bitişi yaklaşan üyelere SMS/bildirim gönderimi sırasında hata oluştu.");
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "CleanupWorker ana döngüsünde beklenmeyen hata oluştu.");
                }

                // 15 dakika sonra sonraki periyodu kontrol et
                await Task.Delay(TimeSpan.FromMinutes(15), stoppingToken);
            }
        }
    }
}
