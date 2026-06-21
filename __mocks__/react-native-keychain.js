const store = new Map();

const ACCESSIBLE = {
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'AccessibleAfterFirstUnlockThisDeviceOnly',
};

function getService(options) {
  return options?.service ?? 'default';
}

async function getGenericPassword(options) {
  return store.get(getService(options)) ?? false;
}

async function setGenericPassword(username, password, options) {
  store.set(getService(options), { username, password });
  return { service: getService(options), storage: 'mock' };
}

async function resetGenericPassword(options) {
  return store.delete(getService(options));
}

module.exports = {
  ACCESSIBLE,
  getGenericPassword,
  resetGenericPassword,
  setGenericPassword,
};
