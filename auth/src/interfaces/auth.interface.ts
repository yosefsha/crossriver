export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  scopes: string[];
  iat: number;
  exp: number;
  iss: string;
  aud: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  roles?: string[]; // Optional, defaults to ['user']
}

export interface LoginResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  user: {
    id: string;
    email: string;
    username: string;
    roles: string[];
  };
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  user: {
    id: string;
    email: string;
    username: string;
    roles: string[];
  };
}

export interface JWK {
  kty: string;
  use: string;
  key_ops: string[];
  alg: string;
  kid: string;
  n: string;
  e: string;
}

export interface JWKS {
  keys: JWK[];
}

export interface User {
  id: string;
  email: string;
  password: string;
  username: string;
  roles: string[];
  createdAt: Date;
  updatedAt: Date;
}
