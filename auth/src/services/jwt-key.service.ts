import { Injectable, OnModuleInit } from '@nestjs/common';
import * as jose from 'node-jose';
import { JWK, JWKS } from '../interfaces/auth.interfaces';

@Injectable()
export class JwtKeyService implements OnModuleInit {
  private keyStore: jose.JWK.KeyStore;
  private currentKey: jose.JWK.Key;

  async onModuleInit() {
    await this.generateKeyPair();
  }

  private async generateKeyPair() {
    this.keyStore = jose.JWK.createKeyStore();
    
    // Generate RS256 key pair
    this.currentKey = await this.keyStore.generate('RSA', 2048, {
      alg: 'RS256',
      use: 'sig',
      kid: `key-${Date.now()}`,
    });
  }

  getPrivateKey(): string {
    return this.currentKey.toPEM(true);
  }

  getPublicKey(): string {
    return this.currentKey.toPEM(false);
  }

  getJWKS(): JWKS {
    const publicJWK = this.currentKey.toJSON(false) as JWK;
    return {
      keys: [publicJWK]
    };
  }

  getKeyId(): string {
    return this.currentKey.kid;
  }
}