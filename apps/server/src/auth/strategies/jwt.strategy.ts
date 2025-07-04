import { Strategy, ExtractJwt } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { config } from '../../common/config';
import { throwAuthError } from '../../common/utils/user.utils';
import { UserRole, ClientStatus } from '@repo/db';

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
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
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
