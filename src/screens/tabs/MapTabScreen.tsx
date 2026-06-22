import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import type { Region } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';

import { Icon, Text, HStack, VStack } from '../../components/ui';
import { colors } from '../../constants/theme';
import { ChargingStationApi } from '../../services/api';
import { AddBookingModal, type EditableBooking } from '../AddBookingModal';

type StatusTone = 'available' | 'busy' | 'offline' | 'neutral';

type MapStation = {
  address?: string;
  availableChargers?: number;
  chargeType?: string;
  distanceKm?: number;
  id: number | string;
  imageUrl?: string;
  lat: number;
  long: number;
  name: string;
  powerMaxKw?: number;
  powerMinKw?: number;
  rating?: number;
  reviewCount?: number;
  statusLabel?: string;
  statusTone: StatusTone;
  totalChargers?: number;
};

type FilterKey = 'all' | 'DC' | 'AC' | 'CCS2' | 'CHAdeMO' | 'available';

type MapTabScreenProps = {
  userId?: number;
  username?: string;
};

const DEFAULT_REGION: Region = {
  latitude: 13.7563,
  latitudeDelta: 0.08,
  longitude: 100.5018,
  longitudeDelta: 0.08,
};

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'DC', label: 'DC' },
  { key: 'AC', label: 'AC' },
  { key: 'CCS2', label: 'CCS2' },
  { key: 'CHAdeMO', label: 'CHAdeMO' },
  { key: 'available', label: 'ว่าง' },
];

const chargingStationApi = new ChargingStationApi();

