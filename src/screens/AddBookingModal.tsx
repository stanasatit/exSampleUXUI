import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppAlertDialog, AppDatePicker, HStack, Icon, Text, VStack } from '../components/ui';
import { colors, spacing } from '../constants/theme';
import {
  BookingApi,
  ChargingStationApi,
  UserVehicleApi,
} from '../services/api';

// ─── types ───────────────────────────────────────────────────────────────────

type AnyRecord = Record<string, unknown>;

type StationItem = { id: number; name: string; address?: string };
type VehicleItem = { id: number; name: string; licensePlate?: string };

type DialogState =
  | null
  | { kind: 'error'; message: string }
  | { kind: 'success'; message: string; title: string }
  | { kind: 'cancelConfirm' };

export type EditableBooking = {
  bookingDate?: string;
  bookingType?: string;
  endTime?: string;
  id: number;
  note?: string;
  startTime?: string;
  stationAddress?: string;
  stationId?: number;
  stationName?: string;
  vehicleId?: number;
  vehicleName?: string;
  vehiclePlate?: string;
};

export type AddBookingModalProps = {
  initialBooking?: EditableBooking | null;
  onClose: () => void;
  onSuccess: () => void;
  userId?: number;
  username?: string;
  visible: boolean;
};

// ─── api instances ────────────────────────────────────────────────────────────

const bookingApi = new BookingApi();
const chargingStationApi = new ChargingStationApi();
const userVehicleApi = new UserVehicleApi();

const BOOKING_STATUS_CANCELLED = 'CANCELLED';
const BOOKING_STATUS_PENDING = 'PENDING';

// ─── helpers ─────────────────────────────────────────────────────────────────

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

function getListFromResponse(response: unknown): unknown[] {
  const r = asRecord(response);
  const d = asRecord(r?.data);
  const candidates = [
    d?.items,
    d?.rows,
    d?.data,
    d?.statuses,
    d?.stations,
    d?.vehicles,
    d?.user_vehicles,
    d?.userVehicles,
    d?.bookings,
    r?.items,
    r?.rows,
    r?.data,
    r?.statuses,
    r?.stations,
    r?.vehicles,
    r?.user_vehicles,
    r?.userVehicles,
    r?.bookings,
    response,
  ];
  for (const c of candidates) {
    if (Array.isArray(c)) return c;
  }
  const first = candidates.map(c => asRecord(c)).find(Boolean);
  return first ? [first] : [];
}

function parseStations(response: unknown): StationItem[] {
  const result: StationItem[] = [];
  for (const item of getListFromResponse(response)) {
    const r = asRecord(item);
    if (!r) continue;
    const id = getNumber(r.id);
    const name =
      getString(r.name) ??
      getString(r.station_name) ??
      getString(r.stationName);
    if (!id || !name) continue;
    result.push({ address: getString(r.address), id, name });
  }
  return result;
}

function parseVehicles(response: unknown): VehicleItem[] {
  const result: VehicleItem[] = [];

  for (const item of getListFromResponse(response)) {
    const r = asRecord(item);
    if (!r) continue;

    const id = getNumber(r.id);
    if (!id) continue;

    const brand = getString(r.brand);
    const model = getString(r.model);

    const licensePlate =
      getString(r.license_plate) ?? getString(r.licensePlate);

    const carName = [brand, model].filter(Boolean).join(' ');

    const name =
      carName && licensePlate
        ? `${carName} (${licensePlate})`
        : carName || (licensePlate ? `รถ ${licensePlate}` : 'รถของฉัน');

    result.push({ id, licensePlate, name });
  }

  return result;
}

