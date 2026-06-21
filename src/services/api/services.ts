import { apiGet, apiPost, apiPut, ApiRequestConfig } from './client';
import {
  ApiId,
  ApiResponse,
  BookingAvailableQuery,
  BookingCancelRequest,
  BookingConfirmRequest,
  BookingCreateRequest,
  BookingNotifyRequest,
  BookingUpdateRequest,
  BookingWalkinQueueQuery,
  BookingWalkinRequest,
  ChargingFeeCalculateRequest,
  ChargingFeeCompareRequest,
  ChargingFeeEstimateRequest,
  ChargingFeeSessionStartRequest,
  ChargingFeeSessionStopRequest,
  ChargingSessionCreateRequest,
  ChargingSessionFinishRequest,
  ChargingSessionPaymentRequest,
  ChargingStationCreateRequest,
  ChargingStationListQuery,
  ChargingStationNearbyQuery,
  ChargingStationUpdateRequest,
  DeviceTokenCreateRequest,
  DeviceTokenResponse,
  DeviceTokenUpdateRequest,
  EvCarCreateRequest,
  EvCarUpdateRequest,
  MultipleResponse,
  PricingConfigCalculateRequest,
  PricingConfigCreateRequest,
  PricingConfigUpdateRequest,
  SendMultipleRequest,
  SendTokenRequest,
  SendTopicRequest,
  StationStatusCreateRequest,
  StationStatusUpdateRequest,
  SuccessResponse,
  TopicRequest,
  TopicResponse,
  UserListResponse,
  UserForgotPasswordRequest,
  UserLoginRequest,
  UserLoginResponse,
  UserRefreshRequest,
  UserRegisterRequest,
  UserRegisterResponse,
  UserResetPasswordRequest,
  UserResponse,
  UserUpdateMeRequest,
  UserVehicleCreateRequest,
  UserVehicleUpdateRequest,
} from './types';

function encodePath(value: ApiId) {
  return encodeURIComponent(String(value));
}

function withParams<TParams extends Record<string, unknown>>(
  params: TParams | undefined,
  config?: ApiRequestConfig,
): ApiRequestConfig | undefined {
  if (!params) {
    return config;
  }

  return {
    ...config,
    params: {
      ...config?.params,
      ...params,
    },
  };
}

export class HealthApi {
  getHealth(config?: ApiRequestConfig) {
    return apiGet<ApiResponse>('/', config);
  }
}

export class UserApi {
  register(data: UserRegisterRequest, config?: ApiRequestConfig) {
    return apiPost<UserRegisterResponse, UserRegisterRequest>(
      '/user/register',
      data,
      config,
    );
  }

  login(data: UserLoginRequest, config?: ApiRequestConfig) {
    return apiPost<UserLoginResponse, UserLoginRequest>(
      '/user/login',
      data,
      config,
    );
  }

  forgotPassword(data: UserForgotPasswordRequest, config?: ApiRequestConfig) {
    return apiPost<ApiResponse, UserForgotPasswordRequest>(
      '/user/forgot-password',
      data,
      config,
    );
  }

  resetPassword(data: UserResetPasswordRequest, config?: ApiRequestConfig) {
    return apiPost<ApiResponse, UserResetPasswordRequest>(
      '/user/reset-password',
      data,
      config,
    );
  }

  refresh(data: UserRefreshRequest, config?: ApiRequestConfig) {
    return apiPost<ApiResponse, UserRefreshRequest>(
      '/user/refresh',
      data,
      config,
    );
  }

  getMe(config?: ApiRequestConfig) {
    return apiGet<UserResponse>('/user/me', config);
  }

  updateMe(data: UserUpdateMeRequest, config?: ApiRequestConfig) {
    return apiPut<UserResponse, UserUpdateMeRequest>('/user/me', data, config);
  }

  list(config?: ApiRequestConfig) {
    return apiGet<UserListResponse>('/user/list', config);
  }

  getById(id: ApiId, config?: ApiRequestConfig) {
    return apiGet<UserResponse>(`/user/${encodePath(id)}`, config);
  }
}

export class UserVehicleApi {
  list(config?: ApiRequestConfig) {
    return apiGet<ApiResponse>('/user-vehicle', config);
  }

