using Fitness.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace Fitness.Data.Context
{
    public class FitnessDbContext : DbContext
    {
        public FitnessDbContext(DbContextOptions<FitnessDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Measurement> Measurements { get; set; }
        public DbSet<Exercise> Exercises { get; set; }
        public DbSet<WorkoutProgram> WorkoutPrograms { get; set; }
        public DbSet<WorkoutDay> WorkoutDays { get; set; }
        public DbSet<WorkoutDayExercise> WorkoutDayExercises { get; set; }
        public DbSet<DietProgram> DietPrograms { get; set; }
        public DbSet<Food> Foods { get; set; }
        public DbSet<DietMealFood> DietMealFoods { get; set; }
        public DbSet<MembershipPackage> MembershipPackages { get; set; }
        public DbSet<DailyTrackingLog> DailyTrackingLogs { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<Sale> Sales { get; set; }
        public DbSet<SaleItem> SaleItems { get; set; }
        public DbSet<Expense> Expenses { get; set; }
        public DbSet<PendingMembershipPayment> PendingMembershipPayments { get; set; }
        public DbSet<FinancialTransaction> FinancialTransactions { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>().Property(x => x.Email).IsRequired().HasMaxLength(150);
            modelBuilder.Entity<User>().Property(x => x.TotalDebt).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<User>().Property(x => x.PaidAmount).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<MembershipPackage>().Property(x => x.Price).HasColumnType("decimal(18,2)");

            modelBuilder.Entity<Product>().Property(x => x.BuyingPrice).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<Product>().Property(x => x.SellingPrice).HasColumnType("decimal(18,2)");

            modelBuilder.Entity<Sale>().Property(x => x.TotalAmount).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<Sale>().Property(x => x.TotalCost).HasColumnType("decimal(18,2)");

            modelBuilder.Entity<SaleItem>().Property(x => x.UnitBuyingPrice).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<SaleItem>().Property(x => x.UnitPrice).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<SaleItem>().Property(x => x.TotalPrice).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<SaleItem>()
                .HasOne(s => s.Sale)
                .WithMany(p => p.Items)
                .HasForeignKey(s => s.SaleId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Expense>().Property(x => x.Amount).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<PendingMembershipPayment>().Property(x => x.Amount).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<FinancialTransaction>().Property(x => x.Amount).HasColumnType("decimal(18,2)");

            modelBuilder.Entity<DietMealFood>()
                .HasOne(d => d.DietProgram)
                .WithMany(p => p.Foods)
                .HasForeignKey(d => d.DietProgramId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<DailyTrackingLog>()
                .HasOne(d => d.User)
                .WithMany()
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<DailyTrackingLog>()
                .HasIndex(d => new { d.UserId, d.TrackingDate })
                .IsUnique();

            base.OnModelCreating(modelBuilder);
        }
    }
}
