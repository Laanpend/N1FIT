using System.Collections.Generic;

namespace Fitness.Core.DTOs
{
    public class FacilityCardDto
    {
        public long Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Desc { get; set; } = string.Empty;
        public string Cat { get; set; } = "machines"; // free, machines, cardio, pilates
        public string Tag { get; set; } = string.Empty;
        public string Img { get; set; } = string.Empty;
        public bool IsVisible { get; set; } = true;
        public int DisplayOrder { get; set; }
    }

    public class FacilityPhotoDto
    {
        public long Id { get; set; }
        public string Img { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Subtitle { get; set; } = string.Empty;
        public bool IsVisible { get; set; } = true;
        public int DisplayOrder { get; set; }
    }

    public class SalonPhotoItemDto
    {
        public long Id { get; set; }
        public string Url { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public bool IsDefault { get; set; } = false;
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    }

    public class FacilityConfigDto
    {
        public List<FacilityCardDto> EquipmentCards { get; set; } = new();
        public List<FacilityPhotoDto> GalleryPhotos { get; set; } = new();
        public List<SalonPhotoItemDto> AvailablePhotos { get; set; } = new();
    }

    public class DeletePhotoDto
    {
        public string Url { get; set; } = string.Empty;
    }
}
