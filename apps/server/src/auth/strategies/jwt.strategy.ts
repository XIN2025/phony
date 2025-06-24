import { Strategy, ExtractJwt } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { RequestUser } from '../dto/request-user.dto';
import { config } from 'src/common/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.jwt.secret,
    });
  }

  validate(user: RequestUser) {
    if (!user.id || !user.email) {
      console.error('JWT Strategy validation failed: Invalid token payload', user);
      throw new UnauthorizedException('Invalid token payload');
    }

    const result = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      clientStatus: user.clientStatus,
    };

    return result;
  }
}
