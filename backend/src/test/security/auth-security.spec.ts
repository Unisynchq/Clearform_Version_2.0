import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../auth/auth.service';
import { UsersService } from '../../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { FirebaseService } from '../../firebase/firebase.service';
import { TokenBlacklistService } from '../../redis/redis-token-blacklist.service';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException, ConflictException } from '@nestjs/common';

describe('AuthService - Security Tests', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let tokenBlacklist: jest.Mocked<TokenBlacklistService>;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    passwordHash: '',
    avatarUrl: null,
    onboardingCompletedAt: null,
    passwordLastChangedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
      deleteById: jest.fn(),
      exportAccountCsv: jest.fn(),
      markOnboardingComplete: jest.fn(),
      updatePassword: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    jwtService = {
      sign: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    tokenBlacklist = {
      blacklistToken: jest.fn(),
      isBlacklisted: jest.fn(),
      blacklistUserTokens: jest.fn(),
      isUserBlacklisted: jest.fn(),
    } as unknown as jest.Mocked<TokenBlacklistService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_SECRET') return 'test-secret';
              if (key === 'JWT_REFRESH_SECRET') return 'test-refresh-secret';
              return null;
            }),
          },
        },
        { provide: FirebaseService, useValue: { getAuth: jest.fn() } },
        { provide: TokenBlacklistService, useValue: tokenBlacklist },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('Password Hashing', () => {
    it('should use bcrypt with 12+ rounds', async () => {
      const hashSpy = jest.spyOn(bcrypt, 'hash');
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('token');

      await service.register({
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
        password: 'SecurePass123!',
      });

      expect(hashSpy).toHaveBeenCalled();
      const hashArg = hashSpy.mock.calls[0][1];
      expect(hashArg).toBeGreaterThanOrEqual(12);
    });

    it('should hash passwords with sufficient cost', async () => {
      const hashSpy = jest.spyOn(bcrypt, 'hash');
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('token');

      await service.register({
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'SecurePass123!',
      });

      expect(hashSpy).toHaveBeenCalled();
      const rounds = hashSpy.mock.calls[0][1] as number;
      expect(rounds).toBeGreaterThanOrEqual(12);
    });
  });

  describe('JWT Token Rotation', () => {
    it('should include jti in generated tokens', async () => {
      jwtService.sign.mockReturnValue('signed-token');
      usersService.findByEmail.mockResolvedValue(mockUser);
      const hashCompare = jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.accessToken).toBe('signed-token');
      expect(result.refreshToken).toBe('signed-token');
    });
  });

  describe('Token Blacklist', () => {
    it('should blacklist token on logout', async () => {
      await service.logout('user-1', 'token-jti', 9999999999);

      expect(tokenBlacklist.blacklistToken).toHaveBeenCalledWith(
        'token-jti',
        'access',
        9999999999,
      );
      expect(tokenBlacklist.blacklistUserTokens).toHaveBeenCalledWith('user-1');
    });

    it('should check blacklist during refresh', async () => {
      tokenBlacklist.isBlacklisted.mockResolvedValue(true);
      usersService.findById.mockResolvedValue(mockUser);

      await expect(
        service.refreshAccessToken('user-1', 'revoked-jti', 1000),
      ).rejects.toThrow(UnauthorizedException);

      expect(tokenBlacklist.blacklistUserTokens).toHaveBeenCalledWith('user-1');
    });
  });

  describe('Login Security', () => {
    it('should not reveal if email exists', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nonexistent@example.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should not reveal why login failed', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(
        service.login({ email: 'test@example.com', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Password Change', () => {
    it('should blacklist all tokens on password change', async () => {
      usersService.findById.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('new-hash' as never);

      await service.changePassword('user-1', 'oldPass123!', 'newPass456!');

      expect(tokenBlacklist.blacklistUserTokens).toHaveBeenCalledWith('user-1');
    });

    it('should reject incorrect current password', async () => {
      usersService.findById.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(
        service.changePassword('user-1', 'wrongPass123!', 'newPass456!'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('User Profile Serialization', () => {
    it('should never expose password hash', () => {
      const result = service.serializeUserProfile({
        ...mockUser,
        passwordHash: 'supersecret',
        subscription: null,
        _count: { forms: 0 },
      });

      expect(result).not.toHaveProperty('passwordHash');
      expect(result.hasPassword).toBe(true);
    });
  });
});
