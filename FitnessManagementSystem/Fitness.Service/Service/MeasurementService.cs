using Fitness.Core.Entities;
using Fitness.Core.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fitness.Service.Service
{
    public class MeasurementService : Service<Measurement>, IMeasurementService
    {
        private readonly IGenericRepository<Measurement> _measurementRepository;

        public MeasurementService(IGenericRepository<Measurement> repository, IUnitOfWork unitOfWork) : base(repository, unitOfWork)
        {
            _measurementRepository = repository;
        }

        public async Task<IEnumerable<Measurement>> GetMemberHistoryAsync(int userId)
        {
            // x.MeasurementDate SİLİNDİ, YERİNE x.RecordDate YAZILDI
            return await _measurementRepository.Where(x => x.UserId == userId)
                                               .OrderByDescending(x => x.RecordDate)
                                               .ToListAsync();
        }
    }
}
