using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Fitness.Service.Service; // JobService'in olduğu yeri kendi projene göre ekle dayı

namespace Fitness.API.Workers
{
    // Bu sınıf .NET'in arka planda sürekli çalışan otonom motorudur!
    public class CleanupWorker : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;

        public CleanupWorker(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            // Makine durdurulmadığı sürece bu döngü dönecek amq
            while (!stoppingToken.IsCancellationRequested)
            {
                using (var scope = _serviceProvider.CreateScope())
                {
                    // Şoförü (JobService) çağırıyoruz
                    var jobService = scope.ServiceProvider.GetRequiredService<JobService>();

                    try
                    {
                        // 3 ay muhabbetini temizleyen o metodu ateşle!
                        await jobService.ClearInactiveMembers();
                        Console.WriteLine("GECE OPERASYONU: 3 aylık pasif godoşlar SQL'den kazındı!");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Temizlik yaparken motor yaktık: {ex.Message}");
                    }
                }

                // Bekçi 24 saat uykuya dalar (İstersen bunu 1 saate de çekersin)
                await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
            }
        }
    }
}