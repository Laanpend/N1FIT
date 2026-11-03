using System.Threading.Tasks;

namespace Fitness.Core.Interfaces
{
    public interface ISmsService
    {
        Task<(bool Success, string ResponseCode, string RawResponse)> SendSmsAsync(string phoneNumber, string message);
    }
}
