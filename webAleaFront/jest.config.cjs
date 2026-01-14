module.exports = {
    testEnvironment: "jest-environment-jsdom",

    transform: {
        "^.+\\.(js|jsx)$": "babel-jest"
    },

    moduleFileExtensions: ["js", "jsx"],

    setupFilesAfterEnv: ["@testing-library/jest-dom"],

    moduleNameMapper: {
        "\\.(css|less|scss|sass)$": "<rootDir>/tests/__mocks__/styleMock.js"
    },

    // Coverage
    collectCoverage: true,

    collectCoverageFrom: [
        "src/**/*.{js,jsx}",

        // ❌ Exclude
        "!src/index.js",
        "!src/**/*.test.js",
        "!src/**/*.spec.js",
        "!src/**/__mocks__/**",
        "!src/config/**",
    ],

    coveragePathIgnorePatterns: [
        "/node_modules/",
        "/tests/",
        "/dist/",
        "/build/"
    ]
};
