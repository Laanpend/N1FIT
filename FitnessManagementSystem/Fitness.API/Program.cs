using Fitness.Core.Interfaces;
using Fitness.Data.Context;
using Fitness.Data.Repositories;
using Fitness.Data.UnitOfWork;
using Fitness.Service.Mapping;
using Fitness.Service.Service;
using Fitness.Service.Services;
using Hangfire;
using Hangfire.Dashboard;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<FitnessDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
builder.Services.AddAutoMapper(typeof(MapProfile));
builder.Services.AddScoped(typeof(IService<>), typeof(Service<>));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(opt =>
{
    var securityKey = builder.Configuration["TokenOptions:SecurityKey"] ?? string.Empty;
    opt.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["TokenOptions:Issuer"],
        ValidAudience = builder.Configuration["TokenOptions:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(securityKey))
    };
});

builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddScoped<IFinanceService, FinanceService>();
builder.Services.AddScoped<IFoodService, FoodService>();
builder.Services.AddScoped<IExerciseService, ExerciseService>();
builder.Services.AddScoped<IMeasurementService, MeasurementService>();
builder.Services.AddScoped<IWorkoutService, WorkoutService>();
builder.Services.AddScoped<ISmsService, NetgsmService>();
builder.Services.AddScoped<JobService>();
builder.Services.AddScoped<IMemberService, MemberService>();
builder.Services.AddHostedService<Fitness.API.Workers.CleanupWorker>();

builder.Services.AddHangfire(configuration => configuration
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UseSqlServerStorage(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddHangfireServer();

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "N1FIT API", Version = "v1" });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Örnek: 'Bearer [TOKEN]'",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                },
                Scheme = "oauth2",
                Name = "Bearer",
                In = ParameterLocation.Header
            },
            new List<string>()
        }
    });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.WithOrigins(
                "https://n1fit.com.tr",
                "https://www.n1fit.com.tr",
                "http://localhost:5173",
                "http://localhost:3000",
                "http://127.0.0.1:5173")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Mevcut veritabanında yeni eklenen opsiyonel ölçü sütunları (Kalça, Sağ Bacak, Sol Bacak) yoksa veri kaybı olmadan otomatik ekle
