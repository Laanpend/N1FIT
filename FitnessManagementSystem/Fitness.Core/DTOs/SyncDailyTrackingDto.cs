using System.Collections.Generic;

namespace Fitness.Core.DTOs
{
    public class SyncDailyTrackingDto
    {
        public string Date { get; set; } = string.Empty; // YYYY-MM-DD
        public int WaterGlasses { get; set; }
        public int ConsumedCalories { get; set; }
        public List<string>? CompletedMeals { get; set; }
    }

    public class DailyTrackingResponseDto
    {
        public string Date { get; set; } = string.Empty;
        public int WaterGlasses { get; set; }
        public int ConsumedCalories { get; set; }
        public List<string> CompletedMeals { get; set; } = new();
    }

    public class PushTestDto
    {
        public int? UserId { get; set; }
        public string Title { get; set; } = "N1FIT Bildirim Testi";
        public string Message { get; set; } = "Bu bir test bildirimidir.";
        public string? Url { get; set; } = "/app";
    }

    public class ReminderReportDto
    {
        public string ExecutionTime { get; set; } = string.Empty;
        public int TotalSubscribedMembers { get; set; }
        public int SentCount { get; set; }
        public List<string> Details { get; set; } = new();
    }
}
