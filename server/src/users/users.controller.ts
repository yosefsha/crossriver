import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
  
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req) {
    return {
      message: 'This is a protected endpoint',
      user: req.user,
    };
  }

  @Get('public')
  getPublicInfo() {
    return {
      message: 'This is a public endpoint',
      timestamp: new Date().toISOString(),
    };
  }
}
