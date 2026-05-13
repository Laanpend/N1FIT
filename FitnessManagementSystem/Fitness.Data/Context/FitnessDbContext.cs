using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Fitness.Core.Entities;

namespace Fitness.Data.Context
{

    public class FitnessDbContext : DbContext
    {
        public FitnessDbContext(DbContextOptions<FitnessDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Measurement> Measurements { get; set; }
        public DbSet<Package> Packages { get; set; }
        public DbSet<Exercise> Exercises { get; set; }
        public DbSet<WorkoutProgram> WorkoutPrograms { get; set; }

        public DbSet<WorkoutDay> WorkoutDays { get; set; }
        public DbSet<WorkoutDayExercise> WorkoutDayExercises { get; set; }
        public DbSet<DietProgram> DietPrograms { get; set; }

        public DbSet<MembershipPackage> MembershipPackages { get; set; }



        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Burada tablo kısıtlamalarını (Zorunlu alanlar vb.) belirtebiliriz.
            modelBuilder.Entity<User>().Property(x => x.Email).IsRequired().HasMaxLength(150);
            base.OnModelCreating(modelBuilder);
        }
    }
}
