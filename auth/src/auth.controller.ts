import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { JwtKeyService } from './services/jwt-key.service';
import { 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest, 
  RegisterResponse, 
  JWKS 
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
}
