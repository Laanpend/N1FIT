using AutoMapper;
using Fitness.Core.DTOs;
using Fitness.Core.Entities;
using Fitness.Core.Enums;
using Fitness.Core.Interfaces;
using Fitness.Service.Helpers;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;

namespace Fitness.Service.Services
{
    public class AuthService : IAuthService
    {
        private readonly IGenericRepository<User> _userRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly ITokenService _tokenService;
        private readonly IMapper _mapper;

        public AuthService(IGenericRepository<User> userRepository, IUnitOfWork unitOfWork, ITokenService tokenService, IMapper mapper)
        {
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
            _tokenService = tokenService;
            _mapper = mapper;
        }

        public async Task<string> LoginAsync(string email, string password)
        {
            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
                throw new UnauthorizedAccessException("E-posta ve şifre alanları zorunludur.");

            var normalizedEmail = email.Trim().ToLowerInvariant();
            var user = await _userRepository
                .Where(x => x.Email.ToLower() == normalizedEmail)
                .FirstOrDefaultAsync();

            if (user == null)
                throw new UnauthorizedAccessException("E-posta adresi veya şifre hatalı.");

            bool isValid = PasswordHasher.VerifyPassword(password, user.PasswordHash);
            if (!isValid && password != password.Trim())
            {
                isValid = PasswordHasher.VerifyPassword(password.Trim(), user.PasswordHash);
            }

            if (!isValid)
                throw new UnauthorizedAccessException("E-posta adresi veya şifre hatalı.");

            return _tokenService.CreateToken(user);
        }

        public async Task RegisterAsync(UserCreateDto userCreateDto)
        {
            if (string.IsNullOrWhiteSpace(userCreateDto.Email) || string.IsNullOrWhiteSpace(userCreateDto.Password))
                throw new ArgumentException("E-posta ve şifre zorunludur.");

            var normalizedEmail = userCreateDto.Email.Trim().ToLowerInvariant();
            var exists = await _userRepository.Where(x => x.Email.ToLower() == normalizedEmail).AnyAsync();
            if (exists)
                throw new InvalidOperationException("Bu e-posta adresi ile kayıtlı bir kullanıcı zaten mevcut.");

            var user = _mapper.Map<User>(userCreateDto);
            user.Email = userCreateDto.Email.Trim();
            user.FirstName = userCreateDto.FirstName?.Trim() ?? string.Empty;
            user.LastName = userCreateDto.LastName?.Trim() ?? string.Empty;
            user.PasswordHash = PasswordHasher.HashPassword(userCreateDto.Password);
            user.Role = UserRole.Member;
            user.IsActive = true;

            await _userRepository.AddAsync(user);
            await _unitOfWork.CommitAsync();
        }
    }
}
