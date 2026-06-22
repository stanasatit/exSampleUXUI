import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { Icon, Text, HStack, VStack } from '../../components/ui';
import { colors, spacing } from '../../constants/theme';
import { BookingApi } from '../../services/api';
import { AddBookingModal, type EditableBooking } from '../AddBookingModal';

type FilterKey = 'all' | 'pending' | 'upcoming' | 'completed' | 'cancelled';
type BookingStatus = 'pending' | 'upcoming' | 'completed' | 'cancelled';

type BookingItem = {
  address: string;
  bookingDate?: string;
  bookingTypeLabel?: string;
  chargeConnectors?: number;
  chargeType: string;
  countdown?: string;
  day: number;
  endTime?: string;
  energyKwh?: number;
  id: number;
  imageUrl?: string;
  monthShort: string;
  note?: string;
  notifiedAt?: string;
  status: BookingStatus;
  startTime?: string;
  stationId?: number;
  stationStatusLabel?: string;
  stationName: string;
  timeRange: string;
  totalCost?: number;
  vehicleColor?: string;
  vehicleId?: number;
  vehicleLabel?: string;
  vehiclePlate?: string;
  year: number;
};

type BookingTabScreenProps = {
  userId?: number;
  username?: string;
};

type AnyRecord = Record<string, unknown>;

const bookingApi = new BookingApi();

const BOOKING_STATUS_CANCELLED = 'CANCELLED';
const BOOKING_STATUS_PENDING = 'PENDING';
const BOOKING_STATUS_UPCOMING = 'UPCOMING';
const UPCOMING_PROMOTION_THRESHOLD_MS = 15 * 60 * 1000;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'pending', label: 'รอดำเนินการ' },
  { key: 'upcoming', label: 'กำลังจะถึง' },
  { key: 'completed', label: 'เสร็จสิ้น' },
  { key: 'cancelled', label: 'ยกเลิก' },
];

const SECTION_ORDER: BookingStatus[] = [
  'pending',
  'upcoming',
  'completed',
  'cancelled',
];

const SECTION_LABELS: Record<BookingStatus, string> = {
  cancelled: 'ยกเลิก',
  completed: 'เสร็จสิ้น',
  pending: 'รอดำเนินการ',
  upcoming: 'กำลังจะถึง',
};

const BOOKING_TYPE_LABELS: Record<string, string> = {
  CANCELLED: 'ยกเลิก',
  PENDING: 'รอดำเนินการ',
  SCHEDULED: 'จองล่วงหน้า',
  UPCOMING: 'กำลังจะถึง',
  WALKIN: 'จองหน้างาน',
};

// ─── helpers ────────────────────────────────────────────────────────────────

function asRecord(value: unknown): AnyRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as AnyRecord;
}

function getString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function getNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function getTimePart(value: unknown): string | undefined {
  const text = getString(value);
  if (!text) return undefined;
  if (/^\d{1,2}:\d{2}/.test(text)) return text.slice(0, 5);
  // ISO datetime → extract HH:MM
  try {
    const d = new Date(text);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    }
  } catch {
    // ignore
  }
  return undefined;
}

function getRecordsFromResponse(response: unknown): unknown[] {
  const record = asRecord(response);
  const dataRecord = asRecord(record?.data);

  const candidates = [
    dataRecord?.bookings,
    dataRecord?.items,
    dataRecord?.rows,
    dataRecord?.data,
    dataRecord?.statuses,
    record?.bookings,
    record?.items,
    record?.rows,
    record?.data,
    record?.statuses,
    response,
  ];

  for (const c of candidates) {
    if (Array.isArray(c)) return c;
  }

  const firstRecord = candidates.map(c => asRecord(c)).find(Boolean);
  return firstRecord ? [firstRecord] : [];
}