// Thai date from AppDatePicker (DD-MM-BBBB) → ISO (YYYY-MM-DD)
function thaiPickerToISO(value: string): string {
  const parts = value.split('-').map(Number);
  if (parts.length !== 3) return '';
  const [day, month, bYear] = parts;
  const year = bYear > 2400 ? bYear - 543 : bYear;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ISO (YYYY-MM-DD) → Thai picker format (DD-MM-BBBB)
function isoToThaiPicker(value: string): string {
  const parts = value.split('-').map(Number);
  if (parts.length !== 3) return '';
  const [year, month, day] = parts;
  return `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year + 543}`;
}

function todayISO(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

// ─── SelectSheet ─────────────────────────────────────────────────────────────

type SelectSheetProps<T extends { id: number; name: string }> = {
  items: T[];
  isLoading: boolean;
  onClose: () => void;
  onSelect: (item: T) => void;
  renderSub?: (item: T) => string | undefined;
  title: string;
  visible: boolean;
};

function SelectSheet<T extends { id: number; name: string }>({
  items,
  isLoading,
  onClose,
  onSelect,
  renderSub,
  title,
  visible,
}: SelectSheetProps<T>) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? items.filter(i =>
      i.name.toLowerCase().includes(search.toLowerCase()),
    )
    : items;

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <Pressable onPress={onClose} style={sheet.overlay}>
        <Pressable style={[sheet.panel, { paddingBottom: insets.bottom + 8 }]}>
          {/* Handle */}
          <View style={sheet.handle} />

          {/* Header */}
          <HStack alignItems="center" justifyContent="space-between" style={sheet.header}>
            <Text style={sheet.title}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Icon name="close" size={22} color="#64748B" />
            </Pressable>
          </HStack>

          {/* Search */}
          <HStack alignItems="center" style={sheet.searchBox}>
            <Icon name="search-outline" size={18} color="#94A3B8" />
            <TextInput
              onChangeText={setSearch}
              placeholder="ค้นหา..."
              placeholderTextColor="#94A3B8"
              style={sheet.searchInput}
              value={search}
            />
          </HStack>

          {/* List */}
          {isLoading ? (
            <View style={sheet.loadingBox}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={item => String(item.id)}
              style={sheet.list}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onSelect(item);
                    setSearch('');
                    onClose();
                  }}
                  style={({ pressed }) => [sheet.option, pressed && sheet.optionPressed]}
                >
                  <Text style={sheet.optionName}>{item.name}</Text>
                  {renderSub?.(item) ? (
                    <Text style={sheet.optionSub}>{renderSub(item)}</Text>
                  ) : null}
                </Pressable>
              )}
              ListEmptyComponent={
                <View style={sheet.emptyBox}>
                  <Text style={sheet.emptyText}>ไม่พบข้อมูล</Text>
                </View>
              }
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── TimePicker ──────────────────────────────────────────────────────────────

type TimePickerProps = {
  disabled?: boolean;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
};

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

