import {
  Controller,
  Post,
  Delete,
  Body,
  Get,
  Patch,
  Res,
  HttpCode,
  Header,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AvatarStorageService } from './avatar-storage.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from '../common/decorators/public.decorator';
import type { Response, Request } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/api/v1/auth',
  maxAge: 24 * 60 * 60 * 1000,
};

@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly avatarStorage: AvatarStorageService,
  ) {}

  @Public()
  @Throttle({ strict: { limit: 5, ttl: 300_000 } })
  @Post('sign-up')
  async signUp(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.register(registerDto, res);
  }

  @Public()
  @Throttle({ strict: { limit: 5, ttl: 300_000 } })
  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(registerDto);
    this.setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, user: result.user };
  }

  @Public()
  @Post('check-email')
  async checkEmail(@Body() body: { email: string }) {
    if (!body?.email) throw new BadRequestException('Email is required');
    const available = await this.authService.checkEmailAvailable(body.email);
    return { available, message: available ? 'Email available' : 'Email already in use' };
  }

  @Public()
  @Post('check-username')
  async checkUsername(@Body() body: { username: string }) {
    if (!body?.username) throw new BadRequestException('Username is required');
    const available = await this.authService.checkUsernameAvailable(body.username);
    return { available, message: available ? 'Username available' : 'Username already in use' };
  }

  @Public()
  @Throttle({ strict: { limit: 5, ttl: 300_000 } })
  @Post('sign-in')
  async signIn(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.login(loginDto, res);
  }

  @Public()
  @Throttle({ strict: { limit: 5, ttl: 300_000 } })
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);
    this.setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, user: result.user };
  }

  @Post('sign-out')
  async signOut(
    @CurrentUser() user: { id: string; jti?: string; exp?: number },
    @Res({ passthrough: true }) res: Response,
  ) {
    if (user?.jti) {
      await this.authService.logout(user.id, user.jti, user.exp);
    }
    res.clearCookie('refresh_token', { path: '/api/v1/auth' });
    return { message: 'Logged out successfully' };
  }

  @Post('logout')
  async logout(
    @CurrentUser() user: { id: string; jti?: string; exp?: number },
    @Res({ passthrough: true }) res: Response,
  ) {
    if (user?.jti) {
      await this.authService.logout(user.id, user.jti, user.exp);
    }
    res.clearCookie('refresh_token', { path: '/api/v1/auth' });
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  getProfile(@CurrentUser() user: { id: string; email?: string }) {
    return this.authService.getMe(user.id, user.email);
  }

  @Patch('me')
  updateProfile(
    @CurrentUser() user: { id: string },
    @Body() body: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.id, body);
  }

  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 2 * 1024 * 1024 } }),
  )
  async uploadAvatar(
    @CurrentUser() user: { id: string },
    @UploadedFile() file?: { buffer: Buffer; mimetype: string; size: number },
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Avatar file is required.');
    }
    const avatarUrl = await this.avatarStorage.uploadAvatar(
      user.id,
      file.buffer,
      file.mimetype,
    );
    return this.authService.updateProfile(user.id, { avatarUrl });
  }

  @Patch('me/onboarding-complete')
  completeOnboarding(@CurrentUser() user: { id: string }) {
    return this.authService.completeOnboarding(user.id);
  }

  @Post('me/change-password')
  changePassword(
    @CurrentUser() user: { id: string },
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(
      user.id,
      body.currentPassword,
      body.newPassword,
    );
  }

  @Get('me/export')
  @Header('Content-Type', 'text/csv')
  @Header(
    'Content-Disposition',
    'attachment; filename="clearform-account-data.csv"',
  )
  async exportAccount(@CurrentUser() user: { id: string }): Promise<string> {
    return this.authService.exportAccountCsv(user.id);
  }

  @Delete('me')
  @HttpCode(204)
  async deleteAccount(
    @CurrentUser() user: { id: string; jti?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    if (user?.jti) {
      await this.authService.logout(user.id, user.jti);
    }
    await this.authService.deleteAccount(user.id);
    res.clearCookie('refresh_token', { path: '/api/v1/auth' });
  }

  private setRefreshCookie(res: Response, token: string) {
    res.cookie('refresh_token', token, COOKIE_OPTIONS);
  }
}
