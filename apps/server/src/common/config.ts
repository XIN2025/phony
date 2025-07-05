import 'dotenv/config';

const OTP_EXPIRY_MINUTES = 10;
const OTP_EXPIRY_MS = OTP_EXPIRY_MINUTES * 60 * 1000;

const requiredEnvVars = {
  JWT_SECRET: process.env.JWT_SECRET,
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

const optionalEnvVars = {
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || '',
  SMTP_FROM: process.env.SMTP_FROM || '',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/callback/google',
  DATABASE_URL: process.env.DATABASE_URL || 'mongodb://localhost:27017/continuum',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  DEEPGRAM_API_KEY: process.env.DEEPGRAM_API_KEY || '',
};

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN ?? '10d',
  },
  google: {
    clientId: optionalEnvVars.GOOGLE_CLIENT_ID,
    clientSecret: optionalEnvVars.GOOGLE_CLIENT_SECRET,
    callbackUrl: optionalEnvVars.GOOGLE_CALLBACK_URL,
  },
  mail: {
    smtp: {
      host: optionalEnvVars.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '465', 10),
      auth: {
        user: optionalEnvVars.SMTP_USER,
        pass: optionalEnvVars.SMTP_PASSWORD,
      },
    },
    defaults: {
      from: optionalEnvVars.SMTP_FROM,
      fromName: process.env.SMTP_FROM_NAME ?? 'Continuum',
    },
  },
  otp: {
    expiryMs: OTP_EXPIRY_MS,
    expiryMinutes: OTP_EXPIRY_MINUTES,
  },
  ai: {
    geminiApiKey: optionalEnvVars.GEMINI_API_KEY,
    deepgramApiKey: optionalEnvVars.DEEPGRAM_API_KEY,
  },
};