function AppTimePicker({
  disabled = false,
  onChange,
  placeholder = 'HH:MM',
  value,
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState(value.split(':')[0] || '08');
  const [selectedMinute, setSelectedMinute] = useState(value.split(':')[1] || '00');

  const handleOpen = () => {
    if (disabled) return;

    if (value) {
      setSelectedHour(value.split(':')[0] || '08');
      setSelectedMinute(value.split(':')[1] || '00');
    }
    setIsOpen(true);
  };

  const handleConfirm = () => {
    onChange(`${selectedHour}:${selectedMinute}`);
    setIsOpen(false);
  };

  return (
    <>
      <Pressable
        disabled={disabled}
        onPress={handleOpen}
        style={({ pressed }) => [
          timePicker.shell,
          disabled && timePicker.disabledShell,
          pressed && timePicker.pressed,
        ]}
      >
        <Icon name="time-outline" size={20} color={colors.muted} />
        <Text style={[timePicker.value, !value && timePicker.placeholder]}>
          {value || placeholder}
        </Text>
        {disabled ? null : (
          <Icon name="chevron-down" size={18} color={colors.muted} />
        )}
      </Pressable>

      <Modal
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
        statusBarTranslucent
        transparent
        visible={isOpen}
      >
        <View style={timePicker.overlay}>
          <View style={timePicker.panel}>
            <Text style={timePicker.panelTitle}>เลือกเวลา</Text>

            {/* Hours */}
            <Text style={timePicker.sectionLabel}>ชั่วโมง</Text>
            <View style={timePicker.grid}>
              {HOURS.map(h => (
                <Pressable
                  key={h}
                  onPress={() => setSelectedHour(h)}
                  style={[
                    timePicker.cell,
                    selectedHour === h && timePicker.cellSelected,
                  ]}
                >
                  <Text
                    style={[
                      timePicker.cellText,
                      selectedHour === h && timePicker.cellTextSelected,
                    ]}
                  >
                    {h}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Minutes */}
            <Text style={timePicker.sectionLabel}>นาที</Text>
            <HStack style={timePicker.minuteRow}>
              {MINUTES.map(m => (
                <Pressable
                  key={m}
                  onPress={() => setSelectedMinute(m)}
                  style={[
                    timePicker.minuteCell,
                    selectedMinute === m && timePicker.cellSelected,
                  ]}
                >
                  <Text
                    style={[
                      timePicker.cellText,
                      selectedMinute === m && timePicker.cellTextSelected,
                    ]}
                  >
                    {m}
                  </Text>
                </Pressable>
              ))}
            </HStack>

            {/* Preview */}
            <Text style={timePicker.preview}>
              {selectedHour}:{selectedMinute}
            </Text>

            {/* Actions */}
            <HStack justifyContent="space-between" style={timePicker.footer}>
              <Pressable
                onPress={() => setIsOpen(false)}
                style={timePicker.cancelBtn}
              >
                <Text style={timePicker.cancelText}>ยกเลิก</Text>
              </Pressable>
              <Pressable onPress={handleConfirm} style={timePicker.confirmBtn}>
                <Text style={timePicker.confirmText}>ยืนยัน</Text>
              </Pressable>
            </HStack>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ─── FormRow ─────────────────────────────────────────────────────────────────

function FormRow({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <VStack style={form.row}>
      <HStack alignItems="center" style={form.labelRow}>
        <Text style={form.label}>{label}</Text>
        {required ? <Text style={form.required}> *</Text> : null}
      </HStack>
      {children}
    </VStack>
  );
}

// ─── SelectField ─────────────────────────────────────────────────────────────

function SelectField({
  disabled = false,
  onPress,
  placeholder,
  value,
}: {
  disabled?: boolean;
  onPress: () => void;
  placeholder: string;
  value?: string;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        form.selectField,
        disabled && form.selectFieldDisabled,
        pressed && form.fieldPressed,
      ]}
    >
      <Text style={[form.selectText, !value && form.selectPlaceholder]} numberOfLines={1}>
        {value || placeholder}
      </Text>
      {disabled ? null : <Icon name="chevron-down" size={18} color={colors.muted} />}
    </Pressable>
  );
}

// ─── AddBookingModal ──────────────────────────────────────────────────────────

export function AddBookingModal({
  initialBooking,
  onClose,
  onSuccess,
  userId,
  username,
  visible,
}: AddBookingModalProps) {
  const insets = useSafeAreaInsets();
  const isEditMode = Boolean(initialBooking);
  const isCancelledBooking =
    initialBooking?.bookingType?.trim().toUpperCase() ===
    BOOKING_STATUS_CANCELLED;

  // master data
  const [stations, setStations] = useState<StationItem[]>([]);
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [isLoadingStations, setIsLoadingStations] = useState(false);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);

  // form
  const [selectedStation, setSelectedStation] = useState<StationItem | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleItem | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [note, setNote] = useState('');

  // sheet visibility
  const [stationSheetOpen, setStationSheetOpen] = useState(false);
  const [vehicleSheetOpen, setVehicleSheetOpen] = useState(false);

  // submit
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialog, setDialog] = useState<DialogState>(null);

  // ── load master data ────────────────────────────────────────────────────────

  const loadMasterData = useCallback(() => {
    setIsLoadingStations(true);
    chargingStationApi
      .list()
      .then(res => setStations(parseStations(res)))
      .catch(() => setStations([]))
      .finally(() => setIsLoadingStations(false));

    setIsLoadingVehicles(true);
    const vehicleRequest = userId
      ? userVehicleApi.listByUserId(userId)
      : userVehicleApi.list();
    vehicleRequest
      .then(res => setVehicles(parseVehicles(res)))
      .catch(() => setVehicles([]))
      .finally(() => setIsLoadingVehicles(false));
  }, [userId]);

  // reset form and load data when modal opens
  useEffect(() => {
    if (!visible) return;
    setSelectedStation(
      initialBooking?.stationId && initialBooking.stationName
        ? {
            address: initialBooking.stationAddress,
            id: initialBooking.stationId,
            name: initialBooking.stationName,
          }
        : null,
    );
    setSelectedVehicle(
      initialBooking?.vehicleId
        ? {
            id: initialBooking.vehicleId,
            licensePlate: initialBooking.vehiclePlate,
            name:
              initialBooking.vehicleName ??
              (initialBooking.vehiclePlate
                ? `รถ ${initialBooking.vehiclePlate}`
                : 'รถของฉัน'),
          }
        : null,
    );
    setBookingDate(
      initialBooking?.bookingDate
        ? isoToThaiPicker(initialBooking.bookingDate)
        : isoToThaiPicker(todayISO()),
    );
    setStartTime(initialBooking?.startTime ?? '');
    setEndTime(initialBooking?.endTime ?? '');
    setNote(initialBooking?.note ?? '');
    setDialog(null);
    loadMasterData();
  }, [initialBooking, visible, loadMasterData]);

  useEffect(() => {
    if (!visible || !initialBooking) return;

    if (initialBooking.stationId && stations.length > 0) {
      const matchedStation = stations.find(s => s.id === initialBooking.stationId);
      if (matchedStation) {
        setSelectedStation(matchedStation);
      }
    }

    if (initialBooking.vehicleId && vehicles.length > 0) {
      const matchedVehicle = vehicles.find(v => v.id === initialBooking.vehicleId);
      if (matchedVehicle) {
        setSelectedVehicle(matchedVehicle);
      }
    }
  }, [initialBooking, stations, vehicles, visible]);

  // ── submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!selectedStation) {
      setDialog({ kind: 'error', message: 'กรุณาเลือกสถานีชาร์จ' });
      return;
    }
    if (!selectedVehicle && userId) {
      setDialog({ kind: 'error', message: 'กรุณาเลือกรถของคุณ' });
      return;
    }
    if (!bookingDate) {
      setDialog({ kind: 'error', message: 'กรุณาเลือกวันที่จอง' });
      return;
    }
    if (!startTime) {
      setDialog({ kind: 'error', message: 'กรุณาเลือกเวลาเริ่มต้น' });
      return;
    }
    if (!endTime) {
      setDialog({ kind: 'error', message: 'กรุณาเลือกเวลาสิ้นสุด' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        booking_date: thaiPickerToISO(bookingDate),
        booking_type:
          isEditMode && initialBooking?.bookingType
            ? initialBooking.bookingType
            : BOOKING_STATUS_PENDING,
        end_time: endTime,
        note: note.trim() || undefined,
        start_time: startTime,
        station_id: selectedStation.id,
        user_id: userId,
        username: username,
        vehicle_id: selectedVehicle?.id,
      };

      const response =
        isEditMode && initialBooking
          ? ((await bookingApi.update(initialBooking.id, payload)) as AnyRecord)
          : ((await bookingApi.create(payload)) as AnyRecord);

      if (response?.success === false) {
        const msg =
          getString(response.message) ??
          getString(response.error) ??
          'เกิดข้อผิดพลาด กรุณาลองใหม่';
        setDialog({ kind: 'error', message: msg });
        return;
      }

      setDialog({
        kind: 'success',
        message: isEditMode
          ? 'แก้ไขการจองคิวสำเร็จแล้ว'
          : 'บันทึกการจองคิวเป็นสถานะรอดำเนินการแล้ว',
        title: isEditMode ? 'แก้ไขสำเร็จ!' : 'จองคิวสำเร็จ!',
      });
    } catch {
      setDialog({ kind: 'error', message: 'ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!initialBooking) return;

    setIsSubmitting(true);
    try {
      const response = (await bookingApi.update(initialBooking.id, {
        booking_type: BOOKING_STATUS_CANCELLED,
        username,
      })) as AnyRecord;

      if (response?.success === false) {
        const msg =
          getString(response.message) ??
          getString(response.error) ??
          'เกิดข้อผิดพลาด กรุณาลองใหม่';
        setDialog({ kind: 'error', message: msg });
        return;
      }

      setDialog({
        kind: 'success',
        message: 'ยกเลิกการจองคิวสำเร็จแล้ว',
        title: 'ยกเลิกสำเร็จ!',
      });
    } catch {
      setDialog({ kind: 'error', message: 'ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <Modal
        animationType="slide"
        onRequestClose={onClose}
        statusBarTranslucent
        transparent={false}
        visible={visible}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoid}
        >
          <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <HStack
              alignItems="center"
              justifyContent="space-between"
              style={styles.header}
            >
              <Pressable onPress={onClose} hitSlop={12} style={styles.headerBtn}>
                <Icon name="close" size={24} color="#334155" />
              </Pressable>
              <Text style={styles.headerTitle}>
                {isEditMode ? 'แก้ไขการจองคิว' : 'เพิ่มการจองคิว'}
              </Text>
              <View style={styles.headerBtn} />
            </HStack>

            <ScrollView
              contentContainerStyle={styles.formContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* สถานีชาร์จ */}
              <FormRow label="สถานีชาร์จ" required>
                <SelectField
                  disabled={isCancelledBooking}
                  onPress={() => setStationSheetOpen(true)}
                  placeholder="เลือกสถานีชาร์จ"
                  value={
                    selectedStation
                      ? `${selectedStation.name}${selectedStation.address ? ` · ${selectedStation.address}` : ''}`
                      : undefined
                  }
                />
              </FormRow>

              {/* รถของคุณ */}
              <FormRow label="รถของคุณ" required>
                <SelectField
                  disabled={isCancelledBooking}
                  onPress={() => setVehicleSheetOpen(true)}
                  placeholder="เลือกรถของคุณ"
                  value={
                    selectedVehicle
                      ? `${selectedVehicle.name}`
                      : undefined
                  }
                />
              </FormRow>

              {/* วันที่จอง */}
              <FormRow label="วันที่จอง" required>
                <AppDatePicker
                  disabled={isCancelledBooking}
                  minDate={
                    isEditMode &&
                    initialBooking?.bookingDate &&
                    initialBooking.bookingDate < todayISO()
                      ? initialBooking.bookingDate
                      : todayISO()
                  }
                  onChange={setBookingDate}
                  placeholder="เลือกวันที่"
                  value={bookingDate}
                />
              </FormRow>

              {/* เวลา */}
              <HStack style={form.timeRow}>
                <VStack style={form.timeHalf}>
                  <FormRow label="เวลาเริ่มต้น" required>
                    <AppTimePicker
                      disabled={isCancelledBooking}
                      onChange={setStartTime}
                      placeholder="เช่น 10:00"
                      value={startTime}
                    />
                  </FormRow>
                </VStack>
                <VStack style={form.timeHalf}>
                  <FormRow label="เวลาสิ้นสุด" required>
                    <AppTimePicker
                      disabled={isCancelledBooking}
                      onChange={setEndTime}
                      placeholder="เช่น 11:00"
                      value={endTime}
                    />
                  </FormRow>
                </VStack>
              </HStack>

              {/* หมายเหตุ */}
              <FormRow label="หมายเหตุ">
                <TextInput
                  editable={!isCancelledBooking}
                  multiline
                  numberOfLines={3}
                  onChangeText={setNote}
                  placeholder="เพิ่มหมายเหตุ (ไม่บังคับ)"
                  placeholderTextColor="#94A3B8"
                  style={[
                    form.noteInput,
                    isCancelledBooking && form.inputDisabled,
                  ]}
                  textAlignVertical="top"
                  value={note}
                />
              </FormRow>
            </ScrollView>

            {/* Submit button */}
            <View
              style={[
                styles.footer,
                { paddingBottom: insets.bottom + spacing.md },
              ]}
            >
              {isCancelledBooking ? (
                <View style={styles.readOnlyNotice}>
                  <Icon name="close-circle-outline" size={18} color={colors.danger} />
                  <Text style={styles.readOnlyNoticeText}>
                    รายการนี้ถูกยกเลิกแล้ว ไม่สามารถแก้ไขได้
                  </Text>
                </View>
              ) : (
                <>
              {isEditMode ? (
                <Pressable
                  disabled={isSubmitting}
                  onPress={() => setDialog({ kind: 'cancelConfirm' })}
                  style={({ pressed }) => [
                    styles.cancelBookingBtn,
                    pressed && styles.cancelBookingBtnPressed,
                    isSubmitting && styles.submitBtnDisabled,
                  ]}
                >
                  <Icon name="close-circle-outline" size={18} color={colors.danger} />
                  <Text style={styles.cancelBookingText}>ยกเลิกการจอง</Text>
                </Pressable>
              ) : null}

              <Pressable
                disabled={isSubmitting}
                onPress={handleSubmit}
                style={({ pressed }) => [
                  styles.submitBtn,
                  pressed && styles.submitBtnPressed,
                  isSubmitting && styles.submitBtnDisabled,
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <>
                    <Icon name="calendar" size={18} color={colors.white} />
                    <Text style={styles.submitText}>
                      {isEditMode ? 'บันทึกการแก้ไข' : 'ยืนยันการจอง'}
                    </Text>
                  </>
                )}
              </Pressable>
                </>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Station selector */}
      <SelectSheet
        isLoading={isLoadingStations}
        items={stations}
        onClose={() => setStationSheetOpen(false)}
        onSelect={setSelectedStation}
        renderSub={s => s.address}
        title="เลือกสถานีชาร์จ"
        visible={stationSheetOpen}
      />

      {/* Vehicle selector */}
      <SelectSheet
        isLoading={isLoadingVehicles}
        items={vehicles}
        onClose={() => setVehicleSheetOpen(false)}
        onSelect={setSelectedVehicle}
        renderSub={v => v.licensePlate}
        title="เลือกรถของคุณ"
        visible={vehicleSheetOpen}
      />

      {/* Dialogs */}
      <AppAlertDialog
        confirmText="ตกลง"
        message={dialog?.kind === 'error' ? dialog.message : ''}
        onConfirm={() => setDialog(null)}
        title="เกิดข้อผิดพลาด"
        type="error"
        visible={dialog?.kind === 'error'}
      />

      <AppAlertDialog
        cancelText="ไม่ยกเลิก"
        confirmText="ยืนยันยกเลิก"
        message="ต้องการยกเลิกการจองคิวนี้ใช่หรือไม่?"
        onCancel={() => setDialog(null)}
        onConfirm={() => {
          setDialog(null);
          handleCancelBooking();
        }}
        title="ยืนยันการยกเลิก"
        type="warning"
        visible={dialog?.kind === 'cancelConfirm'}
      />

      <AppAlertDialog
        confirmText="ตกลง"
        message={dialog?.kind === 'success' ? dialog.message : ''}
        onConfirm={() => {
          setDialog(null);
          onSuccess();
          onClose();
        }}
        title={dialog?.kind === 'success' ? dialog.title : ''}
        type="success"
        visible={dialog?.kind === 'success'}
      />
    </>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FAFC',
    flex: 1,
  },
  footer: {
    backgroundColor: colors.white,
    borderTopColor: '#F1F5F9',
    borderTopWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  header: {
    backgroundColor: colors.white,
    borderBottomColor: '#F1F5F9',
    borderBottomWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  headerBtn: {
    width: 40,
  },
  headerTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
  },
  keyboardAvoid: {
    flex: 1,
  },
  formContent: {
    gap: 0,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  readOnlyNotice: {
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: spacing.md,
  },
  readOnlyNoticeText: {
    color: colors.danger,
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
    textAlign: 'center',
  },
  cancelBookingBtn: {
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    minHeight: 50,
  },
  cancelBookingBtnPressed: {
    backgroundColor: '#FEE2E2',
  },
  cancelBookingText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  submitBtn: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 54,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnPressed: {
    backgroundColor: colors.primaryPressed,
  },
  submitText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
});

const form = StyleSheet.create({
  fieldPressed: {
    opacity: 0.82,
  },
  inputDisabled: {
    backgroundColor: '#F8FAFC',
    opacity: 0.72,
  },
  label: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  labelRow: {
    marginBottom: 0
  },
  noteInput: {
    backgroundColor: colors.white,
    borderColor: '#DADDE2',
    borderRadius: 12,
    borderWidth: 1,
    color: '#0F172A',
    fontSize: 15,
    minHeight: 150,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  required: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '800',
  },
  row: {
    marginBottom: spacing.sm,
  },
  selectField: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: '#DADDE2',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  selectFieldDisabled: {
    backgroundColor: '#F8FAFC',
    opacity: 0.72,
  },
  selectPlaceholder: {
    color: '#9CA3AF',
  },
  selectText: {
    color: '#0F172A',
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  timeHalf: {
    flex: 1,
  },
  timeRow: {
    gap: 12,
  },
});

const sheet = StyleSheet.create({
  emptyBox: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: '#CBD5E1',
    borderRadius: 3,
    height: 4,
    marginBottom: spacing.base,
    width: 40,
  },
  header: {
    marginBottom: spacing.base,
  },
  list: {
    maxHeight: 360,
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  option: {
    borderBottomColor: '#F1F5F9',
    borderBottomWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  optionName: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
  optionPressed: {
    backgroundColor: '#F8FAFC',
  },
  optionSub: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  overlay: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  searchBox: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginBottom: spacing.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    color: '#0F172A',
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  title: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
});

const timePicker = StyleSheet.create({
  cancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.lg,
  },
  cancelText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
  },
  cell: {
    alignItems: 'center',
    borderRadius: 8,
    height: 36,
    justifyContent: 'center',
    marginBottom: 4,
    width: `${100 / 6}%`,
  },
  cellSelected: {
    backgroundColor: colors.primary,
  },
  cellText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
  },
  cellTextSelected: {
    color: colors.white,
  },
  confirmBtn: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 9,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.lg,
  },
  confirmText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  footer: {
    marginTop: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  minuteCell: {
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
    height: 40,
    justifyContent: 'center',
  },
  minuteRow: {
    gap: 6,
    marginTop: 6,
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  panel: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: spacing.lg,
    width: '100%',
  },
  panelTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 24,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  placeholder: {
    color: '#9CA3AF',
  },
  preview: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '900',
    marginTop: spacing.md,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.72,
  },
  sectionLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: spacing.base,
    textTransform: 'uppercase',
  },
  shell: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: '#DADDE2',
    borderRadius: 9,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  disabledShell: {
    backgroundColor: '#F8FAFC',
    opacity: 0.72,
  },
  value: {
    color: '#0F172A',
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
});
