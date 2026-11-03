using Fitness.Core.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Net.Http;
using System.Security;
using System.Text;
using System.Threading.Tasks;

namespace Fitness.Service.Service
{
    public class NetgsmService : ISmsService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<NetgsmService> _logger;
        private static readonly HttpClient _httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(15) };

        public NetgsmService(IConfiguration configuration, ILogger<NetgsmService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public static string? NormalizePhoneNumber(string? rawPhone)
        {
            if (string.IsNullOrWhiteSpace(rawPhone))
                return null;

            var digits = new string(rawPhone.Where(char.IsDigit).ToArray());

            if (digits.StartsWith("90") && digits.Length == 12)
                digits = digits.Substring(2);
            else if (digits.StartsWith("0") && digits.Length == 11)
                digits = digits.Substring(1);

            if (digits.Length == 10 && digits.StartsWith("5"))
                return digits;

            return digits.Length >= 10 ? digits : null;
        }

        public async Task<(bool Success, string ResponseCode, string RawResponse)> SendSmsAsync(string phoneNumber, string message)
        {
            var normalizedPhone = NormalizePhoneNumber(phoneNumber);
            if (string.IsNullOrEmpty(normalizedPhone))
            {
                _logger.LogWarning("Geçersiz telefon numarası formatı nedeniyle SMS gönderilemedi: {Phone}", phoneNumber);
                return (false, "INVALID_PHONE", "Geçersiz telefon numarası formatı.");
            }

            var userCode = _configuration["Netgsm:UserCode"] ?? "8508403658";
            var password = _configuration["Netgsm:Password"] ?? "Berkay2006**";
            var msgHeader = _configuration["Netgsm:MsgHeader"] ?? "8508403658";

            var result = await ExecuteXmlSendAsync(userCode, password, msgHeader, normalizedPhone, message);

            // Eğer 40 (Başlık hatası) dönerse hesaptaki onaylı başlığı sorgulayıp otomatik tekrar dene
            if (!result.Success && result.ResponseCode == "40")
            {
                var approvedHeader = await TryFetchApprovedHeaderAsync(userCode, password);
                if (!string.IsNullOrWhiteSpace(approvedHeader) && approvedHeader != msgHeader)
                {
                    _logger.LogInformation("Netgsm 40 kodu sonrası onaylı başlık ({ApprovedHeader}) ile tekrar deneniyor.", approvedHeader);
                    result = await ExecuteXmlSendAsync(userCode, password, approvedHeader, normalizedPhone, message);
                }
            }

            if (result.Success)
            {
                _logger.LogInformation("Netgsm SMS başarıyla gönderildi -> Numara: {Phone}, Yanıt: {Resp}", normalizedPhone, result.RawResponse);
            }
            else
            {
                _logger.LogWarning("Netgsm SMS gönderimi başarısız -> Numara: {Phone}, Kod: {Code}, Yanıt: {Resp}", normalizedPhone, result.ResponseCode, result.RawResponse);
            }

            return result;
        }

        private async Task<(bool Success, string ResponseCode, string RawResponse)> ExecuteXmlSendAsync(
            string userCode, string password, string msgHeader, string phone, string message)
        {
            try
            {
                var escapedUser = SecurityElement.Escape(userCode);
                var escapedPass = SecurityElement.Escape(password);
                var escapedHeader = SecurityElement.Escape(msgHeader);

                var xmlPayload = $@"<?xml version=""1.0"" encoding=""UTF-8""?>
<mainbody>
    <header>
        <company dil=""TR"">Netgsm</company>
        <usercode>{escapedUser}</usercode>
        <password>{escapedPass}</password>
        <type>1:n</type>
        <msgheader>{escapedHeader}</msgheader>
    </header>
    <body>
        <msg><![CDATA[{message}]]></msg>
        <no>{phone}</no>
    </body>
</mainbody>";

                using var content = new StringContent(xmlPayload, Encoding.UTF8, "application/xml");
                using var response = await _httpClient.PostAsync("https://api.netgsm.com.tr/sms/send/xml", content);
                var rawResponse = (await response.Content.ReadAsStringAsync()).Trim();

                var parts = rawResponse.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                var code = parts.FirstOrDefault() ?? rawResponse;

                bool isSuccess = code == "00" || code == "01" || code == "02";
                return (isSuccess, code, rawResponse);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Netgsm API çağrısı sırasında hata oluştu.");
                return (false, "EXCEPTION", ex.Message);
            }
        }

        private async Task<string?> TryFetchApprovedHeaderAsync(string userCode, string password)
        {
            try
            {
                var url = $"https://api.netgsm.com.tr/sms/header?usercode={Uri.EscapeDataString(userCode)}&password={Uri.EscapeDataString(password)}";
                var resp = (await _httpClient.GetStringAsync(url)).Trim();
                if (string.IsNullOrWhiteSpace(resp) || resp == "30" || resp == "40")
                    return null;

                var firstHeader = resp
                    .Split(new[] { "<br>", "\r\n", "\n" }, StringSplitOptions.RemoveEmptyEntries)
                    .FirstOrDefault()?.Trim();

                return string.IsNullOrWhiteSpace(firstHeader) ? null : firstHeader;
            }
            catch
            {
                return null;
            }
        }
    }
}
