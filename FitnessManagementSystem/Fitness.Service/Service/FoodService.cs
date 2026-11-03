using AutoMapper;
using Fitness.Core.DTOs;
using Fitness.Core.Entities;
using Fitness.Core.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;

namespace Fitness.Service.Service
{
    public class FoodService : IFoodService
    {
        private readonly IGenericRepository<Food> _foodRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private static readonly HttpClient _httpClient = new HttpClient
        {
            Timeout = TimeSpan.FromSeconds(5)
        };

        static FoodService()
        {
            _httpClient.DefaultRequestHeaders.UserAgent.ParseAdd("N1FitGymApp/1.0 (https://n1fit.com.tr; info@n1fit.com.tr)");
        }

        public FoodService(
            IGenericRepository<Food> foodRepository,
            IUnitOfWork unitOfWork,
            IMapper mapper)
        {
            _foodRepository = foodRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task SeedDefaultFoodsAsync()
        {
            bool anySystemFood = await _foodRepository.Where(x => x.Source == "System").AnyAsync();
            if (anySystemFood) return;

            var seedFoods = new List<Food>
            {
                // ================= PROTEIN KAYNAKLARI =================
                new Food { Name = "Izgara Tavuk Göğsü (Pişmiş)", Brand = "Doğal", Category = "Protein", CaloriesPer100g = 165, ProteinPer100g = 31.0, CarbsPer100g = 0.0, FatPer100g = 3.6, DefaultUnit = "Gram", DefaultWeightGrams = 100, Source = "System" },
                new Food { Name = "Çiğ Tavuk Göğsü", Brand = "Doğal", Category = "Protein", CaloriesPer100g = 120, ProteinPer100g = 22.5, CarbsPer100g = 0.0, FatPer100g = 2.6, DefaultUnit = "Gram", DefaultWeightGrams = 100, Source = "System" },
                new Food { Name = "Haşlanmış Tam Yumurta", Brand = "Doğal", Category = "Protein", CaloriesPer100g = 155, ProteinPer100g = 12.6, CarbsPer100g = 1.1, FatPer100g = 10.6, DefaultUnit = "Adet (50g)", DefaultWeightGrams = 50, Source = "System" },
                new Food { Name = "Yumurta Beyazı (Haşlanmış)", Brand = "Doğal", Category = "Protein", CaloriesPer100g = 52, ProteinPer100g = 10.9, CarbsPer100g = 0.7, FatPer100g = 0.2, DefaultUnit = "Adet (33g)", DefaultWeightGrams = 33, Source = "System" },
                new Food { Name = "Yağsız Dana Kıyma (Pişmiş)", Brand = "Doğal", Category = "Protein", CaloriesPer100g = 215, ProteinPer100g = 26.1, CarbsPer100g = 0.0, FatPer100g = 11.8, DefaultUnit = "Gram", DefaultWeightGrams = 100, Source = "System" },
                new Food { Name = "Dana Bonfile / Antrikot (Izgara)", Brand = "Doğal", Category = "Protein", CaloriesPer100g = 227, ProteinPer100g = 27.3, CarbsPer100g = 0.0, FatPer100g = 12.4, DefaultUnit = "Gram", DefaultWeightGrams = 100, Source = "System" },
                new Food { Name = "Hindi Göğsü (Haşlama / Izgara)", Brand = "Doğal", Category = "Protein", CaloriesPer100g = 135, ProteinPer100g = 30.1, CarbsPer100g = 0.0, FatPer100g = 1.0, DefaultUnit = "Gram", DefaultWeightGrams = 100, Source = "System" },
                new Food { Name = "Hindi Füme", Brand = "Pınar / Polonez", Category = "Protein", CaloriesPer100g = 108, ProteinPer100g = 18.5, CarbsPer100g = 2.0, FatPer100g = 2.5, DefaultUnit = "Dilim (20g)", DefaultWeightGrams = 20, Source = "System" },
                new Food { Name = "Somon Balığı (Fırın / Izgara)", Brand = "Doğal", Category = "Protein", CaloriesPer100g = 208, ProteinPer100g = 20.4, CarbsPer100g = 0.0, FatPer100g = 13.4, DefaultUnit = "Gram", DefaultWeightGrams = 100, Source = "System" },
                new Food { Name = "Ton Balığı (Suda / Light)", Brand = "Dardanel", Category = "Protein", CaloriesPer100g = 116, ProteinPer100g = 25.5, CarbsPer100g = 0.0, FatPer100g = 0.8, DefaultUnit = "Kutu (80g)", DefaultWeightGrams = 80, Source = "System" },
                new Food { Name = "Ton Balığı (Zeytinyağlı Süzülmüş)", Brand = "Dardanel", Category = "Protein", CaloriesPer100g = 198, ProteinPer100g = 26.5, CarbsPer100g = 0.0, FatPer100g = 10.1, DefaultUnit = "Kutu (80g)", DefaultWeightGrams = 80, Source = "System" },
                new Food { Name = "Levrek / Çupra (Fırın / Izgara)", Brand = "Doğal", Category = "Protein", CaloriesPer100g = 124, ProteinPer100g = 23.6, CarbsPer100g = 0.0, FatPer100g = 2.6, DefaultUnit = "Gram", DefaultWeightGrams = 100, Source = "System" },
                new Food { Name = "Izgara Dana Köfte", Brand = "Ev Yapımı", Category = "Protein", CaloriesPer100g = 245, ProteinPer100g = 21.0, CarbsPer100g = 5.0, FatPer100g = 15.5, DefaultUnit = "Adet (35g)", DefaultWeightGrams = 35, Source = "System" },

                // ================= KARBONHİDRATLAR =================
                new Food { Name = "Yulaf Ezmesi (Sade)", Brand = "Eti Lifalif", Category = "Karbonhidrat", CaloriesPer100g = 367, ProteinPer100g = 13.2, CarbsPer100g = 60.5, FatPer100g = 6.2, DefaultUnit = "Gram", DefaultWeightGrams = 100, Source = "System" },
                new Food { Name = "Pirinç Pilavı (Pişmiş / Az Yağlı)", Brand = "Ev Yapımı", Category = "Karbonhidrat", CaloriesPer100g = 135, ProteinPer100g = 2.7, CarbsPer100g = 28.2, FatPer100g = 1.2, DefaultUnit = "Gram", DefaultWeightGrams = 100, Source = "System" },
                new Food { Name = "Basmati Pirinç (Çiğ Ağırlık)", Brand = "Yayla", Category = "Karbonhidrat", CaloriesPer100g = 352, ProteinPer100g = 8.5, CarbsPer100g = 77.5, FatPer100g = 0.6, DefaultUnit = "Gram", DefaultWeightGrams = 100, Source = "System" },
                new Food { Name = "Baldo / Yasemin Pirinç (Çiğ Ağırlık)", Brand = "Yayla", Category = "Karbonhidrat", CaloriesPer100g = 360, ProteinPer100g = 6.8, CarbsPer100g = 79.0, FatPer100g = 0.6, DefaultUnit = "Gram", DefaultWeightGrams = 100, Source = "System" },
                new Food { Name = "Bulgur Pilavı (Pişmiş)", Brand = "Ev Yapımı", Category = "Karbonhidrat", CaloriesPer100g = 115, ProteinPer100g = 3.5, CarbsPer100g = 21.5, FatPer100g = 1.5, DefaultUnit = "Gram", DefaultWeightGrams = 100, Source = "System" },
                new Food { Name = "Pilavlık Bulgur (Çiğ Ağırlık)", Brand = "Doğal", Category = "Karbonhidrat", CaloriesPer100g = 342, ProteinPer100g = 12.3, CarbsPer100g = 75.9, FatPer100g = 1.3, DefaultUnit = "Gram", DefaultWeightGrams = 100, Source = "System" },
                new Food { Name = "Haşlanmış Patates", Brand = "Doğal", Category = "Karbonhidrat", CaloriesPer100g = 87, ProteinPer100g = 1.9, CarbsPer100g = 20.1, FatPer100g = 0.1, DefaultUnit = "Gram", DefaultWeightGrams = 100, Source = "System" },
                new Food { Name = "Fırın Tatlı Patates", Brand = "Doğal", Category = "Karbonhidrat", CaloriesPer100g = 90, ProteinPer100g = 2.0, CarbsPer100g = 20.7, FatPer100g = 0.2, DefaultUnit = "Gram", DefaultWeightGrams = 100, Source = "System" },
                new Food { Name = "Tam Buğday Makarna (Pişmiş)", Brand = "Barilla / Filiz", Category = "Karbonhidrat", CaloriesPer100g = 131, ProteinPer100g = 5.3, CarbsPer100g = 26.5, FatPer100g = 1.1, DefaultUnit = "Gram", DefaultWeightGrams = 100, Source = "System" },
                new Food { Name = "Haşlanmış Makarna (Sade)", Brand = "Filiz", Category = "Karbonhidrat", CaloriesPer100g = 157, ProteinPer100g = 5.8, CarbsPer100g = 30.9, FatPer100g = 0.9, DefaultUnit = "Gram", DefaultWeightGrams = 100, Source = "System" },
                new Food { Name = "Tam Buğday Ekmeği", Brand = "Uno / Fırın", Category = "Karbonhidrat", CaloriesPer100g = 247, ProteinPer100g = 10.5, CarbsPer100g = 43.3, FatPer100g = 3.4, DefaultUnit = "Dilim (25g)", DefaultWeightGrams = 25, Source = "System" },
                new Food { Name = "Çavdar / Ekşi Mayalı Ekmek", Brand = "Fırın", Category = "Karbonhidrat", CaloriesPer100g = 259, ProteinPer100g = 8.5, CarbsPer100g = 48.3, FatPer100g = 3.3, DefaultUnit = "Dilim (25g)", DefaultWeightGrams = 25, Source = "System" },
                new Food { Name = "Pirinç Patlağı (Pirinç Kek)", Brand = "Vital / Eti", Category = "Karbonhidrat", CaloriesPer100g = 387, ProteinPer100g = 8.2, CarbsPer100g = 81.5, FatPer100g = 2.8, DefaultUnit = "Adet (9g)", DefaultWeightGrams = 9, Source = "System" },
                new Food { Name = "Pirinç Unu (Cream of Rice)", Brand = "Sporcu", Category = "Karbonhidrat", CaloriesPer100g = 366, ProteinPer100g = 6.0, CarbsPer100g = 80.1, FatPer100g = 1.4, DefaultUnit = "Gram", DefaultWeightGrams = 100, Source = "System" },
                new Food { Name = "Haşlanmış Nohut / Yeşil Mercimek", Brand = "Doğal", Category = "Karbonhidrat", CaloriesPer100g = 164, ProteinPer100g = 8.9, CarbsPer100g = 27.4, FatPer100g = 2.6, DefaultUnit = "Gram", DefaultWeightGrams = 100, Source = "System" },

                // ================= KAHVALTILIK & SÜT ÜRÜNLERİ =================
                new Food { Name = "Lor Peyniri (Yağsız / Kahvaltılık)", Brand = "Yörsan / Sütaş", Category = "Kahvaltılık", CaloriesPer100g = 98, ProteinPer100g = 17.5, CarbsPer100g = 3.2, FatPer100g = 1.5, DefaultUnit = "Gram", DefaultWeightGrams = 100, Source = "System" },
                new Food { Name = "Light Süzme Beyaz Peynir", Brand = "Sütaş / Pınar", Category = "Kahvaltılık", CaloriesPer100g = 155, ProteinPer100g = 16.0, CarbsPer100g = 3.5, FatPer100g = 8.5, DefaultUnit = "Dilim (30g)", DefaultWeightGrams = 30, Source = "System" },
                new Food { Name = "Tam Yağlı Beyaz Peynir", Brand = "Sütaş", Category = "Kahvaltılık", CaloriesPer100g = 265, ProteinPer100g = 17.2, CarbsPer100g = 2.5, FatPer100g = 21.0, DefaultUnit = "Dilim (30g)", DefaultWeightGrams = 30, Source = "System" },
                new Food { Name = "Taze Kaşar Peyniri", Brand = "Sütaş", Category = "Kahvaltılık", CaloriesPer100g = 353, ProteinPer100g = 24.5, CarbsPer100g = 2.1, FatPer100g = 27.5, DefaultUnit = "Dilim (20g)", DefaultWeightGrams = 20, Source = "System" },
                new Food { Name = "Yarım Yağlı Yoğurt", Brand = "Sütaş / Eker", Category = "Kahvaltılık", CaloriesPer100g = 61, ProteinPer100g = 4.3, CarbsPer100g = 5.2, FatPer100g = 2.2, DefaultUnit = "Kase (200g)", DefaultWeightGrams = 200, Source = "System" },
                new Food { Name = "Süzme Yoğurt", Brand = "Sütaş", Category = "Kahvaltılık", CaloriesPer100g = 115, ProteinPer100g = 8.5, CarbsPer100g = 4.8, FatPer100g = 6.8, DefaultUnit = "Gram", DefaultWeightGrams = 100, Source = "System" },
                new Food { Name = "Yarım Yağlı Süt / Laktozsuz Süt", Brand = "Pınar / İçim", Category = "Kahvaltılık", CaloriesPer100g = 47, ProteinPer100g = 3.3, CarbsPer100g = 4.8, FatPer100g = 1.5, DefaultUnit = "Bardak (200ml)", DefaultWeightGrams = 200, Source = "System" },
                new Food { Name = "Kefir (Sade)", Brand = "Altınkılıç / Eker", Category = "Kahvaltılık", CaloriesPer100g = 52, ProteinPer100g = 3.2, CarbsPer100g = 4.2, FatPer100g = 2.4, DefaultUnit = "Bardak (200ml)", DefaultWeightGrams = 200, Source = "System" },
                new Food { Name = "Siyah / Yeşil Zeytin", Brand = "Marmarabirlik", Category = "Kahvaltılık", CaloriesPer100g = 145, ProteinPer100g = 1.0, CarbsPer100g = 3.8, FatPer100g = 15.0, DefaultUnit = "Adet (4g)", DefaultWeightGrams = 4, Source = "System" },
                new Food { Name = "Süzme Çiçek Balı", Brand = "Balparmak", Category = "Kahvaltılık", CaloriesPer100g = 304, ProteinPer100g = 0.3, CarbsPer100g = 82.4, FatPer100g = 0.0, DefaultUnit = "Tatlı Kaşığı (10g)", DefaultWeightGrams = 10, Source = "System" },

                // ================= SAĞLIKLI YAĞLAR & KURUYEMİŞ =================
                new Food { Name = "Sızma Zeytinyağı", Brand = "Komili / Tariş", Category = "Sağlıklı Yağ", CaloriesPer100g = 884, ProteinPer100g = 0.0, CarbsPer100g = 0.0, FatPer100g = 100.0, DefaultUnit = "Yemek Kaşığı (10g)", DefaultWeightGrams = 10, Source = "System" },
                new Food { Name = "Doğal Fıstık Ezmesi (%100 Şekersiz)", Brand = "FitNut / Züber", Category = "Sağlıklı Yağ", CaloriesPer100g = 588, ProteinPer100g = 25.8, CarbsPer100g = 19.6, FatPer100g = 50.4, DefaultUnit = "Tatlı Kaşığı (15g)", DefaultWeightGrams = 15, Source = "System" },
                new Food { Name = "Çiğ Badem", Brand = "Tadım / Peyman", Category = "Sağlıklı Yağ", CaloriesPer100g = 579, ProteinPer100g = 21.2, CarbsPer100g = 21.6, FatPer100g = 49.9, DefaultUnit = "Adet (1.2g)", DefaultWeightGrams = 1.2, Source = "System" },
                new Food { Name = "Ceviz İçi", Brand = "Doğal", Category = "Sağlıklı Yağ", CaloriesPer100g = 654, ProteinPer100g = 15.2, CarbsPer100g = 13.7, FatPer100g = 65.2, DefaultUnit = "Tam Adet (5g)", DefaultWeightGrams = 5, Source = "System" },
                new Food { Name = "Çiğ Fındık", Brand = "Doğal", Category = "Sağlıklı Yağ", CaloriesPer100g = 628, ProteinPer100g = 15.0, CarbsPer100g = 16.7, FatPer100g = 60.8, DefaultUnit = "Gram", DefaultWeightGrams = 100, Source = "System" },
                new Food { Name = "Avokado", Brand = "Doğal", Category = "Sağlıklı Yağ", CaloriesPer100g = 160, ProteinPer100g = 2.0, CarbsPer100g = 8.5, FatPer100g = 14.7, DefaultUnit = "Yarım Adet (75g)", DefaultWeightGrams = 75, Source = "System" },
                new Food { Name = "Chia / Keten Tohumu", Brand = "Doğal", Category = "Sağlıklı Yağ", CaloriesPer100g = 486, ProteinPer100g = 16.5, CarbsPer100g = 42.1, FatPer100g = 30.7, DefaultUnit = "Yemek Kaşığı (10g)", DefaultWeightGrams = 10, Source = "System" },
                new Food { Name = "Bitter Çikolata (%80 Kakao)", Brand = "Eti / Lindt", Category = "Sağlıklı Yağ", CaloriesPer100g = 598, ProteinPer100g = 7.8, CarbsPer100g = 45.9, FatPer100g = 42.6, DefaultUnit = "Kare (10g)", DefaultWeightGrams = 10, Source = "System" },

                // ================= MEYVE & SEBZE =================
                new Food { Name = "Muz (Orta Boy)", Brand = "Doğal", Category = "Meyve & Sebze", CaloriesPer100g = 89, ProteinPer100g = 1.1, CarbsPer100g = 22.8, FatPer100g = 0.3, DefaultUnit = "Adet (115g)", DefaultWeightGrams = 115, Source = "System" },
                new Food { Name = "Yeşil / Kırmızı Elma", Brand = "Doğal", Category = "Meyve & Sebze", CaloriesPer100g = 52, ProteinPer100g = 0.3, CarbsPer100g = 13.8, FatPer100g = 0.2, DefaultUnit = "Adet (150g)", DefaultWeightGrams = 150, Source = "System" },
                new Food { Name = "Çilek / Yaban Mersini", Brand = "Doğal", Category = "Meyve & Sebze", CaloriesPer100g = 35, ProteinPer100g = 0.7, CarbsPer100g = 8.0, FatPer100g = 0.3, DefaultUnit = "Gram", DefaultWeightGrams = 100, Source = "System" },
                new Food { Name = "Ananas", Brand = "Doğal", Category = "Meyve & Sebze", CaloriesPer100g = 50, ProteinPer100g = 0.5, CarbsPer100g = 13.1, FatPer100g = 0.1, DefaultUnit = "Dilim (80g)", DefaultWeightGrams = 80, Source = "System" },
                new Food { Name = "Haşlanmış Brokoli / Karnabahar", Brand = "Doğal", Category = "Meyve & Sebze", CaloriesPer100g = 35, ProteinPer100g = 2.4, CarbsPer100g = 7.2, FatPer100g = 0.4, DefaultUnit = "Gram", DefaultWeightGrams = 100, Source = "System" },
                new Food { Name = "Yeşil Mevsim Salata (Yağsız)", Brand = "Doğal", Category = "Meyve & Sebze", CaloriesPer100g = 20, ProteinPer100g = 1.2, CarbsPer100g = 3.6, FatPer100g = 0.2, DefaultUnit = "Kase (150g)", DefaultWeightGrams = 150, Source = "System" },
                new Food { Name = "Domates & Salatalık Söğüş", Brand = "Doğal", Category = "Meyve & Sebze", CaloriesPer100g = 18, ProteinPer100g = 0.8, CarbsPer100g = 3.8, FatPer100g = 0.2, DefaultUnit = "Porsiyon (150g)", DefaultWeightGrams = 150, Source = "System" },
                new Food { Name = "Kabak / Ispanak Sote", Brand = "Ev Yapımı", Category = "Meyve & Sebze", CaloriesPer100g = 55, ProteinPer100g = 2.6, CarbsPer100g = 5.5, FatPer100g = 2.5, DefaultUnit = "Gram", DefaultWeightGrams = 100, Source = "System" },

                // ================= SUPPLEMENT & SPORCU ÜRÜNLERİ =================
                new Food { Name = "Whey Protein Tozu", Brand = "Hardline / HIQ / BigJoy", Category = "Supplement", CaloriesPer100g = 390, ProteinPer100g = 78.0, CarbsPer100g = 6.5, FatPer100g = 5.2, DefaultUnit = "Ölçek (30g)", DefaultWeightGrams = 30, Source = "System" },
                new Food { Name = "İzole Whey Protein (Iso Whey)", Brand = "Weider / Optimum", Category = "Supplement", CaloriesPer100g = 370, ProteinPer100g = 86.0, CarbsPer100g = 2.5, FatPer100g = 1.2, DefaultUnit = "Ölçek (30g)", DefaultWeightGrams = 30, Source = "System" },
                new Food { Name = "Kazein Protein Tozu", Brand = "Sporcu", Category = "Supplement", CaloriesPer100g = 365, ProteinPer100g = 76.0, CarbsPer100g = 7.0, FatPer100g = 3.5, DefaultUnit = "Ölçek (30g)", DefaultWeightGrams = 30, Source = "System" },
                new Food { Name = "Proteinli Süt (Yüksek Proteinli)", Brand = "Pınar Protein", Category = "Supplement", CaloriesPer100g = 52, ProteinPer100g = 6.0, CarbsPer100g = 5.0, FatPer100g = 0.8, DefaultUnit = "Şişe (500ml)", DefaultWeightGrams = 500, Source = "System" },
                new Food { Name = "Protein Bar (Şekersiz)", Brand = "Züber / Fellas", Category = "Supplement", CaloriesPer100g = 350, ProteinPer100g = 33.0, CarbsPer100g = 32.0, FatPer100g = 10.0, DefaultUnit = "Adet (45g)", DefaultWeightGrams = 45, Source = "System" }
            };

            foreach (var food in seedFoods)
            {
                await _foodRepository.AddAsync(food);
            }

            await _unitOfWork.CommitAsync();
        }

        public async Task<List<FoodDto>> SearchFoodsAsync(string? query, string? category = null, bool includeExternalApi = false)
        {
            await SeedDefaultFoodsAsync();

            var dbQuery = _foodRepository.GetAll().AsNoTracking();

            if (!string.IsNullOrWhiteSpace(category) && category != "Tümü")
            {
                dbQuery = dbQuery.Where(f => f.Category == category);
            }

            string cleanQ = query?.Trim() ?? string.Empty;
            if (!string.IsNullOrWhiteSpace(cleanQ))
            {
                string lowerQ = cleanQ.ToLower();
                dbQuery = dbQuery.Where(f =>
                    f.Name.ToLower().Contains(lowerQ) ||
                    (f.Brand != null && f.Brand.ToLower().Contains(lowerQ)) ||
                    f.Category.ToLower().Contains(lowerQ));
            }

            var localFoods = await dbQuery
                .OrderBy(f => f.Source == "System" ? 0 : 1)
                .ThenBy(f => f.Name)
                .Take(40)
                .ToListAsync();

            var results = _mapper.Map<List<FoodDto>>(localFoods);

            // Eğer kullanıcı "İnternetten Ara (Open Food Facts)" seçtiyse veya yerel sonuç azsa dış API'den tamamla
            if ((includeExternalApi || results.Count < 3) && cleanQ.Length >= 2)
            {
                var externalFoods = await FetchFromOpenFoodFactsAsync(cleanQ);
                foreach (var ext in externalFoods)
                {
                    bool alreadyExists = results.Any(r =>
                        (!string.IsNullOrEmpty(r.ExternalApiId) && r.ExternalApiId == ext.ExternalApiId) ||
                        string.Equals(r.Name, ext.Name, StringComparison.OrdinalIgnoreCase));

                    if (!alreadyExists)
                    {
                        results.Add(ext);
                    }
                }
            }

            return results;
        }

        private async Task<List<FoodDto>> FetchFromOpenFoodFactsAsync(string query)
        {
            var list = new List<FoodDto>();
            try
            {
                string url = $"https://search.openfoodfacts.org/search?q={Uri.EscapeDataString(query)}&fields=code,product_name,brands,nutriments&page_size=12";
                var response = await _httpClient.GetAsync(url);
                if (!response.IsSuccessStatusCode) return list;

                var json = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(json);

                if (!doc.RootElement.TryGetProperty("hits", out var hits) || hits.ValueKind != JsonValueKind.Array)
                    return list;

                foreach (var hit in hits.EnumerateArray())
                {
                    string name = hit.TryGetProperty("product_name", out var pn) && pn.ValueKind == JsonValueKind.String
                        ? pn.GetString()?.Trim() ?? ""
                        : "";

                    if (string.IsNullOrWhiteSpace(name)) continue;

                    string? brand = null;
                    if (hit.TryGetProperty("brands", out var br))
                    {
                        if (br.ValueKind == JsonValueKind.Array && br.GetArrayLength() > 0)
                            brand = br[0].GetString();
                        else if (br.ValueKind == JsonValueKind.String)
                            brand = br.GetString();
                    }

                    string? code = hit.TryGetProperty("code", out var cd) && cd.ValueKind == JsonValueKind.String
                        ? cd.GetString()
                        : null;

                    if (!hit.TryGetProperty("nutriments", out var nutr) || nutr.ValueKind != JsonValueKind.Object)
                        continue;

                    double kcal = ReadDouble(nutr, "energy-kcal_100g") ?? ReadDouble(nutr, "energy-kcal") ?? 0;
                    if (kcal <= 0) continue; // Kalori verisi olmayan eksik kayıtları atla

                    double protein = ReadDouble(nutr, "proteins_100g") ?? ReadDouble(nutr, "proteins") ?? 0;
                    double carbs = ReadDouble(nutr, "carbohydrates_100g") ?? ReadDouble(nutr, "carbohydrates") ?? 0;
                    double fat = ReadDouble(nutr, "fat_100g") ?? ReadDouble(nutr, "fat") ?? 0;

                    list.Add(new FoodDto
                    {
                        Id = 0, // Henüz yerel DB'ye kaydedilmedi
                        Name = name,
                        Brand = string.IsNullOrWhiteSpace(brand) ? "Open Food Facts" : brand,
                        Category = "Markalı / Paketli",
                        CaloriesPer100g = Math.Round(kcal, 1),
                        ProteinPer100g = Math.Round(protein, 1),
                        CarbsPer100g = Math.Round(carbs, 1),
                        FatPer100g = Math.Round(fat, 1),
                        DefaultUnit = "Gram",
                        DefaultWeightGrams = 100,
                        Source = "OpenFoodFacts",
                        ExternalApiId = code
                    });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Open Food Facts arama uyarısı: {ex.Message}");
            }

            return list;
        }

        private static double? ReadDouble(JsonElement obj, string propName)
        {
            if (!obj.TryGetProperty(propName, out var el)) return null;
            if (el.ValueKind == JsonValueKind.Number && el.TryGetDouble(out double d)) return d;
            if (el.ValueKind == JsonValueKind.String && double.TryParse(el.GetString(), System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out double ds)) return ds;
            return null;
        }

        public async Task<FoodDto> CreateOrCacheFoodAsync(FoodDto dto)
        {
            if (dto.Id > 0)
            {
                var byId = await _foodRepository.GetByIdAsync(dto.Id);
                if (byId != null) return _mapper.Map<FoodDto>(byId);
            }

            if (!string.IsNullOrWhiteSpace(dto.ExternalApiId))
            {
                var existingByCode = await _foodRepository
                    .Where(f => f.ExternalApiId == dto.ExternalApiId)
                    .FirstOrDefaultAsync();
                if (existingByCode != null) return _mapper.Map<FoodDto>(existingByCode);
            }

            var normName = (dto.Name ?? "").Trim();
            if (!string.IsNullOrEmpty(normName))
            {
                var existingByName = await _foodRepository
                    .Where(f => f.Name.ToLower() == normName.ToLower())
                    .FirstOrDefaultAsync();
                if (existingByName != null) return _mapper.Map<FoodDto>(existingByName);
            }

            var newFood = new Food
            {
                Name = string.IsNullOrWhiteSpace(normName) ? "Özel Besin" : normName,
                Brand = string.IsNullOrWhiteSpace(dto.Brand) ? "Genel" : dto.Brand.Trim(),
                Category = string.IsNullOrWhiteSpace(dto.Category) ? "Genel" : dto.Category.Trim(),
                CaloriesPer100g = Math.Max(0, dto.CaloriesPer100g),
                ProteinPer100g = Math.Max(0, dto.ProteinPer100g),
                CarbsPer100g = Math.Max(0, dto.CarbsPer100g),
                FatPer100g = Math.Max(0, dto.FatPer100g),
                DefaultUnit = string.IsNullOrWhiteSpace(dto.DefaultUnit) ? "Gram" : dto.DefaultUnit.Trim(),
                DefaultWeightGrams = dto.DefaultWeightGrams > 0 ? dto.DefaultWeightGrams : 100,
                Source = dto.Source == "OpenFoodFacts" ? "Cached_OFF" : "Custom",
                ExternalApiId = dto.ExternalApiId,
                CreatedDate = DateTime.Now
            };

            await _foodRepository.AddAsync(newFood);
            await _unitOfWork.CommitAsync();

            return _mapper.Map<FoodDto>(newFood);
        }
    }
}
