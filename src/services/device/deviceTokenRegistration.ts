import axios from 'axios';
import { Platform } from 'react-native';

import {
  DeviceTokenApi,
  DeviceTokenCreateRequest,
  DeviceTokenUpdateRequest,
} from '../api';
import {
  initializeFirebaseMessaging,
  setFirebaseTokenRefreshHandler,
} from '../notifications/firebaseMessaging';
import { getOrCreateDeviceUuid } from './deviceUuid';

type RegisterDeviceTokenOptions = {
  userId?: number;
  username?: string;
};

const deviceTokenApi = new DeviceTokenApi();
let currentRegistrationOptions: RegisterDeviceTokenOptions | null = null;

function getDevicePlatform() {
  return Platform.OS === 'ios' ? 'ios' : 'android';
}

function isNotFoundError(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 404;
}

export async function registerOrUpdateDeviceToken({
  userId,
  username,
}: RegisterDeviceTokenOptions) {
  currentRegistrationOptions = {
    userId,
    username,
  };
  setFirebaseTokenRefreshHandler(token =>
    updateRegisteredDeviceToken(token).then(() => undefined),
  );

  const [uuid, fcmToken] = await Promise.all([
    getOrCreateDeviceUuid(),
    initializeFirebaseMessaging(),
  ]);

  if (!fcmToken) {
    return {
      action: 'skipped',
      uuid,
    };
  }

  const createPayload: DeviceTokenCreateRequest = {
    fcm_token: fcmToken,
    platform: getDevicePlatform(),
    user_id: userId,
    username,
    uuid,
  };

  const updatePayload: DeviceTokenUpdateRequest = {
    fcm_token: fcmToken,
    platform: getDevicePlatform(),
    user_id: userId,
    username,
  };

  try {
    await deviceTokenApi.getByUuid(uuid);
    const response = await deviceTokenApi.update(uuid, updatePayload);

    return {
      action: 'updated',
      response,
      uuid,
    };
  } catch (error) {
    if (!isNotFoundError(error)) {
      throw error;
    }

    const response = await deviceTokenApi.create(createPayload);

    return {
      action: 'created',
      response,
      uuid,
    };
  }
}

export async function updateRegisteredDeviceToken(fcmToken: string) {
  if (!currentRegistrationOptions) {
    return {
      action: 'skipped',
    };
  }

  const uuid = await getOrCreateDeviceUuid();
  const payload: DeviceTokenUpdateRequest = {
    fcm_token: fcmToken,
    platform: getDevicePlatform(),
    user_id: currentRegistrationOptions.userId,
    username: currentRegistrationOptions.username,
  };

  try {
    await deviceTokenApi.update(uuid, payload);

    return {
      action: 'updated',
      uuid,
    };
  } catch (error) {
    if (!isNotFoundError(error)) {
      throw error;
    }

    await deviceTokenApi.create({
      ...payload,
      uuid,
    });

    return {
      action: 'created',
      uuid,
    };
  }
}
