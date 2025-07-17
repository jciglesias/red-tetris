export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  testMatch: ['**/?(*.)+(test).[tj]s?(x)'],
  transform: {
    "^.+\\\\.jsx?$": "babel-jest"
  },
  moduleNameMapper: {
    "^unist-util-visit-parents$": "<rootDir>/node_modules/unist-util-visit-parents",
    "^unist-util-visit-parents/do-not-use-color$": "<rootDir>/node_modules/unist-util-visit-parents/lib/do-not-use-color",
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/setupTests.ts',
  ],
  coverageDirectory: '<rootDir>/coverage',
};
