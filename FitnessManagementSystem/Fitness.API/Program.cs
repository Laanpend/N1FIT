using Fitness.Core.Interfaces;
using Fitness.Data.Context;
using Fitness.Data.Repositories;
using Fitness.Data.UnitOfWork;
using Fitness.Service.Mapping;
using Fitness.Service.Service;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Fitness.Service.Services;
using Microsoft.OpenApi.Models;
using Hangfire;
using Fitness.Core.Entities;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddDbContext<FitnessDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
// AutoMapper Kaydý
builder.Services.AddAutoMapper(typeof(MapProfile));
// Service Kaydý
builder.Services.AddScoped(typeof(IService<>), typeof(Service<>));

builder.Services.AddScoped<IGenericRepository<MembershipPackage>, GenericRepository<MembershipPackage>>();


builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(opt =>
{
    opt.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["TokenOptions:Issuer"],
        ValidAudience = builder.Configuration["TokenOptions:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["TokenOptions:SecurityKey"]))
    };
});

builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddScoped<IExerciseService, ExerciseService>();
builder.Services.AddScoped<IMeasurementService, MeasurementService>();
builder.Services.AddScoped<IWorkoutService, WorkoutService>();
builder.Services.AddScoped<JobService>();
builder.Services.AddScoped<IMemberService, MemberService>();
builder.Services.AddHostedService<Fitness.API.Workers.CleanupWorker>();


builder.Services.AddHangfire(configuration => configuration
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UseSqlServerStorage(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddHangfireServer();
// Add services to the container.

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // C#'a diyoruz ki: "Ayný veriyi tekrar tekrar kendi içinde döndürme amq, bir kere ver çýk!"
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "N1FIT API", Version = "v1" });

    // Swagger'a JWT Bearer giriþini tanýmlýyoruz
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Örnek: 'Bearer [SENÝN_TOKENIN]'",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement()
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
                In = ParameterLocation.Header,
            },
            new List<string>()
        }
    });
});
// builder.Build()'dan önce ekle
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin() // Þimdilik her yere izin ver, sunucuya çýkarken kýsýtlarýz
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});


var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// 1. ÞASE: BUNU YORUMA AL! Ngrok kullanýrken bu açýk kalýrsa trafiði siktir edip 502 yedirtir!
// app.UseHttpsRedirection(); 

app.UseRouting();

// CORS ÝZNÝ KESÝNLÝKLE BURADA OLACAK
app.UseCors("AllowAll");

// 2. ÞASE: AHA BU MERMÝYÝ SÝLMÝÞSÝN AMQ! BUNU EKLEMEZSEN TOKEN KONTROLÜ ÇALIÞMAZ!
app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();
app.UseHangfireDashboard();

// ... gerisi ayný (Hangfire joblarý vs)
RecurringJob.AddOrUpdate<JobService>(
    "uyelik-bitis-bildirimi", // Görevin fiyakalý adý
    service => service.CheckExpiringSubscriptions(), // Senin yazdýðýn bildirim atan o jilet metod
    Cron.Daily(9) // Her sabah saat 09:00'da çalýþýr! Ýstersen Cron.Daily() yap gece 12'de çalýþsýn.
);

app.Run();