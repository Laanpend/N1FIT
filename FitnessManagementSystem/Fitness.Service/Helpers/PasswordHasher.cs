using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fitness.Service.Helpers;

public static class PasswordHasher
{
    public static string HashPassword(string password) => BCrypt.Net.BCrypt.HashPassword(password);
    public static bool VerifyPassword(string password, string hash) => BCrypt.Net.BCrypt.Verify(password, hash);
}
