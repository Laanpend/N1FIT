using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Fitness.Core.DTOs;

namespace Fitness.Core.Interfaces
{

    public interface IAuthService
    {
        Task<string> LoginAsync(string email, string password);
        Task RegisterAsync(UserCreateDto userCreateDto);
    }
}