using (var scope = app.Services.CreateScope())
{
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<FitnessDbContext>();
        db.Database.ExecuteSqlRaw(@"
            IF COL_LENGTH('Measurements', 'Hips') IS NULL
                ALTER TABLE [Measurements] ADD [Hips] float NULL;
            IF COL_LENGTH('Measurements', 'RightLeg') IS NULL
                ALTER TABLE [Measurements] ADD [RightLeg] float NULL;
            IF COL_LENGTH('Measurements', 'LeftLeg') IS NULL
                ALTER TABLE [Measurements] ADD [LeftLeg] float NULL;
            IF COL_LENGTH('Users', 'Age') IS NULL
                ALTER TABLE [Users] ADD [Age] int NULL;
            IF COL_LENGTH('Users', 'Height') IS NULL
                ALTER TABLE [Users] ADD [Height] float NULL;
            IF COL_LENGTH('Users', 'Gender') IS NULL
                ALTER TABLE [Users] ADD [Gender] nvarchar(20) NULL;
            IF COL_LENGTH('Users', 'LastExpirySmsDate') IS NULL
                ALTER TABLE [Users] ADD [LastExpirySmsDate] datetime2 NULL;
            IF COL_LENGTH('Users', 'TargetCalories') IS NULL
                ALTER TABLE [Users] ADD [TargetCalories] int NULL;
            IF COL_LENGTH('DietPrograms', 'Calories') IS NULL
                ALTER TABLE [DietPrograms] ADD [Calories] int NULL;
            IF COL_LENGTH('MembershipPackages', 'ShowOnWebsite') IS NULL
                ALTER TABLE [MembershipPackages] ADD [ShowOnWebsite] bit NOT NULL DEFAULT 0;

            IF OBJECT_ID('Foods', 'U') IS NULL
            BEGIN
                CREATE TABLE [Foods] (
                    [Id] int IDENTITY(1,1) NOT NULL PRIMARY KEY,
                    [Name] nvarchar(250) NOT NULL,
                    [Brand] nvarchar(150) NULL,
                    [Category] nvarchar(100) NOT NULL DEFAULT 'Genel',
                    [CaloriesPer100g] float NOT NULL DEFAULT 0,
                    [ProteinPer100g] float NOT NULL DEFAULT 0,
                    [CarbsPer100g] float NOT NULL DEFAULT 0,
                    [FatPer100g] float NOT NULL DEFAULT 0,
                    [DefaultUnit] nvarchar(50) NOT NULL DEFAULT 'Gram',
                    [DefaultWeightGrams] float NOT NULL DEFAULT 100,
                    [Source] nvarchar(50) NOT NULL DEFAULT 'System',
                    [ExternalApiId] nvarchar(100) NULL,
                    [CreatedDate] datetime2 NOT NULL DEFAULT GETDATE()
                );
            END

            IF OBJECT_ID('DietMealFoods', 'U') IS NULL
            BEGIN
                CREATE TABLE [DietMealFoods] (
                    [Id] int IDENTITY(1,1) NOT NULL PRIMARY KEY,
                    [DietProgramId] int NOT NULL,
                    [FoodId] int NULL,
                    [FoodName] nvarchar(250) NOT NULL,
                    [Brand] nvarchar(150) NULL,
                    [Amount] float NOT NULL DEFAULT 100,
                    [Unit] nvarchar(50) NOT NULL DEFAULT 'Gram',
                    [CalculatedCalories] int NOT NULL DEFAULT 0,
                    [CalculatedProtein] float NOT NULL DEFAULT 0,
                    [CalculatedCarbs] float NOT NULL DEFAULT 0,
                    [CalculatedFat] float NOT NULL DEFAULT 0,
                    [CreatedDate] datetime2 NOT NULL DEFAULT GETDATE(),
                    CONSTRAINT [FK_DietMealFoods_DietPrograms_DietProgramId]
                        FOREIGN KEY ([DietProgramId]) REFERENCES [DietPrograms]([Id]) ON DELETE CASCADE
                );
            END

            IF OBJECT_ID('DailyTrackingLogs', 'U') IS NULL
            BEGIN
                CREATE TABLE [DailyTrackingLogs] (
                    [Id] int IDENTITY(1,1) NOT NULL PRIMARY KEY,
                    [UserId] int NOT NULL,
                    [TrackingDate] date NOT NULL,
                    [WaterGlasses] int NOT NULL DEFAULT 0,
                    [ConsumedCalories] int NOT NULL DEFAULT 0,
                    [CompletedMealsJson] nvarchar(max) NULL,
                    [SentNotificationsJson] nvarchar(max) NULL,
                    [LastUpdated] datetime2 NOT NULL DEFAULT GETDATE(),
                    CONSTRAINT [FK_DailyTrackingLogs_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users]([Id]) ON DELETE CASCADE
                );
                CREATE UNIQUE INDEX [IX_DailyTrackingLogs_UserId_TrackingDate] ON [DailyTrackingLogs] ([UserId], [TrackingDate]);
            END

            IF OBJECT_ID('Products', 'U') IS NULL
            BEGIN
                CREATE TABLE [Products] (
                    [Id] int IDENTITY(1,1) NOT NULL PRIMARY KEY,
                    [Name] nvarchar(250) NOT NULL,
                    [Category] nvarchar(100) NOT NULL DEFAULT 'İçecek',
                    [Barcode] nvarchar(100) NULL,
                    [BuyingPrice] decimal(18,2) NOT NULL DEFAULT 0,
                    [SellingPrice] decimal(18,2) NOT NULL DEFAULT 0,
                    [StockQuantity] int NOT NULL DEFAULT 0,
                    [MinStockAlert] int NOT NULL DEFAULT 5,
                    [ImageUrl] nvarchar(500) NULL,
                    [IsActive] bit NOT NULL DEFAULT 1,
                    [CreatedDate] datetime2 NOT NULL DEFAULT GETDATE()
                );
            END

            IF OBJECT_ID('Sales', 'U') IS NULL
            BEGIN
                CREATE TABLE [Sales] (
                    [Id] int IDENTITY(1,1) NOT NULL PRIMARY KEY,
                    [ReceiptNo] nvarchar(100) NOT NULL,
                    [TotalAmount] decimal(18,2) NOT NULL DEFAULT 0,
                    [TotalCost] decimal(18,2) NOT NULL DEFAULT 0,
                    [PaymentMethod] nvarchar(50) NOT NULL DEFAULT 'Cash',
                    [SaleDate] datetime2 NOT NULL DEFAULT GETDATE(),
                    [Note] nvarchar(500) NULL
                );
            END

            IF OBJECT_ID('SaleItems', 'U') IS NULL
            BEGIN
                CREATE TABLE [SaleItems] (
                    [Id] int IDENTITY(1,1) NOT NULL PRIMARY KEY,
                    [SaleId] int NOT NULL,
                    [ProductId] int NULL,
                    [ProductName] nvarchar(250) NOT NULL,
                    [Quantity] int NOT NULL DEFAULT 1,
                    [UnitBuyingPrice] decimal(18,2) NOT NULL DEFAULT 0,
                    [UnitPrice] decimal(18,2) NOT NULL DEFAULT 0,
                    [TotalPrice] decimal(18,2) NOT NULL DEFAULT 0,
                    CONSTRAINT [FK_SaleItems_Sales_SaleId] FOREIGN KEY ([SaleId]) REFERENCES [Sales]([Id]) ON DELETE CASCADE
                );
            END

            IF OBJECT_ID('Expenses', 'U') IS NULL
            BEGIN
                CREATE TABLE [Expenses] (
                    [Id] int IDENTITY(1,1) NOT NULL PRIMARY KEY,
                    [Title] nvarchar(250) NOT NULL,
                    [Category] nvarchar(100) NOT NULL DEFAULT 'Dükkan Gideri',
                    [Amount] decimal(18,2) NOT NULL DEFAULT 0,
                    [PaymentMethod] nvarchar(50) NOT NULL DEFAULT 'Cash',
                    [ExpenseDate] datetime2 NOT NULL DEFAULT GETDATE(),
                    [Description] nvarchar(max) NULL,
                    [LinkedProductId] int NULL,
                    [AddedStockQuantity] int NULL
                );
            END

            IF OBJECT_ID('PendingMembershipPayments', 'U') IS NULL
            BEGIN
                CREATE TABLE [PendingMembershipPayments] (
                    [Id] int IDENTITY(1,1) NOT NULL PRIMARY KEY,
                    [UserId] int NOT NULL,
                    [MemberFullName] nvarchar(250) NOT NULL,
                    [PackageId] int NULL,
                    [PackageName] nvarchar(250) NOT NULL,
                    [PaymentType] nvarchar(100) NOT NULL DEFAULT 'NewRegistration',
                    [Amount] decimal(18,2) NOT NULL DEFAULT 0,
                    [CreatedAt] datetime2 NOT NULL DEFAULT GETDATE(),
                    [Status] nvarchar(50) NOT NULL DEFAULT 'Pending',
                    [ConfirmedPaymentMethod] nvarchar(50) NULL,
                    [ProcessedAt] datetime2 NULL,
                    [Note] nvarchar(500) NULL
                );
            END

            IF OBJECT_ID('FinancialTransactions', 'U') IS NULL
            BEGIN
                CREATE TABLE [FinancialTransactions] (
                    [Id] int IDENTITY(1,1) NOT NULL PRIMARY KEY,
                    [TransactionType] nvarchar(50) NOT NULL DEFAULT 'Income',
                    [Source] nvarchar(100) NOT NULL DEFAULT 'StoreSale',
                    [Category] nvarchar(150) NOT NULL,
                    [Title] nvarchar(300) NOT NULL,
                    [Amount] decimal(18,2) NOT NULL DEFAULT 0,
                    [PaymentMethod] nvarchar(50) NOT NULL DEFAULT 'Cash',
                    [TransactionDate] datetime2 NOT NULL DEFAULT GETDATE(),
                    [Description] nvarchar(max) NULL,
                    [ReferenceId] int NULL
                );
            END

            -- POS ile yapılmış spor üyeliklerinin açıklamalarını %20 KDV ve Net tutar bilgisiyle güvenli güncelle
            UPDATE FinancialTransactions
            SET Description = 
                CASE 
                    WHEN Description IS NULL OR LTRIM(RTRIM(Description)) = '' 
                        THEN '[KDV %20: -' + CAST(ROUND(Amount * 0.20, 2) AS NVARCHAR(50)) + ' ₺ | Net: ' + CAST(ROUND(Amount * 0.80, 2) AS NVARCHAR(50)) + ' ₺]'
                    WHEN Description NOT LIKE '%KDV %20%' 
                        THEN LTRIM(RTRIM(Description)) + ' [KDV %20: -' + CAST(ROUND(Amount * 0.20, 2) AS NVARCHAR(50)) + ' ₺ | Net: ' + CAST(ROUND(Amount * 0.80, 2) AS NVARCHAR(50)) + ' ₺]'
                    ELSE Description
                END
            WHERE PaymentMethod = 'POS'
              AND (
                  Source = 'Membership'
                  OR Category LIKE '%Üyelik%' 
                  OR Category LIKE '%Spor%' 
                  OR Title LIKE '%Üyelik%' 
                  OR Title LIKE '%Paket%'
              );

            UPDATE PendingMembershipPayments
            SET Note = 
                CASE 
                    WHEN Note IS NULL OR LTRIM(RTRIM(Note)) = '' 
                        THEN '[KDV %20: -' + CAST(ROUND(Amount * 0.20, 2) AS NVARCHAR(50)) + ' ₺ | Net: ' + CAST(ROUND(Amount * 0.80, 2) AS NVARCHAR(50)) + ' ₺]'
                    WHEN Note NOT LIKE '%KDV %20%' 
                        THEN LTRIM(RTRIM(Note)) + ' [KDV %20: -' + CAST(ROUND(Amount * 0.20, 2) AS NVARCHAR(50)) + ' ₺ | Net: ' + CAST(ROUND(Amount * 0.80, 2) AS NVARCHAR(50)) + ' ₺]'
                    ELSE Note
                END
            WHERE (ConfirmedPaymentMethod = 'POS' OR ConfirmedPaymentMethod LIKE '%POS%')
              AND Status = 'Approved';
        ");

        var foodService = scope.ServiceProvider.GetRequiredService<IFoodService>();
        foodService.SeedDefaultFoodsAsync().GetAwaiter().GetResult();

        var financeService = scope.ServiceProvider.GetRequiredService<IFinanceService>();
        financeService.SeedDefaultProductsAsync().GetAwaiter().GetResult();
        financeService.SyncCurrentMonthMembershipsToPendingAsync().GetAwaiter().GetResult();

        var adminService = scope.ServiceProvider.GetRequiredService<IAdminService>();
        adminService.SyncStandardMuscleGroupsAsync().GetAwaiter().GetResult();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Veritabanı şema kontrolü uyarısı: {ex.Message}");
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseRouting();

// CORS her zaman ExceptionHandler ve Auth'dan önce çalışmalı ki hata durumunda da CORS başlıkları korunsun
app.UseCors("AllowAll");

var uploadsPath = Path.Combine(app.Environment.ContentRootPath, "uploads");
if (!Directory.Exists(uploadsPath))
{
    Directory.CreateDirectory(uploadsPath);
}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});

