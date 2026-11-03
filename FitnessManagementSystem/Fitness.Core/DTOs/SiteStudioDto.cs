using System;
using System.Collections.Generic;

namespace Fitness.Core.DTOs
{
    public class ContainerItemDto
    {
        public long Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Subtitle { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public string Icon { get; set; } = string.Empty;
        public string Tag { get; set; } = string.Empty;
        public string ExtraInfo { get; set; } = string.Empty;
        public string ButtonText { get; set; } = string.Empty;
        public string ButtonLink { get; set; } = string.Empty;
    }

    public class SiteContainerDto
    {
        public string Id { get; set; } = string.Empty; // e.g. "hero-1", "before-after-1", "trainers-1"
        public string Type { get; set; } = string.Empty; // HERO, APP_BODY, EQUIPMENT_GALLERY, ABOUT, HOURS, PACKAGES, BANNER_CAMPAIGN, CONTACT, SPECIAL_CUSTOM, BEFORE_AFTER, REVIEWS, TRAINERS, COUNTDOWN_CAMPAIGN
        public string Title { get; set; } = string.Empty;
        public string Subtitle { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public int Order { get; set; } = 0;

        // Visual & Theme Settings
        public string BackgroundImage { get; set; } = string.Empty;
        public string BackgroundColor { get; set; } = string.Empty;
        public string BadgeText { get; set; } = string.Empty;

        // Layout Configuration for Special / Custom Container
        public string LayoutMode { get; set; } = "card_grid"; // "two_column", "card_grid", "full_text"
        public int Columns { get; set; } = 3; // 1, 2, 3, 4

        // Action Buttons
        public string PrimaryButtonText { get; set; } = string.Empty;
        public string PrimaryButtonLink { get; set; } = string.Empty;
        public string SecondaryButtonText { get; set; } = string.Empty;
        public string SecondaryButtonLink { get; set; } = string.Empty;

        // Sub-items for containers (e.g. Hero stats, Facility equipment cards, Special custom cards, Working hours, Reviews, Trainers, FAQ)
        public List<ContainerItemDto> Items { get; set; } = new();

        // Gallery / Multi-photo list for equipment or photo sliders
        public List<string> GalleryPhotos { get; set; } = new();

        // Equipment Slider Settings
        public bool ShowSlider { get; set; } = true;
        public string SliderPosition { get; set; } = "bottom";

        // Packages Auto Sync Setting
        public bool AutoSyncPackages { get; set; } = true;

        // Weekly Schedule Table for HOURS Container
        public bool ShowWeeklyTable { get; set; } = true;
        public List<WeeklyScheduleItemDto> WeeklySchedule { get; set; } = new();
    }

    public class WeeklyScheduleItemDto
    {
        public string DayName { get; set; } = string.Empty;
        public bool IsWomenDay { get; set; } = false;
        public string WomenOnlyHours { get; set; } = string.Empty;
        public string GeneralHours { get; set; } = "09:00 - 23:00";
        public string Note { get; set; } = string.Empty;
    }

    public class TopAnnouncementConfigDto
    {
        public bool Enabled { get; set; } = true;
        public string BadgeText { get; set; } = "DUYURU";
        public string Text { get; set; } = "🌸 Çarşamba, Cuma ve Pazar günleri Kadınlara Özel Bağımsız Seanslarımız devam ediyor! • 🎁 Ücretsiz vücut analizi ve tanışma antrenmanı için hemen ön kayıt formunu doldurun.";
        public bool ScrollingMarquee { get; set; } = false;
        public string BackgroundColor { get; set; } = "#141824";
        public string TextColor { get; set; } = "#ffffff";
        public string ButtonText { get; set; } = "Ön Kayıt Formu";
        public string ButtonLink { get; set; } = "#contact";
    }

    public class SiteLeadDto
    {
        public long Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Goal { get; set; } = string.Empty;
        public string PreferredTime { get; set; } = string.Empty;
        public string Note { get; set; } = string.Empty;
        public string Status { get; set; } = "Bekliyor"; // Bekliyor, Görüşüldü, Kayıt Oldu
        public string AdminNote { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }

    public class CreateSiteLeadDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Goal { get; set; } = string.Empty;
        public string PreferredTime { get; set; } = string.Empty;
        public string Note { get; set; } = string.Empty;
    }

    public class UpdateSiteLeadStatusDto
    {
        public string Status { get; set; } = "Görüşüldü";
        public string? AdminNote { get; set; }
    }

    public class CampaignPopupConfigDto
    {
        public bool Enabled { get; set; } = false;
        public string Title { get; set; } = "N1FIT'te Yeni Sezon Avantajları!";
        public string Subtitle { get; set; } = "Sınırlı Süreliğine Özel Fırsat";
        public string Description { get; set; } = "N1FIT'e şimdi katıl, kişiselleştirilmiş antrenman programı ve mobil uygulama erişimine anında sahip ol.";
        public string ImageUrl { get; set; } = string.Empty;
        public string BadgeText { get; set; } = "ÖZEL KAMPANYA";
        public string ButtonText { get; set; } = "Fırsatı İncele";
        public string ButtonLink { get; set; } = "#packages";
        public string SecondaryButtonText { get; set; } = "Kapat";
        public string ShowFrequency { get; set; } = "once_per_day"; // once_per_day, every_visit

        // Smart Scheduling
        public bool AutoSchedule { get; set; } = false;
        public string StartDate { get; set; } = string.Empty; // ISO string e.g. "2026-11-01T00:00"
        public string EndDate { get; set; } = string.Empty;   // ISO string e.g. "2026-11-30T23:59"
    }

