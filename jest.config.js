module.exports = {
  preset: '@react-native/jest-preset',
  moduleNameMapper: {
    '^@react-native-firebase/app$':
      '<rootDir>/__mocks__/@react-native-firebase/app.js',
    '^@react-native-firebase/messaging$':
      '<rootDir>/__mocks__/@react-native-firebase/messaging.js',
    '\\.(ttf)$': '<rootDir>/__mocks__/file-mock.js',
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|@react-native-vector-icons|@gluestack-ui|react-native-screens|react-native-safe-area-context)/)',
  ],
};
