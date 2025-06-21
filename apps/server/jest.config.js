module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/../tsconfig.json',
      },
    ],
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/$1',
    '^@repo/db$': '<rootDir>/../../../packages/db/index.ts',
    '^@repo/(.*)$': '<rootDir>/../../../packages/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/../test/jest.setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};
