using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fitness.Core.Interfaces
{
    public interface IUnitOfWork : IDisposable
    {
        Task CommitAsync(); // Değişiklikleri SQL'e yansıtmak için
        void Commit();
    }
}
