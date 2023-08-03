module.exports = {
  clearMocks: true,
  //moduleFileExtensions: ["js", "ts"],
  //testMatch: ["./src/**.test.ts"],
  testPathIgnorePatterns: ["./dist"],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },

  verbose: true,
};
