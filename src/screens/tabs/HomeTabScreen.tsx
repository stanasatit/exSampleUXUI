import type { ComponentProps } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
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

import { Box, HStack, Icon, Text, VStack } from '../../components/ui';
import { colors, spacing } from '../../constants/theme';
import { AddVehicleModal } from '../AddVehicleModal';
import {
  BookingApi,
  ChargingStationApi,
  EvCarApi,
  UserVehicleApi,
} from '../../services/api';

type VehicleCardData = {
  batteryCapacity?: number;
  batteryPercent?: number;
  chargeType?: string;
  color?: string;
  evCarId?: number | string;
  imageUrl?: string;
  licensePlate?: string;
  modelName: string;
  rangeKm?: number;
  rangeKmMax?: number;
  updatedAt?: string;
  vehicleId?: number;
  year?: number;
};

type VehicleWithCarId = VehicleCardData;

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
  lat: 13.7563,
  long: 100.5018,
};

type HomeTabScreenProps = {
  onShowAllBookings?: () => void;
  userId?: number;
  username?: string;
};

const userVehicleApi = new UserVehicleApi();
const evCarApi = new EvCarApi();
const chargingStationApi = new ChargingStationApi();
const bookingApi = new BookingApi();

const shortcuts = [
  { color: '#10B981', icon: 'location', label: 'ใกล้ฉัน' },
  { color: '#F59E0B', icon: 'flash', label: 'จองด่วน' },
  { color: '#2563EB', icon: 'calendar', label: 'การจอง' },
  { color: '#7C3AED', icon: 'card', label: 'ชำระเงิน' },
] as const;

