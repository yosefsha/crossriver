import { Controller, Post, Get, Put, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { JwtKeyService } from './services/jwt-key.service';
import { 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest, 
  RegisterResponse, 
  JWKS,
  User
} from './interfaces/auth.interfaces';

@Controller()
export class AuthController {
  constructor(
    private authService: AuthService,
    private jwtKeyService: JwtKeyService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerRequest: RegisterRequest): Promise<RegisterResponse> {
    return this.authService.register(registerRequest);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginRequest: LoginRequest): Promise<LoginResponse> {
    return this.authService.login(loginRequest);
  }

  @Get('.well-known/jwks.json')
  getJWKS(): JWKS {
    return this.jwtKeyService.getJWKS();
  }

  // User management endpoints (for authenticated users)
  @Get('admin/users')
  async getAllUsers(): Promise<Omit<User, 'password'>[]> {
    return this.authService.getAllUsers();
  }

  @Get('admin/users/:id')
  async getUserById(@Param('id') id: string): Promise<Omit<User, 'password'> | null> {
    return this.authService.getUserById(id);
  }

  @Put('admin/users/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() updates: Partial<Omit<User, 'id' | 'password' | 'createdAt'>>
  ): Promise<Omit<User, 'password'> | null> {
    return this.authService.updateUser(id, updates);
  }

  @Delete('admin/users/:id')
  async deleteUser(@Param('id') id: string): Promise<{ success: boolean }> {
    const success = await this.authService.deleteUser(id);
    return { success };
  }
}
