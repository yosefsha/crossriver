import { Module } from '@nestjs/common';
import { AuthController } from '../auth.controller';
import { AuthService } from '../services/auth.service';
import { JwtKeyService } from '../services/jwt-key.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtKeyService],
  exports: [AuthService, JwtKeyService],
})
export class AuthModule {}
