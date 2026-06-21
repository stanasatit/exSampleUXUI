import type { ComponentProps } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

import { Box, HStack, Icon, Text, VStack } from '../../components/ui';
import { colors } from '../../constants/theme';
import {
  BookingApi,
  ChargingStationApi,
  UserVehicleApi,
} from '../../services/api';

type VehicleCardData = {
  batteryPercent?: number;
  licensePlate?: string;
  modelName: string;
  rangeKm?: number;
  updatedAt?: string;
};

type VehicleRecord = Record<string, unknown>;

type Coordinates = {
  lat: number;
  long: number;
};

type NearbyStationCardData = {
  address?: string;
  availableChargers?: number;
  distanceKm?: number;
  id?: string | number;
  imageUrl?: string;
  name: string;
  powerLabel?: string;
  statusLabel?: string;
  statusTone?: 'danger' | 'success' | 'neutral';
  totalChargers?: number;
  typeLabel?: string;
};

type NextBookingCardData = {
  bookingDate?: string;
  dateLabel: {
    day: string;
    month: string;
    year?: string;
  };
  endTime?: string;
  remainingText?: string;
  startTime?: string;
  stationName: string;
  statusLabel?: string;
  typeLabel?: string;
};

type IconName = ComponentProps<typeof Icon>['name'];

const DEFAULT_COORDINATES: Coordinates = {
  lat: 1,
  long: 2,
};

const userVehicleApi = new UserVehicleApi();
const chargingStationApi = new ChargingStationApi();
const bookingApi = new BookingApi();

const shortcuts = [
  { color: '#21B85E', icon: 'location', label: 'สถานีใกล้ฉัน' },
  { color: '#1DB954', icon: 'flash', label: 'จองด่วน' },
  { color: '#2B7DDD', icon: 'calendar', label: 'การจอง' },
  { color: '#7446DF', icon: 'card', label: 'การชำระเงิน' },
] as const;

