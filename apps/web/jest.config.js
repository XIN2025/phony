import nextJest from 'next/jest.js';
const createJestConfig = nextJest({ dir: './' });
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@repo/(.*)$': '<rootDir>/../../packages/$1',
    '^jose$': '<rootDir>/__mocks__/jose.js',
    '^openid-client$': '<rootDir>/__mocks__/openid-client.js',
    '^next-auth$': '<rootDir>/__mocks__/next-auth.js',
    '^next-auth/react$': '<rootDir>/__mocks__/next-auth-react.js',
  },
  transformIgnorePatterns: ['node_modules/(?!(jose|openid-client|next-auth)/)'],
  collectCoverageFrom: ['**/*.{js,jsx,ts,tsx}', '!**/*.d.ts', '!**/node_modules/**', '!**/.next/**', '!**/coverage/**'],
  testMatch: ['**/__tests__/**/*.(ts|tsx|js)', '**/*.(test|spec).(ts|tsx|js)'],
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
};
export default createJestConfig(customJestConfig);