export function MapTabScreen({ userId, username }: MapTabScreenProps) {
  const mapRef = useRef<MapView>(null);
  const [bookingDraft, setBookingDraft] = useState<EditableBooking | null>(null);
  const [stations, setStations] = useState<MapStation[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState<MapStation | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [searchText, setSearchText] = useState('');

  const loadStations = useCallback(async () => {
    setIsLoading(true);
    try {
      let parsed: MapStation[] = [];

      try {
        const coords = await getCurrentCoordinates();
        const nearbyResponse = await chargingStationApi.nearby({
          lat: coords.lat,
          long: coords.long,
          radius: 50,
        });
        parsed = parseStations(nearbyResponse);
      } catch {
        // ignore — fall through to list
      }

      if (parsed.length === 0) {
        try {
          const listResponse = await chargingStationApi.list();
          parsed = parseStations(listResponse);
        } catch {
          // ignore
        }
      }

      setStations(parsed);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStations();
  }, [loadStations]);

  const centerOnUser = useCallback(async () => {
    const coords = await getCurrentCoordinates();
    mapRef.current?.animateToRegion(
      {
        latitude: coords.lat,
        latitudeDelta: 0.04,
        longitude: coords.long,
        longitudeDelta: 0.04,
      },
      400,
    );
  }, []);

  const filteredStations = useMemo(() => {
    return stations.filter(station => {
      if (searchText) {
        const q = searchText.toLowerCase();
        const matchName = station.name.toLowerCase().includes(q);
        const matchAddr = station.address?.toLowerCase().includes(q) ?? false;
        if (!matchName && !matchAddr) {
          return false;
        }
      }

      if (activeFilter === 'available') {
        return station.statusTone === 'available';
      }

      if (activeFilter !== 'all') {
        const ct = station.chargeType?.toUpperCase() ?? '';
        return ct.includes(activeFilter);
      }

      return true;
    });
  }, [stations, activeFilter, searchText]);

  useEffect(() => {
    if (!isMapReady || isLoading) {
      return;
    }

    if (filteredStations.length === 0) {
      mapRef.current?.animateToRegion(DEFAULT_REGION, 350);
      return;
    }

    if (filteredStations.length === 1) {
      const station = filteredStations[0];
      mapRef.current?.animateToRegion(
        {
          latitude: station.lat,
          latitudeDelta: 0.035,
          longitude: station.long,
          longitudeDelta: 0.035,
        },
        450,
      );
      return;
    }

    mapRef.current?.fitToCoordinates(
      filteredStations.map(station => ({
        latitude: station.lat,
        longitude: station.long,
      })),
      {
        animated: true,
        edgePadding: {
          bottom: 180,
          left: 60,
          right: 60,
          top: 170,
        },
      },
    );
  }, [filteredStations, isLoading, isMapReady]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        initialRegion={DEFAULT_REGION}
        loadingEnabled
        mapType="standard"
        moveOnMarkerPress={false}
        onMapReady={() => setIsMapReady(true)}
        onPress={() => setSelectedStation(null)}
        provider={PROVIDER_GOOGLE}
        showsMyLocationButton={false}
        showsUserLocation
        style={styles.map}
      >
        {filteredStations.map(station => (
          <Marker
            key={String(station.id)}
            coordinate={{ latitude: station.lat, longitude: station.long }}
            onPress={event => {
              event.stopPropagation();
              setSelectedStation(station);
              mapRef.current?.animateToRegion(
                {
                  latitude: station.lat,
                  latitudeDelta: 0.025,
                  longitude: station.long,
                  longitudeDelta: 0.025,
                },
                300,
              );
            }}
          >
            <StationMarker
              isSelected={selectedStation?.id === station.id}
              tone={station.statusTone}
            />
          </Marker>
        ))}
      </MapView>

      {/* Search + filter overlay */}
      <View style={styles.topOverlay}>
        <HStack alignItems="center" style={styles.searchBar}>
          <Icon color="#475569" name="search-outline" size={20} />
          <TextInput
            onChangeText={setSearchText}
            placeholder="ค้นหาสถานี หรือสถานที่"
            placeholderTextColor="#94A3B8"
            returnKeyType="search"
            style={styles.searchInput}
            value={searchText}
          />
          <Pressable style={styles.filterIconBtn}>
            <Icon color="#0F172A" name="options-outline" size={20} />
          </Pressable>
        </HStack>

        <ScrollView
          contentContainerStyle={styles.filterRow}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          {FILTERS.map(f => {
            const isActive = activeFilter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setActiveFilter(f.key)}
                style={[styles.chip, isActive && styles.chipActive]}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Right-side controls */}
      <View style={styles.rightControls}>
        <Pressable onPress={centerOnUser} style={styles.mapControlBtn}>
          <Icon color="#0F172A" name="locate-outline" size={22} />
        </Pressable>
      </View>

      {/* Loading spinner */}
      {isLoading ? (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={styles.loadingText}>กำลังโหลดสถานีชาร์จ...</Text>
          </View>
        </View>
      ) : null}

      {!isLoading && filteredStations.length === 0 ? (
        <View style={styles.emptyOverlay} pointerEvents="none">
          <View style={styles.emptyBox}>
            <Icon color="#94A3B8" name="map-outline" size={22} />
            <Text style={styles.emptyText}>ไม่พบสถานีชาร์จในเงื่อนไขนี้</Text>
          </View>
        </View>
      ) : null}

      {/* Station detail card */}
      {selectedStation ? (
        <StationCard
          onClose={() => setSelectedStation(null)}
          onBook={station => {
            setBookingDraft(toBookingDraft(station));
            setSelectedStation(null);
          }}
          station={selectedStation}
        />
      ) : null}

      <AddBookingModal
        initialBooking={bookingDraft}
        onClose={() => setBookingDraft(null)}
        onSuccess={() => {
          setBookingDraft(null);
        }}
        userId={userId}
        username={username}
        visible={Boolean(bookingDraft)}
      />
    </View>
  );
}

// ─── Marker ─────────────────────────────────────────────────────────────────

function StationMarker({
  isSelected,
  tone,
}: {
  isSelected: boolean;
  tone: StatusTone;
}) {
  const bg = markerColor(tone);
  const size = isSelected ? 44 : 36;
  const iconSize = isSelected ? 22 : 18;

  return (
    <View style={styles.markerWrapper}>
      <View
        style={[
          styles.markerCircle,
          { backgroundColor: bg, height: size, width: size },
        ]}
      >
        <Icon color="#FFFFFF" name="flash" size={iconSize} />
      </View>
      <View style={[styles.markerTail, { borderTopColor: bg }]} />
    </View>
  );
}

// ─── Station card ────────────────────────────────────────────────────────────

function StationCard({
  onClose,
  onBook,
  station,
}: {
  onClose: () => void;
  onBook: (station: MapStation) => void;
  station: MapStation;
}) {
  const primaryPowerLabel = buildPrimaryPowerLabel(station);
  const secondaryPowerLabel = buildSecondaryPowerLabel(station);
  const ratingLabel = buildRatingLabel(station);

  return (
    <Pressable onPress={onClose} style={styles.cardContainer}>
      <Pressable onPress={event => event.stopPropagation()} style={styles.card}>
        <HStack style={styles.cardContent}>
          <StationThumb imageUrl={station.imageUrl} />

          <VStack flex={1} style={styles.cardInfo} space="sm">
            <HStack alignItems="flex-start" justifyContent="space-between">
              <Text numberOfLines={2} style={styles.cardName}>
                {station.name}
              </Text>
              <Pressable style={styles.heartBtn}>
                <Icon color="#94A3B8" name="heart-outline" size={28} />
              </Pressable>
            </HStack>

            {station.address ? (
              <Text numberOfLines={1} style={styles.cardAddress}>
                {station.address}
              </Text>
            ) : null}

            {station.distanceKm !== undefined ? (
              <HStack alignItems="center" style={styles.distanceRow}>
                <Text style={styles.distanceText}>
                  {station.distanceKm.toFixed(1)} กม. จากคุณ
                </Text>
              </HStack>
            ) : null}

            {ratingLabel ? (
              <HStack alignItems="center" style={styles.ratingRow}>
                <Icon color="#F59E0B" name="star" size={14} />
                <Text style={styles.ratingText}>{ratingLabel}</Text>
              </HStack>
            ) : null}

            <HStack style={styles.badgeRow}>
              {primaryPowerLabel ? (
                <View style={styles.badgeDC}>
                  <Text style={styles.badgeDCText}>{primaryPowerLabel}</Text>
                </View>
              ) : null}
              {secondaryPowerLabel ? (
                <View style={styles.badgeAC}>
                  <Text style={styles.badgeACText}>{secondaryPowerLabel}</Text>
                </View>
              ) : null}
            </HStack>
          </VStack>
        </HStack>

        <Pressable onPress={() => onBook(station)} style={styles.bookBtn}>
          <Text style={styles.bookBtnText}>จองตอนนี้</Text>
        </Pressable>
      </Pressable>
    </Pressable>
  );
}

function toBookingDraft(station: MapStation): EditableBooking {
  return {
    id: 0,
    stationAddress: station.address,
    stationId:
      typeof station.id === 'number'
        ? station.id
        : Number.isFinite(Number(station.id))
          ? Number(station.id)
          : undefined,
    stationName: station.name,
  };
}

function StationThumb({ imageUrl }: { imageUrl?: string }) {
  const [hasError, setHasError] = useState(false);

  if (!imageUrl || hasError) {
    return (
      <View style={styles.thumbPlaceholder}>
        <Icon color="#94A3B8" name="flash" size={28} />
      </View>
    );
  }

  return (
    <Image
      onError={() => setHasError(true)}
      resizeMode="cover"
      source={{ uri: imageUrl }}
      style={styles.thumb}
    />
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function markerColor(tone: StatusTone): string {
  if (tone === 'available') return '#16B968';
  if (tone === 'busy') return '#F59E0B';
  if (tone === 'offline') return '#94A3B8';
  return '#64748B';
}

function buildPrimaryPowerLabel(station: MapStation): string | undefined {
  const type = station.chargeType?.toUpperCase().includes('AC') ? 'AC' : 'DC';
  const available = station.availableChargers ?? station.totalChargers;

  if (station.powerMaxKw !== undefined) {
    const chargers = available !== undefined ? ` (${available} ว่าง)` : '';
    return `${type} ${station.powerMaxKw} kW${chargers}`;
  }

  if (station.powerMinKw !== undefined) {
    return `${type} ${station.powerMinKw} kW`;
  }

  return station.chargeType?.toUpperCase();
}

function buildSecondaryPowerLabel(station: MapStation): string | undefined {
  const available = station.availableChargers ?? station.totalChargers;
  const chargeType = station.chargeType?.toUpperCase() ?? '';

  if (chargeType.includes('AC')) {
    return undefined;
  }

  return available !== undefined ? `AC ${available} ว่าง` : 'AC';
}

function buildRatingLabel(station: MapStation): string | undefined {
  if (station.rating === undefined) {
    return undefined;
  }

  return station.reviewCount !== undefined
    ? `${station.rating.toFixed(1)} (${station.reviewCount})`
    : station.rating.toFixed(1);
}

function getStatusTone(statusLabel: string | undefined): StatusTone {
  const s = statusLabel?.toLowerCase().trim() ?? '';
  if (!s) return 'neutral';
  if (
    s.includes('พร้อม') ||
    s.includes('available') ||
    s.includes('active') ||
    s.includes('online') ||
    s === 'ok'
  ) {
    return 'available';
  }
  if (s.includes('busy') || s.includes('charging') || s.includes('ใช้งาน')) {
    return 'busy';
  }
  if (
    s.includes('offline') ||
    s.includes('error') ||
    s.includes('fault') ||
    s.includes('maintenance') ||
    s.includes('เสีย') ||
    s.includes('inactive')
  ) {
    return 'offline';
  }
  return 'neutral';
}

type AnyRecord = Record<string, unknown>;

function parseStations(response: unknown): MapStation[] {
  const records = extractRecords(response);
  return records
    .map(r => asRecord(r))
    .filter((r): r is AnyRecord => r !== null)
    .map(mapRecord)
    .filter((s): s is MapStation => s !== null);
}

function mapRecord(record: AnyRecord): MapStation | null {
  const name =
    getString(record.name) ??
    getString(record.station_name) ??
    getString(record.stationName);
  const lat =
    getNumber(record.lat) ??
    getNumber(record.latitude) ??
    getNumber(record.location_lat);
  const long =
    getNumber(record.long) ??
    getNumber(record.lng) ??
    getNumber(record.longitude) ??
    getNumber(record.location_long) ??
    getNumber(record.location_lng);

  if (!name || lat === undefined || long === undefined) {
    return null;
  }

  const status = asRecord(record.status) ?? asRecord(record.station_status);
  const statusLabel =
    getString(status?.name) ??
    getString(status?.label) ??
    getString(record.status_name) ??
    getString(record.statusName) ??
    getString(record.status);

  return {
    address: getString(record.address),
    availableChargers:
      getNumber(record.available_chargers) ??
      getNumber(record.availableChargers) ??
      getNumber(record.available),
    chargeType:
      getString(record.charge_type) ?? getString(record.chargeType),
    distanceKm:
      getNumber(record.distance_km) ??
      getNumber(record.distanceKm) ??
      getNumber(record.distance),
    id: getNumber(record.id) ?? getString(record.id) ?? String(lat + long),
    imageUrl:
      getString(record.image_url) ??
      getString(record.imageUrl) ??
      getString(record.photo_url) ??
      getString(record.photoUrl),
    lat,
    long,
    name,
    powerMaxKw:
      getNumber(record.power_max_kw) ?? getNumber(record.powerMaxKw),
    powerMinKw:
      getNumber(record.power_min_kw) ?? getNumber(record.powerMinKw),
    rating:
      getNumber(record.rating) ??
      getNumber(record.rating_avg) ??
      getNumber(record.ratingAvg) ??
      getNumber(record.avg_rating) ??
      getNumber(record.avgRating),
    reviewCount:
      getNumber(record.review_count) ??
      getNumber(record.reviewCount) ??
      getNumber(record.rating_count) ??
      getNumber(record.ratingCount),
    statusLabel,
    statusTone: getStatusTone(statusLabel),
    totalChargers:
      getNumber(record.total_chargers) ?? getNumber(record.totalChargers),
  };
}

function extractRecords(response: unknown): unknown[] {
  const rec = asRecord(response);
  const data = asRecord(rec?.data);
  const candidates = [
    data?.items,
    data?.rows,
    data?.data,
    data?.stations,
    data?.chargingStations,
    data?.charging_stations,
    rec?.items,
    rec?.rows,
    rec?.data,
    rec?.stations,
    rec?.chargingStations,
    rec?.charging_stations,
    response,
  ];

  for (const c of candidates) {
    if (Array.isArray(c)) {
      return c;
    }
  }

  return [];
}

async function getCurrentCoordinates(): Promise<{ lat: number; long: number }> {
  const hasPermission = await requestLocationPermission();

  if (!hasPermission) {
    return { lat: DEFAULT_REGION.latitude, long: DEFAULT_REGION.longitude };
  }

  return new Promise(resolve => {
    Geolocation.getCurrentPosition(
      pos =>
        resolve({ lat: pos.coords.latitude, long: pos.coords.longitude }),
      () =>
        resolve({ lat: DEFAULT_REGION.latitude, long: DEFAULT_REGION.longitude }),
      { enableHighAccuracy: true, maximumAge: 60000, timeout: 10000 },
    );
  });
}

async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    return new Promise(resolve => {
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

function asRecord(value: unknown): AnyRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as AnyRecord;
}

function getString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function getNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const n = Number(value);
    if (Number.isFinite(n)) {
      return n;
    }
  }
  return undefined;
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  badgeAC: {
    backgroundColor: '#DBEAFE',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  badgeACText: {
    color: '#1D4ED8',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 15,
  },
  badgeDC: {
    backgroundColor: '#DCFCE7',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  badgeDCText: {
    color: '#16A34A',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 15,
  },
  badgeRow: {
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  bookBtn: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    marginTop: 12,
  },
  bookBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    elevation: 12,
    padding: 10,
    shadowColor: '#0F172A',
    shadowOffset: { height: -4, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
  },
  cardAddress: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 16,
  },
  cardContainer: {
    bottom: 0,
    left: 0,
    paddingBottom: 12,
    paddingHorizontal: 14,
    position: 'absolute',
    right: 0,
    top: 0,
    justifyContent: 'flex-end',
  },
  cardContent: {
    alignItems: 'flex-start',
    gap: 12,
  },
  cardInfo: {
    flex: 1,
    minWidth: 0,
  },
  cardName: {
    color: '#0F172A',
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 21,
    paddingRight: 6,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  distanceRow: {
    marginTop: 1,
  },
  distanceText: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 16,
  },
  emptyBox: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 14,
    borderWidth: 1,
    elevation: 5,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#0F172A',
    shadowOffset: { height: 3, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  emptyOverlay: {
    alignItems: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 190,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  filterIconBtn: {
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  filterRow: {
    alignItems: 'center',
    paddingLeft: 2,
    paddingRight: 8,
    paddingVertical: 4,
  },
  filterScroll: {
    marginTop: 8,
  },
  heartBtn: {
    paddingLeft: 4,
  },
  loadingBox: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    elevation: 6,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#0F172A',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  loadingOverlay: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'flex-end',
    left: 0,
    paddingBottom: 120,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  loadingText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  mapControlBtn: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    elevation: 4,
    height: 46,
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { height: 3, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    width: 46,
  },
  markerCircle: {
    alignItems: 'center',
    borderRadius: 999,
    elevation: 4,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  markerTail: {
    alignSelf: 'center',
    borderLeftColor: 'transparent',
    borderLeftWidth: 6,
    borderRightColor: 'transparent',
    borderRightWidth: 6,
    borderTopWidth: 9,
    height: 0,
    width: 0,
  },
  markerWrapper: {
    alignItems: 'center',
  },
  ratingRow: {
    gap: 4,
  },
  ratingText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  rightControls: {
    gap: 10,
    position: 'absolute',
    right: 14,
    top: 130,
  },
  searchBar: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderWidth: 1,
    elevation: 6,
    gap: 10,
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 8,
    shadowColor: '#0F172A',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  searchInput: {
    color: '#0F172A',
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    padding: 0,
  },
  thumb: {
    borderRadius: 9,
    height: 118,
    width: 118,
  },
  thumbPlaceholder: {
    alignItems: 'center',
    backgroundColor: '#EEF2F7',
    borderRadius: 9,
    height: 118,
    justifyContent: 'center',
    width: 118,
  },
  topOverlay: {
    left: 0,
    paddingHorizontal: 14,
    paddingTop: 10,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
