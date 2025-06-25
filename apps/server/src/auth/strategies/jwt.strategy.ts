import { Strategy, ExtractJwt } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { config } from 'src/common/config';
import { throwAuthError } from 'src/common/utils/user.utils';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  clientStatus?: string;
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
    if (!payload.sub || !payload.email) {
      throwAuthError('Invalid token payload', 'unauthorized');
    }

    const result = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      firstName: payload.firstName,
      lastName: payload.lastName,
      avatarUrl: payload.avatarUrl,
      clientStatus: payload.clientStatus,
    };

    return result;
  }
}
