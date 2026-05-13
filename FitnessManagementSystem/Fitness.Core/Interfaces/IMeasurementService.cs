using Fitness.Core.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fitness.Core.Interfaces
{
    public interface IMeasurementService : IService<Measurement>
    {
        Task<IEnumerable<Measurement>> GetMemberHistoryAsync(int userId);
    }
}
