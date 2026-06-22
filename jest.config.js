module.exports = {
  preset: '@react-native/jest-preset',
  moduleNameMapper: {
    '^@react-native-firebase/app$':
      '<rootDir>/__mocks__/@react-native-firebase/app.js',
    '^@react-native-firebase/messaging$':
      '<rootDir>/__mocks__/@react-native-firebase/messaging.js',
    '^@react-native-community/geolocation$':
      '<rootDir>/__mocks__/@react-native-community/geolocation.js',
    '^react-native-get-random-values$':
      '<rootDir>/__mocks__/react-native-get-random-values.js',
    '^react-native-keychain$': '<rootDir>/__mocks__/react-native-keychain.js',
    '\\.(ttf)$': '<rootDir>/__mocks__/file-mock.js',
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|@react-native-vector-icons|@gluestack-ui|react-native-screens|react-native-safe-area-context)/)',
  ],
};
