export const envConfig = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002',
  internalApiUrl: process.env.INTERNAL_API_URL || 'http://server:3001',
  nextAuthUrl: process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003',

  providers: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    },
  },
};
