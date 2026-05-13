using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Fitness.Core.Interfaces;
using Fitness.Data.Context;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace Fitness.Data.Repositories
{
    

    public class GenericRepository<T> : IGenericRepository<T> where T : class
    {
        protected readonly FitnessDbContext _context;
        private readonly DbSet<T> _dbSet;

        public GenericRepository(FitnessDbContext context)
        {
            _context = context;
            _dbSet = _context.Set<T>();
        }

        public async Task AddAsync(T entity) => await _dbSet.AddAsync(entity);

        public IQueryable<T> GetAll() => _dbSet.AsNoTracking(); // Performans için NoTracking

        public async Task<T> GetByIdAsync(int id) => await _dbSet.FindAsync(id);

        public void Remove(T entity) => _dbSet.Remove(entity);

        public void Update(T entity) => _dbSet.Update(entity);

        public IQueryable<T> Where(Expression<Func<T, bool>> expression) => _dbSet.Where(expression);
    }
}
