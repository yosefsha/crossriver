import { Module } from '@nestjs/common';
import { AuthController } from '../auth.controller';
import { AuthService } from '../services/auth.service';
import { JwtKeyService } from '../services/jwt-key.service';
import { DynamoDbModule } from '../database/dynamodb.module';
import { UserRepository } from '../database/user.repository';

@Module({
  imports: [DynamoDbModule],
  controllers: [AuthController],
  providers: [AuthService, JwtKeyService, UserRepository],
  exports: [AuthService, JwtKeyService, UserRepository],
})
export class AuthModule {}