    public class CountdownBannerConfigDto
    {
        public bool Enabled { get; set; } = false;
        public string BadgeText { get; set; } = "SINIRLI SÜRE";
        public string Title { get; set; } = "YENİ SEZON ERKEN KAYIT İNDİRİMİ";
        public string Subtitle { get; set; } = "Kontenjanlar dolmadan önce avantajlı üyelik fırsatını yakalayın!";
        public string TargetDate { get; set; } = "2026-12-01T23:59:59";
        public string ButtonText { get; set; } = "Fırsatı Yakala";
        public string ButtonLink { get; set; } = "#packages";
        public string BackgroundColor { get; set; } = "#990000";
    }

    public class DynamicGreetingConfigDto
    {
        public bool Enabled { get; set; } = true;
        public string MorningGreeting { get; set; } = "Güne Güçlü ve Enerjik Başla, Gölyaka!";
        public string AfternoonGreeting { get; set; } = "Günün Zirve Performansını Yakala!";
        public string EveningGreeting { get; set; } = "Günün Yorgunluğunu ve Stresini Salonda Bırak!";
        public string NightGreeting { get; set; } = "Yarın İçin Hazırlan, Hedeflerinden Asla Vazgeçme!";
    }

    public class SeoConfigDto
    {
        public string MetaTitle { get; set; } = "N1FIT Spor Merkezi | Gölyaka Fitness & Vücut Geliştirme";
        public string MetaDescription { get; set; } = "Bilimsel antrenman, profesyonel ekipmanlar, kadınlara özel seanslar ve 15 yıllık tecrübeyle Gölyaka'da fitness standartlarını yükseltiyoruz.";
        public string Keywords { get; set; } = "gölyaka spor salonu, düzce fitness, n1fit, vücut geliştirme, kadın seansları, kişisel antrenör";
        public string OgTitle { get; set; } = "N1FIT Spor Merkezi Gölyaka";
        public string OgDescription { get; set; } = "Bilimin, disiplinin ve 15 yıllık tecrübenin buluştuğu yer. Hemen keşfedin!";
        public string OgImageUrl { get; set; } = "/SalonunFotolari/Salon1.jpeg";
        public string CanonicalUrl { get; set; } = "https://n1fit.com.tr";
        public bool StructuredDataEnabled { get; set; } = true;
    }

    public class ThemeConfigDto
    {
        public string Preset { get; set; } = "red_power"; // "red_power", "gold_elite", "neon_cyber", "electric_blue", "emerald_fit", "custom"
        public string AccentColor { get; set; } = "#e50914"; // Primary accent hex
        public string AccentGlow { get; set; } = "rgba(229, 9, 20, 0.4)";
        public string BackgroundPattern { get; set; } = "carbon_fiber"; // "carbon_fiber", "mesh_grid", "radial_glow", "pure_dark"
        public string CornerStyle { get; set; } = "rounded"; // "rounded", "sharp", "pill"
        public string NavbarStyle { get; set; } = "blur_glass"; // "blur_glass", "solid_black"
    }

    public class BrandConfigDto
    {
        public string LogoUrl { get; set; } = "/favicon.png";
        public string BrandNamePrefix { get; set; } = "N1";
        public string BrandNameAccent { get; set; } = "FIT";
        public string DisplayMode { get; set; } = "logo_and_text"; // "logo_and_text", "logo_only", "text_only"
        public string InstagramUrl { get; set; } = "https://www.instagram.com/n1fitspormerkezi/";
        public string WhatsAppNumber { get; set; } = "905396078154";
        public string YouTubeUrl { get; set; } = "https://www.youtube.com/@N1F%C4%B0TSPORMERKEZ%C4%B0";

        // Floating WhatsApp Live Chat Widget
        public bool FloatingWhatsAppEnabled { get; set; } = true;
        public string FloatingWhatsAppText { get; set; } = "Canlı Destek & Fiyat Al";
        public string FloatingWhatsAppMessage { get; set; } = "Merhaba, N1FIT web sitesinden yazıyorum. Üyelik paketleri ve salon hakkında bilgi alabilir miyim?";
        public bool FloatingWhatsAppShowOnMobile { get; set; } = true;
    }

    public class SiteStudioConfigDto
    {
        public List<SiteContainerDto> Containers { get; set; } = new();
        public CampaignPopupConfigDto PopupConfig { get; set; } = new();
        public CountdownBannerConfigDto CountdownConfig { get; set; } = new();
        public TopAnnouncementConfigDto TopBarConfig { get; set; } = new();
        public DynamicGreetingConfigDto GreetingConfig { get; set; } = new();
        public SeoConfigDto SeoConfig { get; set; } = new();
        public ThemeConfigDto ThemeConfig { get; set; } = new();
        public BrandConfigDto BrandConfig { get; set; } = new();
        public List<SalonPhotoItemDto> AvailablePhotos { get; set; } = new();
    }

    public class PublicSiteStudioDto
    {
        public List<SiteContainerDto> Containers { get; set; } = new();
        public CampaignPopupConfigDto PopupConfig { get; set; } = new();
        public CountdownBannerConfigDto CountdownConfig { get; set; } = new();
        public TopAnnouncementConfigDto TopBarConfig { get; set; } = new();
        public DynamicGreetingConfigDto GreetingConfig { get; set; } = new();
        public SeoConfigDto SeoConfig { get; set; } = new();
        public ThemeConfigDto ThemeConfig { get; set; } = new();
        public BrandConfigDto BrandConfig { get; set; } = new();
    }
}
