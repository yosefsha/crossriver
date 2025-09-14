import { Injectable, UnauthorizedException,BadRequestException, ConflictException } from '@nestjs/common';
// import { JwtService } from '@nestjs/jwt';
import { JwtKeyService } from './jwt-key.service';
import { 
  JwtPayload, 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest, 
  RegisterResponse,
  User 
} from '../interfaces/auth.interfaces';

@Injectable()
export class AuthService {
  // Mock user storage - replace with actual database
  private users: User[] = [
    {
      id: '1',
      email: 'user@example.com',
      password: 'password', // In real app, this should be hashed
      username: 'johndoe',
      roles: ['user'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      email: 'admin@example.com',
      password: 'password', // In real app, this should be hashed
      username: 'adminuser',
      roles: ['admin', 'user'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '3',
      email: 'testuser@abc.com',
      password: 'testpassword', // For e2e tests
      username: 'testuser',
      roles: ['user'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  constructor(
    // private jwtService: JwtService,
    private jwtKeyService: JwtKeyService,
  ) {}

  async register(registerRequest: RegisterRequest): Promise<RegisterResponse> {
    // Check if user already exists
    // check that username email and password are provided
    if (!registerRequest.email || !registerRequest.password || !registerRequest.username) {
      throw new BadRequestException('Email, password, and username are required');
    }
    const existingUser = this.users.find(user => user.email === registerRequest.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }
    // Create new user
    const newUser: User = {
      id: (this.users.length + 1).toString(),
      email: registerRequest.email,
      password: registerRequest.password, // TODO: Hash password with bcrypt
      username: registerRequest.username,
      roles: registerRequest.roles || ['user'],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.push(newUser);

    return {
      success: true,
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        roles: newUser.roles,
      },
    };
  }

  async login(loginRequest: LoginRequest): Promise<LoginResponse> {
    // Validate request body
    if (!loginRequest.email || !loginRequest.password) {
      throw new BadRequestException('Email and password are required');
    }

    const user = await this.validateUser(loginRequest.email, loginRequest.password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      scopes: this.getUserScopes(user.roles),
      iss: 'crossriver-auth',
      aud: ['crossriver-server', 'crossriver-client'],
    };

    // TODO: Replace with actual JWT token generation using this.jwtService
    const token = 'mock-jwt-token-' + Date.now();

    return {
      access_token: token,
      token_type: 'Bearer',
      expires_in: 3600,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        roles: user.roles,
      },
    };
  }

  private async validateUser(email: string, password: string): Promise<User | null> {
    const user = this.users.find(u => u.email === email);
    if (user && user.password === password) { // TODO: Use bcrypt.compare
      return user;
    }
    return null;
  }

  private getUserScopes(roles: string[]): string[] {
    const scopeMap = {
      admin: ['read:all', 'write:all', 'delete:all'],
      user: ['read:own', 'write:own'],
    };

    return roles.flatMap(role => scopeMap[role] || []);
  }
}