app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        var exceptionFeature = context.Features.Get<IExceptionHandlerFeature>();
        var exception = exceptionFeature?.Error;

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = exception switch
        {
            UnauthorizedAccessException => StatusCodes.Status401Unauthorized,
            KeyNotFoundException => StatusCodes.Status404NotFound,
            InvalidOperationException => StatusCodes.Status409Conflict,
            ArgumentException => StatusCodes.Status400BadRequest,
            _ => StatusCodes.Status500InternalServerError
        };

        var message = exception?.Message ?? "Sunucu tarafında beklenmeyen bir hata oluştu.";
        await context.Response.WriteAsJsonAsync(new { message });
    });
});

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.UseHangfireDashboard("/hangfire", new DashboardOptions
{
    Authorization = new[] { new HangfireDashboardAuthFilter() }
});

RecurringJob.AddOrUpdate<JobService>(
    "uyelik-bitis-bildirimi",
    service => service.CheckExpiringSubscriptions(),
    Cron.Daily(9)
);

RecurringJob.AddOrUpdate<JobService>(
    "pasif-uye-temizligi",
    service => service.ClearInactiveMembers(),
    Cron.Daily(3)
);

RecurringJob.AddOrUpdate<JobService>(
    "diyet-ve-su-bildirimleri",
    service => service.CheckDietAndWaterReminders(false),
    "*/15 * * * *"
);

app.Run();

public class HangfireDashboardAuthFilter : IDashboardAuthorizationFilter
{
    public bool Authorize(DashboardContext context)
    {
        var httpContext = context.GetHttpContext();

        var remoteIp = httpContext.Connection.RemoteIpAddress;
        if (remoteIp != null && System.Net.IPAddress.IsLoopback(remoteIp))
        {
            return true;
        }

        return httpContext.User?.Identity?.IsAuthenticated == true
            && httpContext.User.IsInRole("Admin");
    }
}
