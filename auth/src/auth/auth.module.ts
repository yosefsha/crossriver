import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthController } from '../auth.controller';
import { AuthService } from '../services/auth.service';
import { JwtKeyService } from '../services/jwt-key.service';
import { DynamoDbModule } from '../database/dynamodb.module';
import { UserRepository } from '../database/user.repository';

@Module({
  imports: [
    DynamoDbModule,
  ],
  controllers: [AuthController],
  providers: [
    JwtKeyService,
    {
      provide: JwtService,
      useFactory: async (jwtKeyService: JwtKeyService) => {
        // Ensure keys are generated before creating JwtService
        await jwtKeyService.onModuleInit();
        
        return new JwtService({
          privateKey: jwtKeyService.getPrivateKey(),
          publicKey: jwtKeyService.getPublicKey(),
          signOptions: {
            algorithm: 'RS256',
            expiresIn: '1h',
            // issuer and audience set in payload instead
          },
          verifyOptions: {
            algorithms: ['RS256'],
            issuer: 'myassistant-auth',
            audience: ['myassistant-server', 'myassistant-client'],
          },
        });
      },
      inject: [JwtKeyService],
    },
    AuthService,
    UserRepository,
  ],
  exports: [AuthService, JwtKeyService, UserRepository],
})
export class AuthModule {}
