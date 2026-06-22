const geolocation = {
  getCurrentPosition: jest.fn(success => {
    success({
      coords: {
        latitude: 13.7563,
        longitude: 100.5018,
      },
    });
  }),
  requestAuthorization: jest.fn(success => {
    success?.();
  }),
  watchPosition: jest.fn(() => 1),
  clearWatch: jest.fn(),
  stopObserving: jest.fn(),
};

module.exports = geolocation;
module.exports.default = geolocation;