  create(data: UserVehicleCreateRequest, config?: ApiRequestConfig) {
    return apiPost<ApiResponse, UserVehicleCreateRequest>(
      '/user-vehicle',
      data,
      config,
    );
  }

  listByUserId(userId: ApiId, config?: ApiRequestConfig) {
    return apiGet<ApiResponse>(
      `/user-vehicle/user/${encodePath(userId)}`,
      config,
    );
  }

  getById(id: ApiId, config?: ApiRequestConfig) {
    return apiGet<ApiResponse>(`/user-vehicle/${encodePath(id)}`, config);
  }

  update(id: ApiId, data: UserVehicleUpdateRequest, config?: ApiRequestConfig) {
    return apiPut<ApiResponse, UserVehicleUpdateRequest>(
      `/user-vehicle/${encodePath(id)}`,
      data,
      config,
    );
  }
}

export class StationStatusApi {
  list(config?: ApiRequestConfig) {
    return apiGet<ApiResponse>('/station-status', config);
  }

  create(data: StationStatusCreateRequest, config?: ApiRequestConfig) {
    return apiPost<ApiResponse, StationStatusCreateRequest>(
      '/station-status',
      data,
      config,
    );
  }

  getById(id: ApiId, config?: ApiRequestConfig) {
    return apiGet<ApiResponse>(`/station-status/${encodePath(id)}`, config);
  }

  update(
    id: ApiId,
    data: StationStatusUpdateRequest,
    config?: ApiRequestConfig,
  ) {
    return apiPut<ApiResponse, StationStatusUpdateRequest>(
      `/station-status/${encodePath(id)}`,
      data,
      config,
    );
  }
}

export class PricingConfigApi {
  list(config?: ApiRequestConfig) {
    return apiGet<ApiResponse>('/pricing-config', config);
  }

  create(data: PricingConfigCreateRequest, config?: ApiRequestConfig) {
    return apiPost<ApiResponse, PricingConfigCreateRequest>(
      '/pricing-config',
      data,
      config,
    );
  }

  getActive(config?: ApiRequestConfig) {
    return apiGet<ApiResponse>('/pricing-config/active', config);
  }

  getByStationId(stationId: ApiId, config?: ApiRequestConfig) {
    return apiGet<ApiResponse>(
      `/pricing-config/station/${encodePath(stationId)}`,
      config,
    );
  }

  getById(id: ApiId, config?: ApiRequestConfig) {
    return apiGet<ApiResponse>(`/pricing-config/${encodePath(id)}`, config);
  }

  update(
    id: ApiId,
    data: PricingConfigUpdateRequest,
    config?: ApiRequestConfig,
  ) {
    return apiPut<ApiResponse, PricingConfigUpdateRequest>(
      `/pricing-config/${encodePath(id)}`,
      data,
      config,
    );
  }

  calculate(
    stationId: ApiId,
    data: PricingConfigCalculateRequest,
    config?: ApiRequestConfig,
  ) {
    return apiPost<ApiResponse, PricingConfigCalculateRequest>(
      `/pricing-config/calculate/${encodePath(stationId)}`,
      data,
      config,
    );
  }
}

export class NotificationApi {
  sendToToken(data: SendTokenRequest, config?: ApiRequestConfig) {
    return apiPost<SuccessResponse, SendTokenRequest>(
      '/notification/send/token',
      data,
      config,
    );
  }

  sendToTopic(data: SendTopicRequest, config?: ApiRequestConfig) {
    return apiPost<SuccessResponse, SendTopicRequest>(
      '/notification/send/topic',
      data,
      config,
    );
  }

  sendToMultiple(data: SendMultipleRequest, config?: ApiRequestConfig) {
    return apiPost<MultipleResponse, SendMultipleRequest>(
      '/notification/send/multiple',
      data,
      config,
    );
  }

  subscribeTopic(data: TopicRequest, config?: ApiRequestConfig) {
    return apiPost<TopicResponse, TopicRequest>(
      '/notification/topic/subscribe',
      data,
      config,
    );
  }

  unsubscribeTopic(data: TopicRequest, config?: ApiRequestConfig) {
    return apiPost<TopicResponse, TopicRequest>(
      '/notification/topic/unsubscribe',
      data,
      config,
    );
  }
}

