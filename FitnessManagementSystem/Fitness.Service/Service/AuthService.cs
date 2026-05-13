using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using Fitness.Core.DTOs;
using Fitness.Core.Entities;
using Fitness.Core.Enums;
using Fitness.Core.Interfaces;
using Fitness.Service.Helpers;
using Microsoft.EntityFrameworkCore;

namespace Fitness.Service.Services;

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
        var user = await _userRepository.Where(x => x.Email == email).FirstOrDefaultAsync();

        if (user == null || !PasswordHasher.VerifyPassword(password, user.PasswordHash))
            throw new Exception("E-posta veya şifre hatalı!");

        return _tokenService.CreateToken(user);
    }

    public async Task RegisterAsync(UserCreateDto userCreateDto)
    {
        var user = _mapper.Map<User>(userCreateDto);
        user.PasswordHash = PasswordHasher.HashPassword(userCreateDto.Password);
        user.Role = UserRole.Member; // Varsayılan olarak üye kaydediyoruz

        await _userRepository.AddAsync(user);
        await _unitOfWork.CommitAsync();
    }
}
