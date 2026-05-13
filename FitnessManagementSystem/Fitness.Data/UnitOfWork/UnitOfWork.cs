using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Fitness.Core.Interfaces;
using Fitness.Data.Context;

namespace Fitness.Data.UnitOfWork
{
   

    public class UnitOfWork : IUnitOfWork
    {
        private readonly FitnessDbContext _context;
        public UnitOfWork(FitnessDbContext context) => _context = context;

        public void Commit() => _context.SaveChanges();
        public async Task CommitAsync() => await _context.SaveChangesAsync();
        public void Dispose() => _context.Dispose();
    }
}