export function HomeTabScreen({
  onShowAllBookings,
  userId,
  username,
}: HomeTabScreenProps) {
  const [vehicle, setVehicle] = useState<VehicleCardData | null>(null);
  const [isLoadingVehicle, setIsLoadingVehicle] = useState(true);
  const [nearbyStation, setNearbyStation] =
    useState<NearbyStationCardData | null>(null);
  const [isLoadingNearbyStation, setIsLoadingNearbyStation] = useState(true);
  const [nextBooking, setNextBooking] = useState<NextBookingCardData | null>(
    null,
  );
  const [isLoadingNextBooking, setIsLoadingNextBooking] = useState(true);
  const [isAddVehicleVisible, setIsAddVehicleVisible] = useState(false);
  const [isEditVehicleVisible, setIsEditVehicleVisible] = useState(false);

  const loadVehicle = useCallback(() => {
    let isMounted = true;
    setIsLoadingVehicle(true);

    async function doLoad() {
      try {
        const request = userId
          ? userVehicleApi.listByUserId(userId)
          : userVehicleApi.list();

        const vehicleResponse = await request;
        if (!isMounted) {
          return;
        }

        const rawVehicle = getFirstVehicle(vehicleResponse);

        if (!rawVehicle) {
          setVehicle(null);
          return;
        }

        // Call GET /ev-car/{id} for full car details (image, year, battery, range, etc.)
        if (rawVehicle.evCarId !== undefined) {
          try {
            const evCarResponse = await evCarApi.getById(rawVehicle.evCarId);
            if (!isMounted) {
              return;
            }
            const evCarDetails = extractEvCarDetails(evCarResponse);
            setVehicle({ ...rawVehicle, ...evCarDetails });
          } catch {
            if (isMounted) {
              setVehicle(rawVehicle);
            }
          }
        } else {
          setVehicle(rawVehicle);
        }
      } catch (error) {
        console.warn('Unable to load user vehicle:', error);
        if (isMounted) {
          setVehicle(null);
        }
      } finally {
        if (isMounted) {
          setIsLoadingVehicle(false);
        }
      }
    }

    doLoad();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  useEffect(() => {
    return loadVehicle();
  }, [loadVehicle]);

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

    const request = userId ? bookingApi.listByUserId(userId) : bookingApi.list();

    request
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
  }, [userId]);

  const vehicleCard = useMemo(() => {
    if (isLoadingVehicle) {
      return <VehicleLoadingCard />;
    }

    if (!vehicle) {
      return <EmptyVehicleCard onAddPress={() => setIsAddVehicleVisible(true)} />;
    }

    return (
      <VehicleCard
        onEditPress={() => setIsEditVehicleVisible(true)}
        vehicle={vehicle}
      />
    );
  }, [isLoadingVehicle, vehicle]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {vehicleCard}

        <HStack alignItems="center" style={styles.searchBox}>
          <Icon color="#475569" name="search-outline" size={25} />
          <TextInput
            placeholder="ค้นหาสถานีชาร์จ"
            placeholderTextColor="#94A3B8"
            returnKeyType="search"
            style={styles.searchInput}
          />
          <Pressable style={styles.filterButton}>
            <Icon color="#0F172A" name="options-outline" size={22} />
          </Pressable>
        </HStack>

        <HStack style={styles.shortcutGrid}>
          {shortcuts.map(item => (
            <Pressable key={item.label} style={styles.shortcutCard}>
              <View
                style={[
                  styles.shortcutIcon,
                  { backgroundColor: `${item.color}18` },
                ]}
              >
                <Icon color={item.color} name={item.icon} size={28} />
              </View>
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
          onShowAll={onShowAllBookings}
        />
      </ScrollView>

    <AddVehicleModal
      onClose={() => setIsAddVehicleVisible(false)}
      onSuccess={loadVehicle}
      userId={userId}
      username={username}
      visible={isAddVehicleVisible}
    />

    <AddVehicleModal
      editVehicle={
        vehicle && vehicle.vehicleId !== undefined
          ? {
              color: vehicle.color,
              evCarId: typeof vehicle.evCarId === 'number' ? vehicle.evCarId : undefined,
              licensePlate: vehicle.licensePlate,
              nickname: undefined,
              vehicleId: vehicle.vehicleId,
            }
          : undefined
      }
      onClose={() => setIsEditVehicleVisible(false)}
      onSuccess={loadVehicle}
      userId={userId}
      username={username}
      visible={isEditVehicleVisible}
    />
  </View>
  );
}

function VehicleCarImage({ imageUrl }: { imageUrl?: string }) {
  const [hasError, setHasError] = useState(false);

  if (!imageUrl || hasError) {
    return (
      <View style={styles.vehicleCarImageEmpty}>
        <Icon color="#94A3B8" name="car-sport-outline" size={56} />
      </View>
    );
  }

  return (
    <Image
      onError={() => setHasError(true)}
      resizeMode="contain"
      source={{ uri: imageUrl }}
      style={styles.vehicleCarImage}
    />
  );
}

function VehicleCard({
  onEditPress,
  vehicle,
}: {
  onEditPress: () => void;
  vehicle: VehicleCardData;
}) {
  return (
    <Pressable
      onPress={onEditPress}
      style={({ pressed }) => [styles.vehicleCard, pressed && styles.vehicleCardPressed]}
    >
      {/* Car image — full width at top */}
      <View style={styles.vehicleImageContainer}>
        <VehicleCarImage imageUrl={vehicle.imageUrl} />
      </View>

      {/* Details section */}
      <VStack style={styles.vehicleCardBody}>
        <HStack alignItems="center" style={styles.vehicleNameRow}>
          <Text numberOfLines={1} style={[styles.vehicleName, styles.vehicleNameFlex]}>
            {vehicle.modelName}
          </Text>
          <Icon color="#94A3B8" name="chevron-forward" size={20} />
        </HStack>

        {vehicle.licensePlate ? (
          <HStack alignItems="center" style={styles.vehicleSpecRow}>
            <Icon color="#64748B" name="card-outline" size={13} />
            <Text style={styles.vehicleSpecLabel}>ทะเบียนรถ</Text>
            <Text style={styles.vehicleSpecValue}>{vehicle.licensePlate}</Text>
          </HStack>
        ) : null}

        {vehicle.color ? (
          <HStack alignItems="center" style={styles.vehicleSpecRow}>
            <Icon color="#64748B" name="color-palette-outline" size={13} />
            <Text style={styles.vehicleSpecLabel}>สีรถ</Text>
            <Text style={styles.vehicleSpecValue}>{vehicle.color}</Text>
          </HStack>
        ) : null}

        {vehicle.year ? (
          <HStack alignItems="center" style={styles.vehicleSpecRow}>
            <Icon color="#64748B" name="calendar-outline" size={13} />
            <Text style={styles.vehicleSpecLabel}>ปีผลิต</Text>
            <Text style={styles.vehicleSpecValue}>ปี {vehicle.year}</Text>
          </HStack>
        ) : null}

        {vehicle.batteryCapacity ? (
          <HStack alignItems="center" style={styles.vehicleSpecRow}>
            <Icon color="#F59E0B" name="battery-charging-outline" size={13} />
            <Text style={styles.vehicleSpecLabel}>ความจุแบตเตอรี่</Text>
            <Text style={styles.vehicleSpecValue}>{vehicle.batteryCapacity} kWh</Text>
          </HStack>
        ) : null}

        {vehicle.rangeKmMax ? (
          <HStack alignItems="center" style={styles.vehicleSpecRow}>
            <Icon color="#3B82F6" name="speedometer-outline" size={13} />
            <Text style={styles.vehicleSpecLabel}>ระยะทางต่อชาร์จเต็ม</Text>
            <Text style={styles.vehicleSpecValue}>{vehicle.rangeKmMax} km</Text>
          </HStack>
        ) : null}

        {vehicle.chargeType ? (
          <Box style={styles.vehicleChargeBadge}>
            <Text style={styles.vehicleChargeBadgeText}>
              {vehicle.chargeType.toUpperCase()}
            </Text>
          </Box>
        ) : null}
      </VStack>
    </Pressable>
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

function EmptyVehicleCard({ onAddPress }: { onAddPress: () => void }) {
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
      <Pressable onPress={onAddPress} style={styles.addVehicleButton}>
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
  onShowAll,
}: {
  booking: NextBookingCardData | null;
  isLoading: boolean;
  onShowAll?: () => void;
}) {
  return (
    <View style={styles.section}>
      <HStack alignItems="center" justifyContent="space-between">
        <Text style={styles.sectionTitle}>การจองครั้งถัดไป</Text>
        <Pressable onPress={onShowAll}>
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
    .filter((record): record is VehicleRecord => Boolean(record))
    .filter(record => !isCancelledBookingRecord(record));

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

function isCancelledBookingRecord(record: VehicleRecord) {
  const status = asRecord(record.status);
  const bookingType =
    getString(record.booking_type) ?? getString(record.bookingType);
  const statusCode =
    getString(status?.code) ??
    getString(record.status_code) ??
    getString(record.statusCode);
  const statusName =
    getString(status?.name) ??
    getString(record.status_name) ??
    getString(record.statusName) ??
    (typeof record.status === 'string' ? getString(record.status) : undefined);

  return [bookingType, statusCode, statusName].some(value => {
    const normalized = value?.trim().toUpperCase() ?? '';
    return normalized.includes('CANCEL') || normalized.includes('ยกเลิก');
  });
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

function extractEvCarDetails(response: unknown): Partial<VehicleCardData> {
  const record = asRecord(response);
  const dataRecord = asRecord(record?.data);
  const data =
    asRecord(dataRecord?.ev_car) ??
    asRecord(dataRecord?.evCar) ??
    dataRecord ??
    record;

  return {
    batteryCapacity:
      getNumber(data?.battery_capacity) ?? getNumber(data?.batteryCapacity),
    chargeType:
      getString(data?.charge_type) ?? getString(data?.chargeType),
    imageUrl:
      getString(data?.image_car_url) ??
      getString(data?.imageCarUrl) ??
      getString(data?.image_url) ??
      getString(data?.imageUrl),
    rangeKmMax:
      getNumber(data?.range_km) ?? getNumber(data?.rangeKm),
    year: getVehicleYear(data),
  };
}

function getFirstVehicle(response: unknown): VehicleWithCarId | null {
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

function getVehicleFromCandidate(candidate: unknown): VehicleWithCarId | null {
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

  const evCarId =
    getNumber(firstRecord.ev_car_id) ??
    getNumber(firstRecord.evCarId) ??
    getNumber(evCar?.id) ??
    getString(firstRecord.ev_car_id) ??
    getString(firstRecord.evCarId);

  const vehicleId = getNumber(firstRecord.id);

  return {
    batteryCapacity:
      getNumber(evCar?.battery_capacity) ?? getNumber(evCar?.batteryCapacity),
    batteryPercent:
      getNumber(firstRecord.battery_percent) ??
      getNumber(firstRecord.batteryPercent),
    chargeType:
      getString(evCar?.charge_type) ?? getString(evCar?.chargeType),
    color: getString(firstRecord.color),
    evCarId,
    imageUrl:
      getString(evCar?.image_car_url) ??
      getString(evCar?.imageCarUrl) ??
      getString(evCar?.image_url) ??
      getString(evCar?.imageUrl),
    licensePlate:
      getString(firstRecord.license_plate) ??
      getString(firstRecord.licensePlate),
    modelName: modelName || 'รถของฉัน',
    rangeKm:
      getNumber(firstRecord.range_km) ?? getNumber(firstRecord.rangeKm),
    rangeKmMax:
      getNumber(evCar?.range_km) ?? getNumber(evCar?.rangeKm),
    updatedAt:
      getTimeText(firstRecord.updated_at) ?? getTimeText(firstRecord.updatedAt),
    vehicleId,
    year: getVehicleYear(evCar),
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

function getVehicleYear(record: VehicleRecord | null) {
  if (!record) {
    return undefined;
  }

  return (
    getNumber(record.year) ??
    getNumber(record.model_year) ??
    getNumber(record.modelYear) ??
    getNumber(record.manufacture_year) ??
    getNumber(record.manufactureYear) ??
    getNumber(record.production_year) ??
    getNumber(record.productionYear)
  );
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
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
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
    fontSize: 48,
    fontWeight: '800',
    lineHeight: 54,
  },
  vehicleBatteryLabel: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  vehicleBatteryLabelRow: {
    gap: 5,
  },
  vehicleBatterySection: {
    gap: 6,
    paddingBottom: 14,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  vehicleBatteryValue: {
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 26,
  },
  vehicleCardBody: {
    gap: 3,
    padding: 14,
    paddingTop: 10,
  },
  vehicleCarImage: {
    height: 160,
    width: '100%',
  },
  vehicleCarImageEmpty: {
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    height: 160,
    justifyContent: 'center',
    width: '100%',
  },
  vehicleImageContainer: {
    backgroundColor: '#F8FAFC',
    borderBottomColor: '#F1F5F9',
    borderBottomWidth: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    paddingTop: 16,
  },
  vehicleChargeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    marginTop: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  vehicleChargeBadgeText: {
    color: '#16A34A',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 15,
  },
  vehicleDivider: {
    backgroundColor: '#F1F5F9',
    height: 1,
  },
  vehicleRangeRow: {
    marginTop: 2,
  },
  vehicleRangeValue: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  vehicleSpecLabel: {
    color: '#64748B',
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  vehicleSpecRow: {
    gap: 5,
    paddingVertical: 3,
  },
  vehicleSpecValue: {
    color: '#0F172A',
    flexShrink: 0,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 20,
    minWidth: 82,
    textAlign: 'right',
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
    paddingBottom: 18,
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
    backgroundColor: colors.white,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
    minHeight: 138,
    padding: 18,
    shadowColor: '#0F172A',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
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
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderWidth: 1,
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
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
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
    backgroundColor: 'rgba(255,255,255,0.24)',
    borderRadius: 4,
    height: 8,
    marginTop: 3,
    overflow: 'hidden',
    width: '100%',
  },
  range: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 36,
  },
  rangeRow: {
    gap: 5,
    marginTop: 12,
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
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 26,
    marginTop: 2,
  },
  searchBox: {
    backgroundColor: colors.white,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    borderWidth: 1,
    elevation: 4,
    gap: 12,
    marginTop: 18,
    minHeight: 60,
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 8,
    shadowColor: '#0F172A',
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  searchInput: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    padding: 0,
  },
  filterButton: {
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  shortcutCard: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderWidth: 1,
    elevation: 3,
    flex: 1,
    height: 92,
    justifyContent: 'center',
    paddingHorizontal: 4,
    shadowColor: '#0F172A',
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
  },
  shortcutGrid: {
    gap: 10,
    marginTop: 16,
  },
  shortcutIcon: {
    alignItems: 'center',
    borderRadius: 18,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  shortcutLabel: {
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
    marginTop: 7,
    minHeight: 16,
    textAlign: 'center',
  },
  section: {
    marginTop: 22,
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
    borderColor: '#E2E8F0',
    borderRadius: 18,
    borderWidth: 1,
    elevation: 4,
    marginTop: 10,
    padding: 10,
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
    marginTop: 10,
  },
  vehicleCard: {
    backgroundColor: colors.white,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    borderWidth: 1,
    elevation: 5,
    marginTop: 14,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.09,
    shadowRadius: 18,
  },
  vehicleCardPressed: {
    opacity: 0.88,
  },
  vehicleName: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  vehicleNameFlex: {
    flex: 1,
  },
  vehicleNameRow: {
    alignItems: 'center',
    gap: 4,
  },
});