export class EvCarApi {
  list(config?: ApiRequestConfig) {
    return apiGet<ApiResponse>('/ev-car', config);
  }

  create(data: EvCarCreateRequest, config?: ApiRequestConfig) {
    return apiPost<ApiResponse, EvCarCreateRequest>('/ev-car', data, config);
  }

  getById(id: ApiId, config?: ApiRequestConfig) {
    return apiGet<ApiResponse>(`/ev-car/${encodePath(id)}`, config);
  }

  update(id: ApiId, data: EvCarUpdateRequest, config?: ApiRequestConfig) {
    return apiPut<ApiResponse, EvCarUpdateRequest>(
      `/ev-car/${encodePath(id)}`,
      data,
      config,
    );
  }
}

export class DeviceTokenApi {
  create(data: DeviceTokenCreateRequest, config?: ApiRequestConfig) {
    return apiPost<DeviceTokenResponse, DeviceTokenCreateRequest>(
      '/device-token',
      data,
      config,
    );
  }

  list(config?: ApiRequestConfig) {
    return apiGet<ApiResponse>('/device-token', config);
  }

  update(
    uuid: string,
    data: DeviceTokenUpdateRequest,
    config?: ApiRequestConfig,
  ) {
    return apiPut<DeviceTokenResponse, DeviceTokenUpdateRequest>(
      `/device-token/${encodePath(uuid)}`,
      data,
      config,
    );
  }

  getByUuid(uuid: string, config?: ApiRequestConfig) {
    return apiGet<ApiResponse>(`/device-token/${encodePath(uuid)}`, config);
  }
}

export class ChargingStationApi {
  list(query?: ChargingStationListQuery, config?: ApiRequestConfig) {
    return apiGet<ApiResponse>('/charging-station', withParams(query, config));
  }

  nearby(query: ChargingStationNearbyQuery, config?: ApiRequestConfig) {
    return apiGet<ApiResponse>(
      '/charging-station/nearby',
      withParams(query, config),
    );
  }

  create(data: ChargingStationCreateRequest, config?: ApiRequestConfig) {
    return apiPost<ApiResponse, ChargingStationCreateRequest>(
      '/charging-station',
      data,
      config,
    );
  }

  getById(id: ApiId, config?: ApiRequestConfig) {
    return apiGet<ApiResponse>(`/charging-station/${encodePath(id)}`, config);
  }

  update(
    id: ApiId,
    data: ChargingStationUpdateRequest,
    config?: ApiRequestConfig,
  ) {
    return apiPut<ApiResponse, ChargingStationUpdateRequest>(
      `/charging-station/${encodePath(id)}`,
      data,
      config,
    );
  }
}

export class ChargingSessionApi {
  list(config?: ApiRequestConfig) {
    return apiGet<ApiResponse>('/charging-session', config);
  }

  create(data: ChargingSessionCreateRequest, config?: ApiRequestConfig) {
    return apiPost<ApiResponse, ChargingSessionCreateRequest>(
      '/charging-session',
      data,
      config,
    );
  }

  listByUserId(userId: ApiId, config?: ApiRequestConfig) {
    return apiGet<ApiResponse>(
      `/charging-session/user/${encodePath(userId)}`,
      config,
    );
  }

  getById(id: ApiId, config?: ApiRequestConfig) {
    return apiGet<ApiResponse>(`/charging-session/${encodePath(id)}`, config);
  }

  finish(
    id: ApiId,
    data: ChargingSessionFinishRequest,
    config?: ApiRequestConfig,
  ) {
    return apiPut<ApiResponse, ChargingSessionFinishRequest>(
      `/charging-session/${encodePath(id)}/finish`,
      data,
      config,
    );
  }

  updatePayment(
    id: ApiId,
    data: ChargingSessionPaymentRequest,
    config?: ApiRequestConfig,
  ) {
    return apiPut<ApiResponse, ChargingSessionPaymentRequest>(
      `/charging-session/${encodePath(id)}/payment`,
      data,
      config,
    );
  }
}

export class ChargingFeeApi {
  getPeakHours(config?: ApiRequestConfig) {
    return apiGet<ApiResponse>('/charging-fee/peak-hours', config);
  }

