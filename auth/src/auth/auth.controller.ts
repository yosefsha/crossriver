import { Controller, Post, Body, Get } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: { email: string; password: string }) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  async register(@Body() registerDto: { email: string; password: string; name: string }) {
    return this.authService.register(registerDto);
  }

  @Get('profile')
  async getProfile() {
    return {
      message: 'This is a protected route - implement JWT authentication',
      user: { id: 1, email: 'user@example.com', name: 'Test User' }
    };
  }

  @Post('logout')
  async logout() {
    return { message: 'Logged out successfully' };
  }
}
