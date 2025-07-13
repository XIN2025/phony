import { Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { config } from '../../common/config';
import { throwAuthError } from '../../common/utils/user.utils';
import { UserRole, ClientStatus } from '@repo/db';

const extractJwtFromRequest = (req: { headers: Record<string, string> }) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  if (req.headers.cookie) {
    const cookies = req.headers.cookie.split(';').reduce((acc: Record<string, string>, cookie: string) => {
      const [key, value] = cookie.trim().split('=');
      if (key) acc[key] = value;
      return acc;
    }, {});

    // Try different possible cookie names
    const token =
      cookies['next-auth.session-token'] ||
      cookies['__Secure-next-auth.session-token'] ||
      cookies['session-token'] ||
      cookies['token'];

    if (token) {
      return token;
    }
  }

  return null;
};

interface JwtPayload {
  sub: string;
  email: string;
  role: (typeof UserRole)[keyof typeof UserRole];
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  clientStatus?: (typeof ClientStatus)[keyof typeof ClientStatus];
  practitionerId?: string | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: extractJwtFromRequest,
      ignoreExpiration: false,
      secretOrKey: config.jwt.secret,
    });
  }

  validate(payload: JwtPayload) {
    if (!payload.sub || !payload.email || !payload.role) {
      throwAuthError('Invalid token payload', 'unauthorized');
    }

    const result = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      firstName: payload.firstName,
      lastName: payload.lastName,
      avatarUrl: payload.avatarUrl || null,
      clientStatus: payload.clientStatus,
      practitionerId: payload.practitionerId || null,
    };

    return result;
  }
}
