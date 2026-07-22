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
import { Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly avatarStorage: AvatarStorageService,
  ) {}

  /** Handoff contract alias — SPA uses Firebase; maps to legacy register. */
  @Public()
  @Throttle({ strict: { limit: 10, ttl: 60_000 } })
  @Post('sign-up')
  async signUp(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.register(registerDto, res);
  }

  /** @deprecated SPA uses Firebase Auth */
  @Public()
  @Throttle({ strict: { limit: 10, ttl: 60_000 } })
  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(registerDto);
    this.setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, user: result.user };
  }

  /** Handoff contract alias — SPA uses Firebase; maps to legacy login. */
  @Public()
  @Throttle({ strict: { limit: 10, ttl: 60_000 } })
  @Post('sign-in')
  async signIn(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.login(loginDto, res);
  }

  /** @deprecated SPA uses Firebase Auth */
  @Public()
  @Throttle({ strict: { limit: 10, ttl: 60_000 } })
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);
    this.setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, user: result.user };
  }

  /** Handoff contract alias for `endpoints.js` `/auth/sign-out`. */
  @Post('sign-out')
  signOut(@Res({ passthrough: true }) res: Response) {
    return this.logout(res);
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('refresh_token');
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
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 2 * 1024 * 1024 } }))
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

  @Get('me/export')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="clearform-account-data.csv"')
  async exportAccount(@CurrentUser() user: { id: string }): Promise<string> {
    return this.authService.exportAccountCsv(user.id);
  }

  @Delete('me')
  @HttpCode(204)
  async deleteAccount(
    @CurrentUser() user: { id: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.deleteAccount(user.id);
    (res as any).clearCookie('refresh_token');
  }

  private setRefreshCookie(res: Response, token: string) {
    res.cookie('refresh_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }
}
