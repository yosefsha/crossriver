import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import * as jwksClient from 'jwks-rsa';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: (request, rawJwtToken, done) => {
        // Use JWKS to get the public key for verification
        const client = jwksClient({
          jwksUri: configService.get<string>('JWKS_URI') || 'http://auth:3001/.well-known/jwks.json',
          cache: true,
          cacheMaxEntries: 5,
          cacheMaxAge: 600000, // 10 minutes
        });

        // Extract kid from JWT header
        try {
          const header = JSON.parse(Buffer.from(rawJwtToken.split('.')[0], 'base64').toString());
          const kid = header.kid;

          client.getSigningKey(kid, (err, key) => {
            if (err) {
              return done(err);
            }
            const signingKey = key.getPublicKey();
            done(null, signingKey);
          });
        } catch (error) {
          done(error);
        }
      },
      algorithms: ['RS256'],
      issuer: 'myassistant-auth',
      audience: ['myassistant-server', 'myassistant-client'],
    });
  }

  async validate(payload: any) {
    // This method is called after successful token verification
    return {
      userId: payload.sub,
      email: payload.email,
      roles: payload.roles,
      scopes: payload.scopes,
    };
  }
}