function classifyStatus(
  bookingType: string | undefined,
  statusName: string | undefined,
  statusCode: string | undefined,
  bookingDate: string | undefined,
  startTime: string | undefined,
): BookingStatus {
  const type = bookingType?.trim().toUpperCase() ?? '';
  const norm = statusName?.trim().toLowerCase() ?? '';
  const code = statusCode?.trim().toUpperCase() ?? '';

  if (
    type.includes('CANCEL') ||
    code.includes('CANCEL') ||
    norm.includes('cancel') ||
    norm.includes('ยกเลิก') ||
    norm === 'cancelled'
  ) {
    return 'cancelled';
  }

  if (
    type.includes('COMPLET') ||
    type.includes('FINISH') ||
    type === 'DONE' ||
    type === 'PAID' ||
    type === 'SUCCESS' ||
    code.includes('COMPLET') ||
    code.includes('FINISH') ||
    code === 'DONE' ||
    code === 'PAID' ||
    code === 'SUCCESS' ||
    norm.includes('complet') ||
    norm.includes('finish') ||
    norm.includes('เสร็จ') ||
    norm.includes('done') ||
    norm.includes('paid') ||
    norm.includes('success')
  ) {
    return 'completed';
  }

  if (
    type === 'PENDING' ||
    type === 'WAITING' ||
    code === 'PENDING' ||
    code === 'WAITING' ||
    norm.includes('pending') ||
    norm.includes('รอดำเนินการ')
  ) {
    return 'pending';
  }

  if (
    type === 'UPCOMING' ||
    type === 'CONFIRMED' ||
    type === 'RESERVED' ||
    type === 'BOOKED' ||
    code === 'AVAILABLE' ||
    code === 'CONFIRMED' ||
    code === 'UPCOMING' ||
    code === 'RESERVED' ||
    code === 'BOOKED' ||
    norm.includes('พร้อมใช้งาน') ||
    norm.includes('กำลังจะถึง') ||
    norm.includes('ยืนยัน')
  ) {
    return 'upcoming';
  }

  // Date-based fallback is used only when the API status is not explicit.
  if (bookingDate && startTime) {
    const target = new Date(`${bookingDate}T${startTime}:00`);
    if (!Number.isNaN(target.getTime()) && target.getTime() < Date.now()) {
      return 'completed';
    }
  }

  return 'upcoming';
}

function buildChargeTypeLabel(
  chargeType: string | undefined,
  powerKw: number | undefined,
): string {
  const type = chargeType ? chargeType.toUpperCase() : 'DC';
  return powerKw !== undefined ? `${type} ${powerKw} kW` : type;
}

function getBookingTypeLabel(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return BOOKING_TYPE_LABELS[value.toUpperCase()] ?? value;
}

function getVehicleLabel(record: AnyRecord): string | undefined {
  const vehicle = asRecord(record.vehicle);
  const brand = getString(vehicle?.brand) ?? getString(record.brand);
  const model = getString(vehicle?.model) ?? getString(record.model);
  const nickname = getString(vehicle?.nickname) ?? getString(record.nickname);

  if (nickname) return nickname;
  return [brand, model].filter(Boolean).join(' ') || undefined;
}

function formatThaiDateTime(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return undefined;

  const dateText = date.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timeText = date.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `${dateText} ${timeText} น.`;
}

