using System;

namespace Fitness.Core.Entities
{
    public class DailyTrackingLog
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User? User { get; set; }

        public DateTime TrackingDate { get; set; }
        public int WaterGlasses { get; set; }
        public int ConsumedCalories { get; set; }
        public string? CompletedMealsJson { get; set; }
        public string? SentNotificationsJson { get; set; }

        public DateTime LastUpdated { get; set; } = DateTime.Now;
    }
}