  calculate(data: ChargingFeeCalculateRequest, config?: ApiRequestConfig) {
    return apiPost<ApiResponse, ChargingFeeCalculateRequest>(
      '/charging-fee/calculate',
      data,
      config,
    );
  }

  estimate(data: ChargingFeeEstimateRequest, config?: ApiRequestConfig) {
    return apiPost<ApiResponse, ChargingFeeEstimateRequest>(
      '/charging-fee/estimate',
      data,
      config,
    );
  }

  compare(data: ChargingFeeCompareRequest, config?: ApiRequestConfig) {
    return apiPost<ApiResponse, ChargingFeeCompareRequest>(
      '/charging-fee/compare',
      data,
      config,
    );
  }

  startSession(
    data: ChargingFeeSessionStartRequest,
    config?: ApiRequestConfig,
  ) {
    return apiPost<ApiResponse, ChargingFeeSessionStartRequest>(
      '/charging-fee/session/start',
      data,
      config,
    );
  }

  stopSession(
    id: ApiId,
    data: ChargingFeeSessionStopRequest,
    config?: ApiRequestConfig,
  ) {
    return apiPut<ApiResponse, ChargingFeeSessionStopRequest>(
      `/charging-fee/session/${encodePath(id)}/stop`,
      data,
      config,
    );
  }
}

export class BookingApi {
  getAvailable(query?: BookingAvailableQuery, config?: ApiRequestConfig) {
    return apiGet<ApiResponse>('/booking/available', withParams(query, config));
  }

  getWalkinQueue(query?: BookingWalkinQueueQuery, config?: ApiRequestConfig) {
    return apiGet<ApiResponse>(
      '/booking/walkin/queue',
      withParams(query, config),
    );
  }

  list(config?: ApiRequestConfig) {
    return apiGet<ApiResponse>('/booking', config);
  }

  create(data: BookingCreateRequest, config?: ApiRequestConfig) {
    return apiPost<ApiResponse, BookingCreateRequest>('/booking', data, config);
  }

  listByUserId(userId: ApiId, config?: ApiRequestConfig) {
    return apiGet<ApiResponse>(`/booking/user/${encodePath(userId)}`, config);
  }

  getPendingNotify(config?: ApiRequestConfig) {
    return apiGet<ApiResponse>('/booking/pending-notify', config);
  }

  getById(id: ApiId, config?: ApiRequestConfig) {
    return apiGet<ApiResponse>(`/booking/${encodePath(id)}`, config);
  }

  update(id: ApiId, data: BookingUpdateRequest, config?: ApiRequestConfig) {
    return apiPut<ApiResponse, BookingUpdateRequest>(
      `/booking/${encodePath(id)}`,
      data,
      config,
    );
  }

  createWalkin(data: BookingWalkinRequest, config?: ApiRequestConfig) {
    return apiPost<ApiResponse, BookingWalkinRequest>(
      '/booking/walkin',
      data,
      config,
    );
  }

  confirm(id: ApiId, data: BookingConfirmRequest, config?: ApiRequestConfig) {
    return apiPut<ApiResponse, BookingConfirmRequest>(
      `/booking/${encodePath(id)}/confirm`,
      data,
      config,
    );
  }

  cancel(id: ApiId, data: BookingCancelRequest, config?: ApiRequestConfig) {
    return apiPut<ApiResponse, BookingCancelRequest>(
      `/booking/${encodePath(id)}/cancel`,
      data,
      config,
    );
  }

  notify(id: ApiId, data: BookingNotifyRequest, config?: ApiRequestConfig) {
    return apiPost<ApiResponse, BookingNotifyRequest>(
      `/booking/${encodePath(id)}/notify`,
      data,
      config,
    );
  }
}

export const healthApi = new HealthApi();
export const userApi = new UserApi();
export const userVehicleApi = new UserVehicleApi();
export const stationStatusApi = new StationStatusApi();
export const pricingConfigApi = new PricingConfigApi();
export const notificationApi = new NotificationApi();
export const evCarApi = new EvCarApi();
export const deviceTokenApi = new DeviceTokenApi();
export const chargingStationApi = new ChargingStationApi();
export const chargingSessionApi = new ChargingSessionApi();
export const chargingFeeApi = new ChargingFeeApi();
export const bookingApi = new BookingApi();