function getRemainingText(
  bookingDate: string | undefined,
  startTime: string | undefined,
): string | undefined {
  const diffMs = getMsUntilBookingStart(bookingDate, startTime);
  if (diffMs === undefined) return undefined;
  if (diffMs <= 0) return '00:00:00';
  const totalSeconds = Math.floor(diffMs / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  //const s = totalSeconds % 60;
  return [h, m].map(v => String(v).padStart(2, '0')).join(':');
}

function getMsUntilBookingStart(
  bookingDate: string | undefined,
  startTime: string | undefined,
): number | undefined {
  if (!bookingDate || !startTime) return undefined;
  const target = new Date(`${bookingDate}T${startTime}:00`).getTime();
  if (Number.isNaN(target)) return undefined;

  return target - Date.now();
}

function mapRecordToBookingItem(record: AnyRecord): BookingItem | null {
  const station =
    asRecord(record.station) ?? asRecord(record.charging_station);

  const stationName =
    getString(station?.name) ??
    getString(record.station_name) ??
    getString(record.stationName);

  if (!stationName) return null;

  const id = getNumber(record.id) ?? Math.floor(Math.random() * 1e9);
  const bookingDate =
    getString(record.booking_date) ??
    getString(record.bookingDate) ??
    getString(record.date);
  const startTime =
    getTimePart(record.start_time) ?? getTimePart(record.startTime);
  const endTime = getTimePart(record.end_time) ?? getTimePart(record.endTime);
  const bookingType = getString(record.booking_type) ?? getString(record.bookingType);

  const statusObj = asRecord(record.status);
  const statusName =
    getString(statusObj?.name) ??
    getString(record.status_name) ??
    getString(record.statusName) ??
    (typeof record.status === 'string' ? getString(record.status) : undefined);
  const statusCode =
    getString(statusObj?.code) ??
    getString(record.status_code) ??
    getString(record.statusCode);

  const bookingStatus = classifyStatus(
    bookingType,
    statusName,
    statusCode,
    bookingDate,
    startTime,
  );

  const chargeType =
    getString(station?.charge_type) ??
    getString(record.charge_type) ??
    getString(station?.chargeType);
  const powerMax =
    getNumber(station?.power_max_kw) ??
    getNumber(station?.powerMaxKw) ??
    getNumber(station?.power_kw) ??
    getNumber(record.power_max_kw);
  const chargeTypeLabel = buildChargeTypeLabel(chargeType, powerMax);

  const connectorId =
    getNumber(record.connector_id) ?? getNumber(record.connectorId);
  const totalChargers =
    getNumber(station?.total_chargers) ??
    getNumber(station?.totalChargers) ??
    getNumber(record.total_chargers);
  const chargeConnectors = connectorId ?? totalChargers;
  const vehicle = asRecord(record.vehicle);
  const stationStatusLabel =
    getString(record.status_name) ??
    getString(record.statusName) ??
    getString(record.station_status_name) ??
    getString(record.stationStatusName);

  const imageUrl =
    getString(station?.image_url) ??
    getString(station?.imageUrl) ??
    getString(station?.photo_url) ??
    getString(record.station_image_url);

  // Date parts
  let day = 0;
  let monthShort = '--';
  let year = 0;
  if (bookingDate) {
    const d = new Date(bookingDate);
    if (!Number.isNaN(d.getTime())) {
      day = d.getDate();
      monthShort = d.toLocaleDateString('th-TH', { month: 'short' });
      year = d.getFullYear() + 543; // convert to Buddhist Era
    }
  }

  // Time range
  const timeRange =
    startTime && endTime
      ? `${startTime} - ${endTime} น.`
      : startTime
        ? `${startTime} น.`
        : '-';

  // Countdown for upcoming
  const countdown =
    bookingStatus === 'upcoming'
      ? getRemainingText(bookingDate, startTime)
      : undefined;

  // Session data for completed
  const session =
    asRecord(record.charging_session) ?? asRecord(record.session);
  const energyKwh =
    getNumber(session?.energy_kwh) ??
    getNumber(session?.energyKwh) ??
    getNumber(record.energy_kwh);
  const totalCost =
    getNumber(session?.total_fee) ??
    getNumber(session?.totalFee) ??
    getNumber(session?.fee_total) ??
    getNumber(session?.amount) ??
    getNumber(record.total_fee) ??
    getNumber(record.amount);

  return {
    address:
      getString(station?.address) ??
      getString(record.station_address) ??
      getString(record.stationAddress) ??
      getString(record.address) ??
      '',
    bookingDate,
    bookingTypeLabel: getBookingTypeLabel(bookingType),
    chargeConnectors,
    chargeType: chargeTypeLabel,
    countdown,
    day,
    endTime,
    energyKwh,
    id,
    imageUrl,
    monthShort,
    note: getString(record.note),
    notifiedAt: formatThaiDateTime(
      getString(record.notify_end_sent_at) ?? getString(record.notifyEndSentAt),
    ),
    status: bookingStatus,
    startTime,
    stationId:
      getNumber(record.station_id) ??
      getNumber(record.stationId) ??
      getNumber(station?.id),
    stationStatusLabel,
    stationName,
    timeRange,
    totalCost,
    vehicleColor: getString(vehicle?.color) ?? getString(record.color),
    vehicleId:
      getNumber(record.vehicle_id) ??
      getNumber(record.vehicleId) ??
      getNumber(vehicle?.id),
    vehicleLabel: getVehicleLabel(record),
    vehiclePlate:
      getString(vehicle?.license_plate) ??
      getString(vehicle?.licensePlate) ??
      getString(record.license_plate) ??
      getString(record.licensePlate),
    year,
  };
}

function parseBookings(response: unknown): BookingItem[] {
  return getRecordsFromResponse(response)
    .map(r => asRecord(r))
    .filter((r): r is AnyRecord => Boolean(r))
    .map(mapRecordToBookingItem)
    .filter((item): item is BookingItem => Boolean(item));
}

function getChargeTypeColor(chargeType: string) {
  return chargeType.startsWith('AC') ? '#0284C7' : '#0F766E';
}

function toEditableBooking(item: BookingItem): EditableBooking {
  return {
    bookingDate: item.bookingDate,
    bookingType:
      item.status === 'pending'
        ? BOOKING_STATUS_PENDING
        : item.status === 'cancelled'
          ? BOOKING_STATUS_CANCELLED
          : item.status === 'upcoming'
            ? BOOKING_STATUS_UPCOMING
            : undefined,
    endTime: item.endTime,
    id: item.id,
    note: item.note,
    startTime: item.startTime,
    stationAddress: item.address,
    stationId: item.stationId,
    stationName: item.stationName,
    vehicleId: item.vehicleId,
    vehicleName: item.vehicleLabel,
    vehiclePlate: item.vehiclePlate,
  };
}

// ─── sub-components ──────────────────────────────────────────────────────────

function BookingCard({
  item,
  onEdit,
}: {
  item: BookingItem;
  onEdit: (item: BookingItem) => void;
}) {
  const statusLabel =
    item.status === 'pending'
      ? 'รอดำเนินการ'
      : item.status === 'upcoming'
      ? 'ยืนยันแล้ว'
      : item.status === 'completed'
        ? 'เสร็จสิ้น'
        : 'ยกเลิกแล้ว';

  const statusColor =
    item.status === 'pending'
      ? colors.warning
      : item.status === 'upcoming'
      ? colors.primary
      : item.status === 'completed'
        ? '#64748B'
        : '#EF4444';

  return (
    <Pressable
      onPress={() => onEdit(item)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      {/* Top: image + station info */}
      <HStack style={styles.cardTop} alignItems="center">
        <View style={styles.stationImageWrapper}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.stationImage}
            />
          ) : (
            <View style={styles.stationImageFallback}>
              <Icon name="flash-outline" size={26} color="#94A3B8" />
            </View>
          )}
        </View>

        <VStack style={styles.cardInfo} space="xs">
          <Text style={styles.stationName}>{item.stationName}</Text>
          {item.address ? (
            <Text style={styles.stationAddress} numberOfLines={1}>
              {item.address}
            </Text>
          ) : null}
          <HStack alignItems="center" space="sm" style={styles.stationMetaRow}>
            <View
              style={[
                styles.chargeBadge,
                { backgroundColor: getChargeTypeColor(item.chargeType) },
              ]}
            >
              <Text style={styles.chargeBadgeText}>{item.chargeType}</Text>
            </View>
            {item.chargeConnectors !== undefined && item.chargeConnectors > 0 ? (
              <Text style={styles.connectorText}>
                หัวชาร์จ {item.chargeConnectors}
              </Text>
            ) : null}
            {item.bookingTypeLabel ? (
              <Text numberOfLines={1} style={styles.bookingTypeText}>
                {item.bookingTypeLabel}
              </Text>
            ) : null}
          </HStack>
        </VStack>

        <View style={styles.editIconCircle}>
          <Icon name="create-outline" size={18} color="#64748B" />
        </View>
      </HStack>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Bottom: date + time + status */}
      <HStack style={styles.cardBottom} alignItems="flex-start">
        <VStack alignItems="center" style={styles.dateBlock}>
          <Text style={styles.dateDay}>{item.day || '--'}</Text>
          <Text style={styles.dateMonth}>{item.monthShort}</Text>
          {item.year > 0 ? (
            <Text style={styles.dateYear}>{item.year}</Text>
          ) : null}
        </VStack>

        <VStack style={styles.bookingDetails} space="xs">
          <HStack justifyContent="space-between" alignItems="center">
            <Text style={styles.timeText}>{item.timeRange}</Text>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusLabel}
            </Text>
          </HStack>

          {item.vehicleLabel || item.vehiclePlate ? (
            <View style={styles.vehiclePanel}>
              <HStack alignItems="center" style={styles.vehicleHeader}>
                <Icon name="car-sport-outline" size={16} color="#475569" />
                <Text style={styles.vehicleTitle} numberOfLines={1}>
                  {item.vehicleLabel ?? 'รถของคุณ'}
                </Text>
              </HStack>
              <HStack alignItems="center" style={styles.vehicleMetaRow}>
                {item.vehiclePlate ? (
                  <Text style={styles.plateText}>{item.vehiclePlate}</Text>
                ) : null}
                {item.vehicleColor ? (
                  <Text style={styles.vehicleColorText}>
                    สี{item.vehicleColor}
                  </Text>
                ) : null}
              </HStack>
            </View>
          ) : null}

          {item.stationStatusLabel ? (
            <HStack alignItems="center" style={styles.infoRow}>
              <Icon name="checkmark-circle-outline" size={15} color="#0F766E" />
              <Text style={styles.infoText}>
                สถานี: {item.stationStatusLabel}
              </Text>
            </HStack>
          ) : null}

          {item.status === 'upcoming' && item.countdown ? (
            <Text style={styles.countdownText}>
              เหลืออีก{' '}
              <Text style={styles.countdownValue}>{item.countdown}</Text>{' '}
              ก่อนถึงเวลานัด
            </Text>
          ) : null}

          {item.status === 'completed' &&
          item.energyKwh !== undefined &&
          item.totalCost !== undefined ? (
            <HStack justifyContent="space-between" alignItems="center">
              <Text style={styles.energyText}>
                ชาร์จไป {item.energyKwh} kWh
              </Text>
              <Text style={styles.costText}>
                ฿ {item.totalCost.toFixed(2)}
              </Text>
            </HStack>
          ) : null}

          {item.status === 'completed' && item.notifiedAt ? (
            <HStack alignItems="center" style={styles.infoRow}>
              <Icon name="notifications-outline" size={15} color="#64748B" />
              <Text style={styles.infoText}>
                แจ้งเตือนสิ้นสุดแล้ว {item.notifiedAt}
              </Text>
            </HStack>
          ) : null}
        </VStack>
      </HStack>
    </Pressable>
  );
}

