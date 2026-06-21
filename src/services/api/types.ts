export type ApiId = number | string;

export type ApiResponse<TData extends Record<string, unknown> = Record<string, unknown>> =
  {
    success?: boolean;
    message?: string;
    error?: string;
    code?: string;
  } & TData;

export type UserObject = {
  id?: number;
  username?: string;
  birthday?: string | null;
  phone?: string | null;
  line_id?: string | null;
  email?: string | null;
  image_car_url?: string | null;
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
};

export type UserRegisterRequest = {
  username: string;
  password: string;
  birthday?: string;
  phone?: string;
  line_id?: string;
  email?: string;
  image_car_url?: string;
};

export type UserRegisterResponse = ApiResponse<{
  user?: UserObject;
}>;

export type UserLoginRequest = {
  username: string;
  password: string;
};

export type UserRefreshRequest = {
  refresh_token: string;
};

export type UserUpdateMeRequest = {
  birthday?: string;
  phone?: string;
  line_id?: string;
  email?: string;
  image_base64?: string;
  new_password?: string;
};

export type UserListResponse = ApiResponse<{
  count?: number;
  users?: UserObject[];
}>;

export type UserResponse = ApiResponse<{
  user?: UserObject;
}>;

export type UserVehicleCreateRequest = {
  user_id?: number;
  ev_car_id?: number;
  license_plate?: string;
  color?: string;
  nickname?: string;
  username?: string;
};

export type UserVehicleUpdateRequest = Partial<UserVehicleCreateRequest>;

export type StationStatusCreateRequest = {
  code?: string;
  name?: string;
  description?: string;
  username?: string;
};

export type StationStatusUpdateRequest = Omit<
  StationStatusCreateRequest,
  'code'
>;

export type PricingConfigCreateRequest = {
  station_id?: number;
  name?: string;
  rate_per_kwh?: number;
  service_fee?: number;
  min_charge_fee?: number;
  vat_percent?: number;
  effective_from?: string;
  effective_to?: string;
  is_active?: 0 | 1 | number;
  note?: string;
  username?: string;
};

export type PricingConfigUpdateRequest = Partial<PricingConfigCreateRequest>;

export type PricingConfigCalculateRequest = {
  energy_kwh?: number;
  discount?: number;
};

export type NotificationData = Record<string, unknown>;

export type SendTokenRequest = {
  token: string;
  title: string;
  body: string;
  imageUrl?: string;
  data?: NotificationData;
};

export type SendTopicRequest = {
  topic: string;
  title: string;
  body: string;
  imageUrl?: string;
  data?: NotificationData;
};

export type SendMultipleRequest = {
  tokens: string[];
  title: string;
  body: string;
  imageUrl?: string;
  data?: NotificationData;
};

export type TopicRequest = {
  tokens: string[];
  topic: string;
};

export type SuccessResponse = ApiResponse<{
  messageId?: string;
}>;

export type MultipleResponse = ApiResponse<{
  successCount?: number;
  failureCount?: number;
  results?: Array<{
    token?: string;
    success?: boolean;
    messageId?: string;
    error?: string | null;
  }>;
}>;

export type TopicResponse = ApiResponse<{
  successCount?: number;
  failureCount?: number;
  errors?: Record<string, unknown>[];
}>;

export type EvCarCreateRequest = {
  brand?: string;
  model?: string;
  year?: number;
  battery_capacity?: number;
  range_km?: number;
  charge_type?: string;
  image_car_url?: string;
  username?: string;
};

export type EvCarUpdateRequest = Partial<EvCarCreateRequest>;

export type DevicePlatform = 'android' | 'ios';

export type DeviceTokenCreateRequest = {
  uuid?: string;
  fcm_token?: string;
  user_id?: number;
  platform?: DevicePlatform;
  username?: string;
};

export type DeviceTokenUpdateRequest = {
  fcm_token?: string;
  platform?: DevicePlatform;
  username?: string;
};

export type DeviceTokenResponse = ApiResponse<{
  data?: {
    id?: number;
    uuid?: string;
    fcm_token?: string;
    user_id?: number | null;
    platform?: string | null;
    created_at?: string;
    created_by?: string;
    updated_at?: string;
    updated_by?: string;
  };
}>;

export type ChargingStationListQuery = {
  provider_code?: string;
  charge_type?: string;
  pricing_model?: string;
};

export type ChargingStationCreateRequest = {
  name?: string;
  address?: string;
  lat?: number;
  long?: number;
  total_chargers?: number;
  status_id?: number;
  provider_code?: string;
  provider_name?: string;
  charge_type?: string;
  power_min_kw?: number;
  power_max_kw?: number;
  pricing_model?: string;
  price_peak?: number;
  price_offpeak?: number;
  idle_fee?: number;
  username?: string;
};

export type ChargingStationUpdateRequest =
  Partial<ChargingStationCreateRequest>;

export type ChargingSessionCreateRequest = {
  user_id?: number;
  station_id?: number;
  booking_id?: number;
  vehicle_id?: number;
  actual_start?: string;
  rate_per_kwh?: number;
  service_fee?: number;
  payment_method?: string;
  note?: string;
  username?: string;
};

export type ChargingSessionFinishRequest = {
  actual_end?: string;
  energy_kwh?: number;
  discount?: number;
  username?: string;
};

export type ChargingSessionPaymentRequest = {
  payment_status?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  payment_method?: string;
  username?: string;
};

export type ChargingFeeCalculateRequest = {
  station_id?: number;
  energy_kwh?: number;
  duration_minutes?: number;
  start_datetime?: string;
  discount?: number;
};

export type ChargingFeeEstimateRequest = {
  station_id?: number;
  vehicle_id?: number;
  ev_car_id?: number;
  battery_capacity_kwh?: number;
  current_percent?: number;
  target_percent?: number;
  charge_efficiency?: number;
  start_datetime?: string;
  discount?: number;
};

export type ChargingFeeCompareRequest = {
  station_ids?: number[];
  energy_kwh?: number;
  start_datetime?: string;
};

export type ChargingFeeSessionStartRequest = {
  station_id?: number;
  user_id?: number;
  vehicle_id?: number;
  booking_id?: number;
  payment_method?: string;
  note?: string;
  username?: string;
};

export type ChargingFeeSessionStopRequest = {
  energy_kwh?: number;
  discount?: number;
  username?: string;
};

export type BookingAvailableQuery = {
  station_id?: number;
  date?: string;
  slot_minutes?: number;
};

export type BookingWalkinQueueQuery = {
  station_id?: number;
};

export type BookingCreateRequest = {
  user_id?: number;
  station_id?: number;
  vehicle_id?: number;
  booking_date?: string;
  start_time?: string;
  end_time?: string;
  status_id?: number;
  note?: string;
  username?: string;
};

export type BookingUpdateRequest = Partial<BookingCreateRequest>;

export type BookingWalkinRequest = {
  user_id?: number;
  station_id?: number;
  vehicle_id?: number;
  note?: string;
  username?: string;
};

export type BookingConfirmRequest = {
  username?: string;
};

export type BookingCancelRequest = {
  reason?: string;
  username?: string;
};

export type BookingNotifyRequest = {
  type?: 'remind' | 'end';
};
