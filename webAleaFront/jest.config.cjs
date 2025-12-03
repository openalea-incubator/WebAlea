module.exports = {
    testEnvironment: "jest-environment-jsdom",

    transform: {
        "^.+\\.(js|jsx)$": "babel-jest"
    },

    moduleFileExtensions: ["js", "jsx"],

    setupFilesAfterEnv: ["@testing-library/jest-dom"],

    moduleNameMapper: {
        "\\.(css|less|scss|sass)$": "<rootDir>/tests/__mocks__/styleMock.js"
    }
};