// ─── main screen ─────────────────────────────────────────────────────────────

export function BookingTabScreen({ userId, username }: BookingTabScreenProps) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [editingBooking, setEditingBooking] = useState<EditableBooking | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const promotingBookingIdsRef = useRef<Set<number>>(new Set());

  const promotePendingBookings = useCallback(
    (items: BookingItem[]) => {
      const candidates = items.filter(item => {
        if (item.status !== 'pending') return false;
        if (promotingBookingIdsRef.current.has(item.id)) return false;

        const msUntilStart = getMsUntilBookingStart(
          item.bookingDate,
          item.startTime,
        );

        return (
          msUntilStart !== undefined &&
          msUntilStart > 0 &&
          msUntilStart <= UPCOMING_PROMOTION_THRESHOLD_MS
        );
      });

      if (candidates.length === 0) return;

      candidates.forEach(item => promotingBookingIdsRef.current.add(item.id));

      Promise.all(
        candidates.map(async item => {
          try {
            const response = (await bookingApi.update(item.id, {
              booking_type: BOOKING_STATUS_UPCOMING,
              username,
            })) as AnyRecord;

            return response?.success === false ? null : item.id;
          } catch {
            return null;
          } finally {
            promotingBookingIdsRef.current.delete(item.id);
          }
        }),
      ).then(promotedIds => {
        const promotedIdSet = new Set(
          promotedIds.filter((id): id is number => typeof id === 'number'),
        );

        if (promotedIdSet.size === 0) return;

        setBookings(current =>
          current.map(item =>
            promotedIdSet.has(item.id)
              ? {
                  ...item,
                  countdown: getRemainingText(item.bookingDate, item.startTime),
                  status: 'upcoming',
                }
              : item,
          ),
        );
      });
    },
    [username],
  );

  const loadBookings = useCallback(() => {
    let isMounted = true;
    setIsLoading(true);

    const request = userId
      ? bookingApi.listByUserId(userId)
      : bookingApi.list();

    request
      .then(response => {
        if (isMounted) {
          const parsedBookings = parseBookings(response);
          setBookings(parsedBookings);
          promotePendingBookings(parsedBookings);
        }
      })
      .catch(err => {
        console.warn('Unable to load bookings:', err);
        if (isMounted) setBookings([]);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [promotePendingBookings, userId]);

  useEffect(() => {
    return loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      promotePendingBookings(bookings);
    }, 60 * 1000);

    return () => clearInterval(intervalId);
  }, [bookings, promotePendingBookings]);

  const filterStatusMap: Record<FilterKey, BookingStatus | null> = {
    all: null,
    cancelled: 'cancelled',
    completed: 'completed',
    pending: 'pending',
    upcoming: 'upcoming',
  };

  const visibleSections = SECTION_ORDER.map(status => ({
    items: bookings.filter(b =>
      activeFilter === 'all'
        ? b.status === status
        : b.status === status && b.status === filterStatusMap[activeFilter],
    ),
    status,
  })).filter(s => s.items.length > 0);

  const hasNoData =
    !isLoading &&
    (activeFilter === 'all'
      ? bookings.length === 0
      : bookings.filter(b => b.status === filterStatusMap[activeFilter])
          .length === 0);

  return (
    <VStack style={styles.container}>
      {/* Page title + add button */}
      <HStack
        alignItems="center"
        justifyContent="space-between"
        style={styles.titleRow}
      >
        <Text style={styles.pageTitle}>รายการจองคิว</Text>
        <Pressable
          onPress={() => {
            setEditingBooking(null);
            setIsAddModalVisible(true);
          }}
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.addButtonPressed,
          ]}
        >
          <Icon name="add" size={18} color={colors.white} />
          <Text style={styles.addButtonText}>เพิ่มจองคิว</Text>
        </Pressable>
      </HStack>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={styles.filterScroll}
      >
        {FILTERS.map(f => {
          const isActive = activeFilter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => setActiveFilter(f.key)}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
            >
              <Text
                style={[
                  styles.filterLabel,
                  isActive && styles.filterLabelActive,
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Content */}
      {isLoading ? (
        <VStack
          alignItems="center"
          justifyContent="center"
          style={styles.loadingState}
        >
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>กำลังโหลดข้อมูล</Text>
        </VStack>
      ) : hasNoData ? (
        <VStack
          alignItems="center"
          justifyContent="center"
          style={styles.emptyState}
        >
          <View style={styles.emptyIconWrapper}>
            <Icon name="calendar-outline" size={40} color="#94A3B8" />
          </View>
          <Text style={styles.emptyTitle}>ไม่พบข้อมูลการจอง</Text>
          <Text style={styles.emptySubtitle}>
            เมื่อคุณทำการจองแล้ว รายการจะแสดงที่นี่
          </Text>
        </VStack>
      ) : (
        <ScrollView
          style={styles.listScroll}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {visibleSections.map(({ status, items }) => (
            <VStack key={status} style={styles.section}>
              <Text style={styles.sectionHeader}>
                {SECTION_LABELS[status]}
              </Text>
              {items.map(item => (
                <BookingCard
                  key={item.id}
                  item={item}
                  onEdit={selectedItem => {
                    setEditingBooking(toEditableBooking(selectedItem));
                    setIsAddModalVisible(true);
                  }}
                />
              ))}
            </VStack>
          ))}
        </ScrollView>
      )}

      <AddBookingModal
        initialBooking={editingBooking}
        onClose={() => {
          setIsAddModalVisible(false);
          setEditingBooking(null);
        }}
        onSuccess={loadBookings}
        userId={userId}
        username={username}
        visible={isAddModalVisible}
      />
    </VStack>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  bookingDetails: {
    flex: 1,
  },
  bookingTypeText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  card: {
    backgroundColor: colors.white,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardBottom: {
    gap: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.base,
  },
  cardInfo: {
    flex: 1,
  },
  cardPressed: {
    opacity: 0.88,
  },
  cardTop: {
    gap: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.base,
  },
  chargeBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chargeBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
  },
  connectorText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  costText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 20,
  },
  countdownText: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
  },
  countdownValue: {
    color: '#0F172A',
    fontWeight: '700',
  },
  dateBlock: {
    minWidth: 44,
  },
  dateDay: {
    color: '#0F172A',
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 30,
  },
  dateMonth: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  dateYear: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 16,
  },
  divider: {
    backgroundColor: '#F1F5F9',
    height: 1,
    marginHorizontal: spacing.md,
  },
  emptyIconWrapper: {
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 30,
    height: 60,
    justifyContent: 'center',
    width: 60,
  },
  emptyState: {
    flex: 1,
    gap: 10,
    paddingBottom: 60,
  },
  emptySubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  emptyTitle: {
    color: '#334155',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  editIconCircle: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  energyText: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 20,
  },
  infoRow: {
    gap: 6,
    paddingTop: 2,
  },
  infoText: {
    color: '#64748B',
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  filterChip: {
    borderColor: '#E2E8F0',
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterLabel: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  filterLabelActive: {
    color: colors.white,
  },
  filterRow: {
    gap: 8,
    paddingHorizontal: spacing.sm,
  },
  filterScroll: {
    flexGrow: 0,
    marginBottom: spacing.md,
  },
  listContent: {
    gap: 0,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  listScroll: {
    flex: 1,
  },
  loadingState: {
    flex: 1,
    gap: 12,
    paddingBottom: 60,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addButtonPressed: {
    opacity: 0.82,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  pageTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 27,
  },
  titleRow: {
    marginBottom: spacing.md,
    marginLeft: spacing.md,
    marginRight: spacing.md,
  },
  section: {
    gap: 10,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  stationAddress: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 17,
  },
  stationImage: {
    height: '100%',
    width: '100%',
  },
  stationImageFallback: {
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    flex: 1,
    justifyContent: 'center',
  },
  stationImageWrapper: {
    borderRadius: 10,
    height: 72,
    overflow: 'hidden',
    width: 88,
  },
  stationMetaRow: {
    flexWrap: 'wrap',
    rowGap: 4,
  },
  stationName: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 20,
  },
  timeText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 20,
  },
  plateText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  vehicleColorText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  vehicleHeader: {
    gap: 6,
  },
  vehicleMetaRow: {
    gap: 8,
    marginTop: 2,
  },
  vehiclePanel: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  vehicleTitle: {
    color: '#334155',
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
});