export function HomeTabScreen() {
  const [vehicle, setVehicle] = useState<VehicleCardData | null>(null);
  const [isLoadingVehicle, setIsLoadingVehicle] = useState(true);
  const [nearbyStation, setNearbyStation] =
    useState<NearbyStationCardData | null>(null);
  const [isLoadingNearbyStation, setIsLoadingNearbyStation] = useState(true);
  const [nextBooking, setNextBooking] = useState<NextBookingCardData | null>(
    null,
  );
  const [isLoadingNextBooking, setIsLoadingNextBooking] = useState(true);

  useEffect(() => {
    let isMounted = true;

    userVehicleApi
      .list()
      .then(response => {
        if (!isMounted) {
          return;
        }

        setVehicle(getFirstVehicle(response));
      })
      .catch(error => {
        console.warn('Unable to load user vehicle:', error);

        if (isMounted) {
          setVehicle(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingVehicle(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    getCurrentCoordinates()
      .then(coordinates =>
        chargingStationApi.nearby({
          lat: coordinates.lat,
          long: coordinates.long,
          radius: 50,
        }),
      )
      .then(response => {
        if (isMounted) {
          setNearbyStation(getFirstNearbyStation(response));
        }
      })
      .catch(error => {
        console.warn('Unable to load nearby charging station:', error);

        if (isMounted) {
          setNearbyStation(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingNearbyStation(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    bookingApi
      .list()
      .then(response => {
        if (isMounted) {
          setNextBooking(getNextBooking(response));
        }
      })
      .catch(error => {
        console.warn('Unable to load next booking:', error);

        if (isMounted) {
          setNextBooking(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingNextBooking(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const vehicleCard = useMemo(() => {
    if (isLoadingVehicle) {
      return <VehicleLoadingCard />;
    }

    if (!vehicle) {
      return <EmptyVehicleCard />;
    }

    return <VehicleCard vehicle={vehicle} />;
  }, [isLoadingVehicle, vehicle]);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {vehicleCard}

      <HStack alignItems="center" style={styles.searchBox}>
        <Icon color="#4A5568" name="search-outline" size={26} />
        <TextInput
          placeholder="ค้นหาสถานีชาร์จ"
          placeholderTextColor="#6B7280"
          returnKeyType="search"
          style={styles.searchInput}
        />
        <Icon color="#4A5568" name="options-outline" size={25} />
      </HStack>

      <HStack style={styles.shortcutGrid}>
        {shortcuts.map(item => (
          <Pressable key={item.label} style={styles.shortcutCard}>
            <Icon color={item.color} name={item.icon} size={35} />
            <Text style={styles.shortcutLabel}>{item.label}</Text>
          </Pressable>
        ))}
      </HStack>

      <NearbyStationSection
        isLoading={isLoadingNearbyStation}
        station={nearbyStation}
      />

      <NextBookingSection
        booking={nextBooking}
        isLoading={isLoadingNextBooking}
      />
    </ScrollView>
  );
}

function VehicleCard({ vehicle }: { vehicle: VehicleCardData }) {
  const batteryPercent = vehicle.batteryPercent ?? 68;
  const rangeKm = vehicle.rangeKm ?? 392;

  return (
    <View style={styles.vehicleCard}>
      <View style={styles.vehicleArt}>
        <VehicleIllustration />
      </View>

      <HStack justifyContent="space-between" alignItems="flex-start">
        <VStack space="sm" style={styles.vehicleCopy}>
          <HStack alignItems="center" space="sm">
            <Text style={styles.vehicleName}>{vehicle.modelName}</Text>
            {vehicle.licensePlate ? (
              <Box style={styles.plate}>
                <Text style={styles.plateText}>{vehicle.licensePlate}</Text>
              </Box>
            ) : null}
          </HStack>
          <Text style={styles.vehicleMuted}>แบตเตอรี่ปัจจุบัน</Text>
          <Text style={styles.battery}>{batteryPercent}%</Text>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(Math.max(batteryPercent, 0), 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.vehicleMuted}>ระยะทางคงเหลือ</Text>
          <Text style={styles.range}>{rangeKm} km</Text>
          <Text style={styles.updated}>
            อัปเดตล่าสุด {vehicle.updatedAt ?? '09:42'}
          </Text>
        </VStack>
        <Icon color={colors.white} name="chevron-forward" size={30} />
      </HStack>
    </View>
  );
}

function VehicleLoadingCard() {
  return (
    <View style={[styles.emptyVehicleCard, styles.loadingCard]}>
      <ActivityIndicator color={colors.primary} />
      <Text tone="muted" style={styles.emptyVehicleText}>
        กำลังโหลดข้อมูลรถ
      </Text>
    </View>
  );
}

function EmptyVehicleCard() {
  return (
    <View style={styles.emptyVehicleCard}>
      <View style={styles.emptyVehicleIcon}>
        <Icon color="#94A3B8" name="car-sport-outline" size={36} />
      </View>
      <VStack flex={1} space="xs">
        <Text style={styles.emptyVehicleTitle}>ยังไม่มีข้อมูลรถ</Text>
        <Text tone="muted" style={styles.emptyVehicleText}>
          เพิ่มรถของคุณเพื่อดูแบตเตอรี่และระยะทางคงเหลือ
        </Text>
      </VStack>
      <Pressable style={styles.addVehicleButton}>
        <Icon color={colors.white} name="add" size={18} />
        <Text style={styles.addVehicleText}>เพิ่ม</Text>
      </Pressable>
    </View>
  );
}

function NearbyStationSection({
  isLoading,
  station,
}: {
  isLoading: boolean;
  station: NearbyStationCardData | null;
}) {
  return (
    <View style={styles.section}>
      <HStack alignItems="center" justifyContent="space-between">
        <Text style={styles.sectionTitle}>สถานีใกล้ฉัน</Text>
        <Pressable>
          <Text style={styles.sectionAction}>ดูทั้งหมด</Text>
        </Pressable>
      </HStack>

      {isLoading ? (
        <InfoLoadingCard label="กำลังค้นหาสถานีใกล้เคียง" />
      ) : station ? (
        <NearbyStationCard station={station} />
      ) : (
        <EmptyInfoCard
          icon="location-outline"
          message="ยังไม่พบสถานีชาร์จในรัศมี 50 กม."
          title="ไม่พบสถานีใกล้เคียง"
        />
      )}
    </View>
  );
}

function NearbyStationCard({ station }: { station: NearbyStationCardData }) {
  const hasAvailableChargers = station.availableChargers !== undefined;
  const hasTotalChargers = station.totalChargers !== undefined;

  return (
    <View style={styles.stationCard}>
      <StationImage imageUrl={station.imageUrl} />
      <VStack style={styles.stationInfo}>
        <HStack
          alignItems="flex-start"
          justifyContent="space-between"
          style={styles.stationHeader}
        >
          <VStack flex={1} style={styles.stationHeaderText}>
            <Text style={styles.stationName}>{station.name}</Text>
            <Text style={styles.stationAddress}>
              {station.address ?? 'ตำแหน่งสถานีชาร์จ'}
            </Text>
          </VStack>
          <Icon color="#94A3B8" name="heart-outline" size={30} />
        </HStack>

        <HStack style={styles.stationBadges}>
          {station.powerLabel ? (
            <Box style={[styles.stationBadge, styles.stationDcBadge]}>
              <Text style={styles.stationDcBadgeText}>
                {station.powerLabel}
              </Text>
            </Box>
          ) : null}
          {station.typeLabel ? (
            <Box style={[styles.stationBadge, styles.stationAcBadge]}>
              <Text style={styles.stationAcBadgeText}>{station.typeLabel}</Text>
            </Box>
          ) : null}
          {station.statusLabel ? (
            <Box
              style={[
                styles.stationBadge,
                getStationStatusBadgeStyle(station.statusTone),
              ]}
            >
              <Text style={getStationStatusBadgeTextStyle(station.statusTone)}>
                {station.statusLabel}
              </Text>
            </Box>
          ) : null}
        </HStack>

        <View style={styles.stationFooter}>
          <HStack
            alignItems="center"
            space="xs"
            style={styles.stationAvailability}
          >
            <Icon color="#16A34A" name="flash" size={18} />
            {hasAvailableChargers ? (
              <>
                <Text style={styles.stationAvailableText}>ว่าง</Text>
                <Text style={styles.stationAvailableCount}>
                  {station.availableChargers}
                </Text>
              </>
            ) : (
              <Text style={styles.stationAvailableText}>ทั้งหมด</Text>
            )}
            {hasTotalChargers ? (
              <Text style={styles.stationTotalText}>
                {hasAvailableChargers ? '/ ' : ''}
                {station.totalChargers} หัวชาร์จ
              </Text>
            ) : null}
          </HStack>

          <View style={styles.stationFooterActions}>
            {station.distanceKm !== undefined ? (
              <View style={styles.distancePill}>
                <Text style={styles.distanceText}>
                  {station.distanceKm.toFixed(1)} km
                </Text>
                <View style={styles.navigateButton}>
                  <Icon color="#020617" name="navigate" size={18} />
                </View>
              </View>
            ) : null}

            <Pressable style={styles.bookNowButton}>
              <Text style={styles.bookNowText}>จองทันที</Text>
            </Pressable>
          </View>
        </View>
      </VStack>
    </View>
  );
}

function StationImage({ imageUrl }: { imageUrl?: string }) {
  if (imageUrl) {
    return (
      <Image
        resizeMode="cover"
        source={{ uri: imageUrl }}
        style={styles.stationImage}
      />
    );
  }

  return (
    <View style={styles.noImageBox}>
      <Icon color="#94A3B8" name="image-outline" size={28} />
      <Text style={styles.noImageText}>NO IMAGE</Text>
    </View>
  );
}

function NextBookingSection({
  booking,
  isLoading,
}: {
  booking: NextBookingCardData | null;
  isLoading: boolean;
}) {
  return (
    <View style={styles.section}>
      <HStack alignItems="center" justifyContent="space-between">
        <Text style={styles.sectionTitle}>การจองครั้งถัดไป</Text>
        <Pressable>
          <Text style={styles.sectionAction}>ดูทั้งหมด</Text>
        </Pressable>
      </HStack>

      {isLoading ? (
        <InfoLoadingCard label="กำลังโหลดข้อมูลการจอง" />
      ) : booking ? (
        <NextBookingCard booking={booking} />
      ) : (
        <EmptyInfoCard
          icon="calendar-outline"
          message="เมื่อมีรายการจอง ระบบจะแสดงการจองครั้งถัดไปที่นี่"
          title="ยังไม่มีการจองครั้งถัดไป"
        />
      )}
    </View>
  );
}

function NextBookingCard({ booking }: { booking: NextBookingCardData }) {
  return (
    <View style={styles.bookingCard}>
      <View style={styles.bookingDateBox}>
        <Text style={styles.bookingDay}>{booking.dateLabel.day}</Text>
        <Text style={styles.bookingMonth}>{booking.dateLabel.month}</Text>
        {booking.dateLabel.year ? (
          <Text style={styles.bookingYear}>{booking.dateLabel.year}</Text>
        ) : null}
      </View>

      <VStack flex={1} style={styles.bookingInfo}>
        <Text style={styles.bookingTime}>
          {[booking.startTime, booking.endTime].filter(Boolean).join(' - ') ||
            'รอระบุเวลา'}
        </Text>
        <Text numberOfLines={1} style={styles.bookingStation}>
          {booking.stationName}
        </Text>
        <HStack alignItems="center" style={styles.bookingMeta}>
          {booking.typeLabel ? (
            <Text numberOfLines={1} style={styles.bookingType}>
              {booking.typeLabel}
            </Text>
          ) : null}
          {booking.statusLabel ? (
            <Box style={styles.bookingStatus}>
              <Icon color="#16A34A" name="checkmark-circle-outline" size={14} />
              <Text style={styles.bookingStatusText}>
                {booking.statusLabel}
              </Text>
            </Box>
          ) : null}
        </HStack>
      </VStack>

      <View style={styles.bookingDivider} />

      <VStack alignItems="center" style={styles.remainingBox}>
        <Text style={styles.remainingLabel}>เหลืออีก</Text>
        <Text style={styles.remainingTime}>
          {booking.remainingText ?? '--:--:--'}
        </Text>
      </VStack>
    </View>
  );
}

function InfoLoadingCard({ label }: { label: string }) {
  return (
    <View style={[styles.infoStateCard, styles.infoLoadingCard]}>
      <ActivityIndicator color={colors.primary} />
      <Text tone="muted" style={styles.infoStateText}>
        {label}
      </Text>
    </View>
  );
}

function EmptyInfoCard({
  icon,
  message,
  title,
}: {
  icon: IconName;
  message: string;
  title: string;
}) {
  return (
    <View style={styles.infoStateCard}>
      <View style={styles.infoStateIcon}>
        <Icon color="#94A3B8" name={icon} size={30} />
      </View>
      <VStack flex={1}>
        <Text numberOfLines={1} style={styles.infoStateTitle}>
          {title}
        </Text>
        <Text tone="muted" style={styles.infoStateText}>
          {message}
        </Text>
      </VStack>
    </View>
  );
}

function VehicleIllustration() {
  return (
    <Svg height="100%" viewBox="0 0 360 220" width="100%">
      <Defs>
        <LinearGradient id="vehicleBg" x1="0" x2="1" y1="0" y2="1">
          <Stop offset="0" stopColor="#075F54" />
          <Stop offset="0.52" stopColor="#049A86" />
          <Stop offset="1" stopColor="#1C64D8" />
        </LinearGradient>
      </Defs>
      <Rect fill="url(#vehicleBg)" height="220" rx="22" width="360" />
      <Circle
        cx="258"
        cy="78"
        fill="none"
        r="68"
        stroke="#A8FFB8"
        strokeWidth="4"
      />
      <Rect fill="#EAFBF2" height="82" rx="7" width="34" x="307" y="65" />
      <Rect fill="#162335" height="42" rx="4" width="18" x="315" y="92" />
      <Rect fill="#25C96B" height="12" rx="2" width="19" x="314" y="76" />
      <Path
        d="M121 141c15-34 49-55 94-55h29c28 0 55 19 69 47l10 21H82l13-13h26z"
        fill="#F6FAFD"
      />
      <Path
        d="M142 131c18-23 45-35 76-35h24c20 0 42 13 54 31H142z"
        fill="#AFC4D4"
      />
      <Path
        d="M101 153h214c16 0 27 10 27 24H73c2-14 13-24 28-24z"
        fill="#E6EEF4"
      />
      <Ellipse cx="128" cy="177" fill="#111827" rx="23" ry="23" />
      <Ellipse cx="128" cy="177" fill="#475569" rx="11" ry="11" />
      <Ellipse cx="286" cy="177" fill="#111827" rx="23" ry="23" />
      <Ellipse cx="286" cy="177" fill="#475569" rx="11" ry="11" />
      <Path
        d="M94 158h45c-6 11-18 17-35 17H84c1-7 5-13 10-17z"
        fill="#D9F1F9"
      />
      <Path d="M237 101l16 27h-41l-7-27h32z" fill="#6B879A" />
      <Path d="M143 101h52l8 27h-82c6-12 13-21 22-27z" fill="#8EA7B8" />
      <Path
        d="M265 136h28"
        stroke="#94A3B8"
        strokeLinecap="round"
        strokeWidth="5"
      />
    </Svg>
  );
}

async function getCurrentCoordinates(): Promise<Coordinates> {
  const hasPermission = await requestLocationPermission();

  if (!hasPermission) {
    return DEFAULT_COORDINATES;
  }

  return new Promise(resolve => {
    Geolocation.getCurrentPosition(
      position => {
        resolve({
          lat: position.coords.latitude,
          long: position.coords.longitude,
        });
      },
      () => {
        resolve(DEFAULT_COORDINATES);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 60000,
        timeout: 10000,
      },
    );
  });
}

async function requestLocationPermission() {
  if (Platform.OS === 'ios') {
    return new Promise<boolean>(resolve => {
      Geolocation.requestAuthorization(
        () => resolve(true),
        () => resolve(false),
      );
    });
  }

  if (Platform.OS !== 'android') {
    return true;
  }

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  );

  return result === PermissionsAndroid.RESULTS.GRANTED;
}

function getFirstNearbyStation(
  response: unknown,
): NearbyStationCardData | null {
  const firstRecord = getRecordsFromResponse(response)
    .map(candidate => asRecord(candidate))
    .find(Boolean);

  if (!firstRecord) {
    return null;
  }

  return mapStationRecord(firstRecord);
}

function mapStationRecord(record: VehicleRecord): NearbyStationCardData | null {
  const name =
    getString(record.name) ??
    getString(record.station_name) ??
    getString(record.stationName);

  if (!name) {
    return null;
  }

  const powerMin =
    getNumber(record.power_min_kw) ?? getNumber(record.powerMinKw);
  const powerMax =
    getNumber(record.power_max_kw) ?? getNumber(record.powerMaxKw);
  const chargeType =
    getString(record.charge_type) ?? getString(record.chargeType);
  const status = asRecord(record.status) ?? asRecord(record.station_status);
  const availableChargers =
    getNumber(record.available_chargers) ??
    getNumber(record.availableChargers) ??
    getNumber(record.available) ??
    getNumber(record.available_slots);
  const totalChargers =
    getNumber(record.total_chargers) ??
    getNumber(record.totalChargers) ??
    getNumber(record.chargers_count);

  const statusLabel =
    getString(status?.name) ??
    getString(status?.label) ??
    getString(record.status_name) ??
    getString(record.statusName) ??
    getString(record.station_status_name) ??
    getString(record.stationStatusName) ??
    getString(record.status);

  return {
    address: getString(record.address),
    availableChargers,
    distanceKm:
      getNumber(record.distance_km) ??
      getNumber(record.distanceKm) ??
      getNumber(record.distance),
    id: getString(record.id) ?? getNumber(record.id),
    imageUrl:
      getString(record.image_url) ??
      getString(record.imageUrl) ??
      getString(record.photo_url) ??
      getString(record.photoUrl) ??
      getString(record.thumbnail_url) ??
      getString(record.thumbnailUrl),
    name,
    powerLabel: getPowerLabel(powerMin, powerMax, chargeType),
    statusLabel,
    statusTone: getStationStatusTone(statusLabel),
    totalChargers,
    typeLabel: chargeType ? chargeType.toUpperCase() : undefined,
  };
}

function getNextBooking(response: unknown): NextBookingCardData | null {
  const now = Date.now();
  const records = getRecordsFromResponse(response)
    .map(candidate => asRecord(candidate))
    .filter((record): record is VehicleRecord => Boolean(record));

  const upcoming = records
    .map(record => ({ record, time: getBookingTimestamp(record) }))
    .filter(item => item.time === undefined || item.time >= now)
    .sort(
      (a, b) =>
        (a.time ?? Number.MAX_SAFE_INTEGER) -
        (b.time ?? Number.MAX_SAFE_INTEGER),
    );

  const selectedRecord = upcoming[0]?.record ?? records[0];

  if (!selectedRecord) {
    return null;
  }

  return mapBookingRecord(selectedRecord);
}

function mapBookingRecord(record: VehicleRecord): NextBookingCardData | null {
  const station = asRecord(record.station) ?? asRecord(record.charging_station);
  const stationName =
    getString(station?.name) ??
    getString(record.station_name) ??
    getString(record.stationName);

  if (!stationName) {
    return null;
  }

  const bookingDate =
    getString(record.booking_date) ??
    getString(record.bookingDate) ??
    getString(record.date);
  const startTime =
    getTimePart(record.start_time) ?? getTimePart(record.startTime);
  const endTime = getTimePart(record.end_time) ?? getTimePart(record.endTime);
  const status = asRecord(record.status);
  const chargeType =
    getString(record.charge_type) ??
    getString(record.chargeType) ??
    getString(station?.charge_type);

  return {
    bookingDate,
    dateLabel: getBookingDateLabel(bookingDate),
    endTime,
    remainingText: getRemainingText(bookingDate, startTime),
    startTime,
    stationName,
    statusLabel:
      getString(status?.name) ??
      getString(record.status_name) ??
      getString(record.statusName) ??
      getString(record.status),
    typeLabel: chargeType
      ? `${chargeType.toUpperCase()} ${getPowerText(station)}`.trim()
      : getPowerText(station),
  };
}

function getRecordsFromResponse(response: unknown): unknown[] {
  const record = asRecord(response);
  const dataRecord = asRecord(record?.data);
  const candidates = [
    dataRecord?.items,
    dataRecord?.rows,
    dataRecord?.data,
    dataRecord?.stations,
    dataRecord?.chargingStations,
    dataRecord?.charging_stations,
    dataRecord?.bookings,
    record?.items,
    record?.rows,
    record?.data,
    record?.stations,
    record?.chargingStations,
    record?.charging_stations,
    record?.bookings,
    response,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  const firstRecord = candidates
    .map(candidate => asRecord(candidate))
    .find(Boolean);

  return firstRecord ? [firstRecord] : [];
}

function getPowerLabel(
  powerMin: number | undefined,
  powerMax: number | undefined,
  chargeType: string | undefined,
) {
  const type = chargeType ? chargeType.toUpperCase() : 'DC';

  if (powerMax !== undefined) {
    return `${type} ${powerMax} kW`;
  }

  if (powerMin !== undefined) {
    return `${type} ${powerMin} kW`;
  }

  return undefined;
}

function getStationStatusTone(
  statusLabel: string | undefined,
): NearbyStationCardData['statusTone'] {
  const normalized = statusLabel?.trim().toLowerCase();

  if (!normalized) {
    return undefined;
  }

  if (
    normalized.includes('พร้อม') ||
    normalized.includes('available') ||
    normalized.includes('active') ||
    normalized.includes('online') ||
    normalized === 'ok'
  ) {
    return 'success';
  }

  if (
    normalized.includes('มีปัญหา') ||
    normalized.includes('เสีย') ||
    normalized.includes('error') ||
    normalized.includes('fault') ||
    normalized.includes('offline') ||
    normalized.includes('maintenance') ||
    normalized.includes('inactive')
  ) {
    return 'danger';
  }

  return 'neutral';
}

function getStationStatusBadgeStyle(tone: NearbyStationCardData['statusTone']) {
  if (tone === 'success') {
    return styles.stationStatusSuccessBadge;
  }

  if (tone === 'danger') {
    return styles.stationStatusDangerBadge;
  }

  return styles.stationStatusBadge;
}

function getStationStatusBadgeTextStyle(
  tone: NearbyStationCardData['statusTone'],
) {
  if (tone === 'success') {
    return styles.stationStatusSuccessBadgeText;
  }

  if (tone === 'danger') {
    return styles.stationStatusDangerBadgeText;
  }

  return styles.stationStatusBadgeText;
}

function getPowerText(record: VehicleRecord | null) {
  if (!record) {
    return undefined;
  }

  const power =
    getNumber(record.power_max_kw) ??
    getNumber(record.powerMaxKw) ??
    getNumber(record.power_kw) ??
    getNumber(record.powerKw);

  return power !== undefined ? `${power} kW` : undefined;
}

function getBookingTimestamp(record: VehicleRecord) {
  const bookingDate =
    getString(record.booking_date) ??
    getString(record.bookingDate) ??
    getString(record.date);
  const startTime =
    getString(record.start_time) ?? getString(record.startTime) ?? '00:00:00';

  if (!bookingDate) {
    return undefined;
  }

  const timestamp = new Date(`${bookingDate}T${startTime}`).getTime();

  return Number.isNaN(timestamp) ? undefined : timestamp;
}

function getBookingDateLabel(dateText: string | undefined) {
  if (!dateText) {
    return {
      day: '--',
      month: '---',
    };
  }

  const date = new Date(dateText);

  if (Number.isNaN(date.getTime())) {
    return {
      day: dateText.slice(-2) || '--',
      month: '---',
    };
  }

  return {
    day: date.toLocaleDateString('th-TH', { day: '2-digit' }),
    month: date.toLocaleDateString('th-TH', { month: 'short' }),
    year: date.toLocaleDateString('th-TH', { year: 'numeric' }),
  };
}

function getRemainingText(
  bookingDate: string | undefined,
  startTime: string | undefined,
) {
  if (!bookingDate || !startTime) {
    return undefined;
  }

  const target = new Date(`${bookingDate}T${startTime}`).getTime();

  if (Number.isNaN(target)) {
    return undefined;
  }

  const diffMs = target - Date.now();

  if (diffMs <= 0) {
    return '00:00:00';
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map(value => String(value).padStart(2, '0'))
    .join(':');
}

function getTimePart(value: unknown) {
  const text = getString(value);

  if (!text) {
    return undefined;
  }

  if (/^\d{1,2}:\d{2}/.test(text)) {
    return text.slice(0, 5);
  }

  return getTimeText(text);
}

function getFirstVehicle(response: unknown): VehicleCardData | null {
  const record = asRecord(response);
  const dataRecord = asRecord(record?.data);
  const candidates = [
    record?.data,
    dataRecord?.vehicles,
    dataRecord?.userVehicles,
    dataRecord?.user_vehicles,
    dataRecord?.items,
    dataRecord?.rows,
    record?.vehicles,
    record?.userVehicles,
    record?.user_vehicles,
    record?.items,
    record?.rows,
    response,
  ];

  for (const candidate of candidates) {
    const vehicle = getVehicleFromCandidate(candidate);

    if (vehicle) {
      return vehicle;
    }
  }

  return null;
}

function getVehicleFromCandidate(candidate: unknown): VehicleCardData | null {
  const firstRecord = Array.isArray(candidate)
    ? asRecord(candidate[0])
    : asRecord(candidate);

  if (!firstRecord) {
    return null;
  }

  const evCar = asRecord(firstRecord.ev_car) ?? asRecord(firstRecord.evCar);
  const brand = getString(evCar?.brand);
  const model = getString(evCar?.model);
  const nickname = getString(firstRecord.nickname);
  const modelName = nickname || [brand, model].filter(Boolean).join(' ');

  if (!modelName && !getString(firstRecord.license_plate)) {
    return null;
  }

  return {
    batteryPercent:
      getNumber(firstRecord.battery_percent) ??
      getNumber(firstRecord.batteryPercent),
    licensePlate:
      getString(firstRecord.license_plate) ??
      getString(firstRecord.licensePlate),
    modelName: modelName || 'รถของฉัน',
    rangeKm:
      getNumber(firstRecord.range_km) ??
      getNumber(firstRecord.rangeKm) ??
      getNumber(evCar?.range_km) ??
      getNumber(evCar?.rangeKm),
    updatedAt:
      getTimeText(firstRecord.updated_at) ?? getTimeText(firstRecord.updatedAt),
  };
}

function asRecord(value: unknown): VehicleRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as VehicleRecord;
}

function getString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function getNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function getTimeText(value: unknown) {
  const dateText = getString(value);

  if (!dateText) {
    return undefined;
  }

  const date = new Date(dateText);

  if (Number.isNaN(date.getTime())) {
    return dateText;
  }

  return date.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

const styles = StyleSheet.create({
  addVehicleButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 13,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  addVehicleText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },
  battery: {
    color: colors.white,
    fontSize: 45,
    fontWeight: '800',
    lineHeight: 50,
  },
  bookingCard: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 18,
    elevation: 3,
    flexDirection: 'row',
    marginTop: 10,
    minHeight: 96,
    padding: 12,
    shadowColor: '#0F172A',
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
  },
  bookingDateBox: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    height: 74,
    justifyContent: 'center',
    width: 64,
  },
  bookingDay: {
    color: '#020617',
    fontSize: 27,
    fontWeight: '900',
    lineHeight: 30,
  },
  bookingDivider: {
    backgroundColor: '#E2E8F0',
    height: 58,
    marginHorizontal: 10,
    width: 1,
  },
  bookingInfo: {
    marginLeft: 12,
    minWidth: 0,
  },
  bookingMeta: {
    gap: 8,
    marginTop: 6,
  },
  bookingMonth: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 19,
  },
  bookingStation: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 2,
  },
  bookingStatus: {
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 10,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  bookingStatusText: {
    color: '#15803D',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 15,
  },
  bookingTime: {
    color: '#020617',
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  bookingType: {
    color: '#64748B',
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  bookingYear: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 16,
  },
  bookNowButton: {
    alignItems: 'center',
    backgroundColor: '#18BE4F',
    borderRadius: 13,
    height: 42,
    justifyContent: 'center',
    minWidth: 102,
    paddingHorizontal: 16,
  },
  bookNowText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  content: {
    paddingBottom: 15,
    paddingHorizontal: 2,
  },
  distancePill: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: 'row',
    height: 42,
    paddingLeft: 11,
    paddingRight: 4,
  },
  distanceText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginRight: 7,
  },
  emptyVehicleCard: {
    alignItems: 'center',
    backgroundColor: '#EEF2F6',
    borderColor: '#D7DEE8',
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginTop: 22,
    minHeight: 138,
    padding: 18,
  },
  emptyVehicleIcon: {
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    borderRadius: 24,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  emptyVehicleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyVehicleTitle: {
    color: '#334155',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
  infoLoadingCard: {
    justifyContent: 'center',
  },
  infoStateCard: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 18,
    elevation: 2,
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    minHeight: 82,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#0F172A',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  infoStateIcon: {
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  infoStateText: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 3,
  },
  infoStateTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 20,
  },
  loadingCard: {
    justifyContent: 'center',
  },
  plate: {
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  plateText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
  },
  progressFill: {
    backgroundColor: '#37E76B',
    borderRadius: 4,
    height: 8,
  },
  progressTrack: {
    backgroundColor: 'rgba(0,0,0,0.16)',
    borderRadius: 4,
    height: 8,
    overflow: 'hidden',
    width: 145,
  },
  range: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 33,
  },
  noImageBox: {
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
    borderRadius: 16,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    height: 120,
    justifyContent: 'center',
    width: '100%',
  },
  noImageText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 16,
    marginTop: 6,
  },
  navigateButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 17,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  remainingBox: {
    minWidth: 72,
  },
  remainingLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  remainingTime: {
    color: '#020617',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 27,
    marginTop: 2,
  },
  searchBox: {
    backgroundColor: colors.white,
    borderRadius: 22,
    elevation: 4,
    marginTop: 22,
    paddingHorizontal: 18,
    paddingVertical: 17,
    shadowColor: '#0F172A',
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  searchInput: {
    color: colors.text,
    flex: 1,
    fontSize: 18,
    lineHeight: 24,
    padding: 0,
  },
  shortcutCard: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 18,
    elevation: 3,
    flex: 1,
    height: 84,
    justifyContent: 'center',
    paddingHorizontal: 4,
    shadowColor: '#0F172A',
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
  },
  shortcutGrid: {
    gap: 9,
    marginTop: 16,
  },
  shortcutLabel: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    marginTop: 8,
    minHeight: 32,
    textAlign: 'center',
  },
  section: {
    marginTop: 20,
  },
  sectionAction: {
    color: '#16A34A',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  sectionTitle: {
    color: '#020617',
    fontSize: 19,
    fontWeight: '800',
    lineHeight: 25,
  },
  stationAcBadge: {
    backgroundColor: '#DBEAFE',
  },
  stationAcBadgeText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  stationAddress: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 20,
  },
  stationImage: {
    borderRadius: 18,
    height: 78,
    width: '100%',
  },
  stationAvailability: {
    flexGrow: 0,
    flexShrink: 1,
    marginRight: 2,
    minWidth: 0,
  },
  stationAvailableCount: {
    color: '#16A34A',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  stationAvailableText: {
    color: '#16A34A',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  stationBadge: {
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  stationBadges: {
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  stationCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    elevation: 4,
    marginTop: 10,
    padding: 8,
    shadowColor: '#0F172A',
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
  },
  stationDcBadge: {
    backgroundColor: '#DCFCE7',
  },
  stationDcBadgeText: {
    color: '#16A34A',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  stationFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  stationFooterActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginLeft: 8,
  },
  stationHeader: {
    marginTop: 8,
  },
  stationHeaderText: {
    minWidth: 0,
    paddingRight: 8,
  },
  stationInfo: {
    paddingHorizontal: 2,
  },
  stationName: {
    color: '#020617',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  stationStatusBadge: {
    backgroundColor: '#F1F5F9',
  },
  stationStatusBadgeText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  stationStatusDangerBadge: {
    backgroundColor: '#FEE2E2',
  },
  stationStatusDangerBadgeText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  stationStatusSuccessBadge: {
    backgroundColor: '#DCFCE7',
  },
  stationStatusSuccessBadgeText: {
    color: '#16A34A',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  stationTotalText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  updated: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
  },
  vehicleArt: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  vehicleCard: {
    borderRadius: 22,
    elevation: 5,
    marginTop: 22,
    minHeight: 218,
    overflow: 'hidden',
    padding: 22,
    shadowColor: '#0F172A',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
  },
  vehicleCopy: {
    maxWidth: 188,
    zIndex: 1,
  },
  vehicleMuted: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
    opacity: 0.95,
  },
  vehicleName: {
    color: colors.white,
    fontSize: 21,
    fontWeight: '800',
    lineHeight: 27,
  },
});
