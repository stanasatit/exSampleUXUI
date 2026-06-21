import 'react-native-get-random-values';

import * as Keychain from 'react-native-keychain';

const DEVICE_UUID_SERVICE = 'com.evpluggo.deviceUuid';
const DEVICE_UUID_ACCOUNT = 'device_uuid';

let cachedDeviceUuid: string | null = null;

type RandomValueCrypto = {
  getRandomValues: <T extends Uint8Array>(array: T) => T;
};

function createUuidV4() {
  const bytes = new Uint8Array(16);
  const randomSource = globalThis as typeof globalThis & {
    crypto: RandomValueCrypto;
  };

  randomSource.crypto.getRandomValues(bytes);

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0'));

  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-');
}

export async function getOrCreateDeviceUuid() {
  if (cachedDeviceUuid) {
    return cachedDeviceUuid;
  }

  const savedUuid = await Keychain.getGenericPassword({
    service: DEVICE_UUID_SERVICE,
  });

  if (savedUuid) {
    cachedDeviceUuid = savedUuid.password;
    return savedUuid.password;
  }

  const newUuid = createUuidV4();

  await Keychain.setGenericPassword(DEVICE_UUID_ACCOUNT, newUuid, {
    accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    service: DEVICE_UUID_SERVICE,
  });

  cachedDeviceUuid = newUuid;
  return newUuid;
}
