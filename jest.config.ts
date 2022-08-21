import type { Config } from '@jest/types';
// Sync object
const config: Config.InitialOptions = {
    verbose: true,
    bail: 2,
    preset: 'ts-jest',
    testEnvironment: 'node',
    // setupFiles: ['dotenv/config'],
    roots: ['tests/'],
    collectCoverage: true,
    collectCoverageFrom: ["src/**/*.ts"],
    coverageThreshold: {
        "global": {
            "lines": 90,
            "branches": 97
        }
    },
    // runner: 'jest-runner-mocha',
    // testRunner: 'jest-runner-mocha'
    transform: {
        '^.+\\.ts?$': 'ts-jest',
    },
    clearMocks: true,
    // moduleFileExtensions: ['ts'],
    // setupFilesAfterEnv: ['jest-extended'],
    globals: {
        'ts-jest': {
            diagnostics: false,
        },
    },
    testTimeout: 10000, //10s
};
export default config;