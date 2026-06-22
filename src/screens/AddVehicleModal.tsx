import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
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

import { AppAlertDialog, Box, HStack, Icon, Text, VStack } from '../components/ui';
import { colors, spacing } from '../constants/theme';
import { EvCarApi, UserVehicleApi } from '../services/api';
import type { UserVehicleCreateRequest, UserVehicleUpdateRequest } from '../services/api';

type EvCar = {
  battery_capacity?: number;
  charge_type?: string;
  id: number;
  image_car_url?: string;
  brand: string;
  model: string;
  range_km?: number;
  year?: number;
};

type Step = 'select-car' | 'fill-detail';

type DialogState =
  | null
  | { kind: 'confirm' }
  | { kind: 'confirm-delete' }
  | { kind: 'error'; message: string }
  | { kind: 'success' }
  | { kind: 'success-delete' };

type EditVehicleData = {
  color?: string;
  evCarId?: number;
  licensePlate?: string;
  nickname?: string;
  vehicleId: number;
};

type AddVehicleModalProps = {
  editVehicle?: EditVehicleData;
  onClose: () => void;
  onSuccess: () => void;
  userId?: number;
  username?: string;
  visible: boolean;
};

const evCarApi = new EvCarApi();
const userVehicleApi = new UserVehicleApi();

export function AddVehicleModal({
  editVehicle,
  onClose,
  onSuccess,
  userId,
  username,
  visible,
}: AddVehicleModalProps) {
  const isEditMode = editVehicle !== undefined;
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('select-car');
  const [evCars, setEvCars] = useState<EvCar[]>([]);
  const [isLoadingCars, setIsLoadingCars] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedCar, setSelectedCar] = useState<EvCar | null>(null);

  const [licensePlate, setLicensePlate] = useState('');
  const [color, setColor] = useState('');
  const [nickname, setNickname] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [dialog, setDialog] = useState<DialogState>(null);

  const loadEvCars = useCallback(async () => {
    setIsLoadingCars(true);
    try {
      const response = await evCarApi.list();
      setEvCars(extractEvCars(response));
    } catch {
      setEvCars([]);
    } finally {
      setIsLoadingCars(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) {
      return;
    }
    setShowValidationErrors(false);
    setDialog(null);
    setSearchText('');

    if (editVehicle) {
      setStep('fill-detail');
      setLicensePlate(editVehicle.licensePlate ?? '');
      setColor(editVehicle.color ?? '');
      setNickname(editVehicle.nickname ?? '');
      setSelectedCar(null);
    } else {
      setStep('select-car');
      setSelectedCar(null);
      setLicensePlate('');
      setColor('');
      setNickname('');
    }
    loadEvCars();
  }, [visible, editVehicle, loadEvCars]);

  // Auto-select the car when loading in edit mode
  useEffect(() => {
    if (!isEditMode || !editVehicle?.evCarId || evCars.length === 0) {
      return;
    }
    const matched = evCars.find(car => car.id === editVehicle.evCarId);
    if (matched) {
      setSelectedCar(matched);
    }
  }, [evCars, editVehicle, isEditMode]);

  const filteredCars = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) {
      return evCars;
    }
    return evCars.filter(
      car =>
        car.brand.toLowerCase().includes(query) ||
        car.model.toLowerCase().includes(query) ||
        String(car.year ?? '').includes(query),
    );
  }, [evCars, searchText]);

  const handleBack = () => {
    if (step === 'fill-detail' && !isEditMode) {
      setStep('select-car');
      setShowValidationErrors(false);
      setDialog(null);
    } else {
      onClose();
    }
  };

  const handleSelectCar = (car: EvCar) => {
    setSelectedCar(car);
    setStep('fill-detail');
  };

  const handleSave = () => {
    if (!selectedCar) {
      return;
    }
    const missingPlate = licensePlate.trim().length === 0;
    const missingColor = color.trim().length === 0;
    if (missingPlate || missingColor) {
      setShowValidationErrors(true);
      const msg = missingPlate && missingColor
        ? 'กรุณากรอกทะเบียนรถและสีรถ'
        : missingPlate
          ? 'กรุณากรอกทะเบียนรถ'
          : 'กรุณากรอกสีรถ';
      setDialog({ kind: 'error', message: msg });
      return;
    }
    setDialog({ kind: 'confirm' });
  };

  const executeSave = async () => {
    if (!selectedCar) {
      return;
    }
    setDialog(null);
    setIsSubmitting(true);
    try {
      let response;

      if (isEditMode && editVehicle) {
        const payload: UserVehicleUpdateRequest = {
          ev_car_id: selectedCar.id,
          license_plate: licensePlate.trim(),
          color: color.trim() || undefined,
          nickname: nickname.trim() || undefined,
          username: username || undefined,
        };
        response = await userVehicleApi.update(editVehicle.vehicleId, payload);
      } else {
        const payload: UserVehicleCreateRequest = {
          ev_car_id: selectedCar.id,
          license_plate: licensePlate.trim(),
          ...(color.trim() ? { color: color.trim() } : {}),
          ...(nickname.trim() ? { nickname: nickname.trim() } : {}),
          ...(userId !== undefined ? { user_id: userId } : {}),
          ...(username ? { username } : {}),
        };
        response = await userVehicleApi.create(payload);
      }

      if (response.success === false) {
        setDialog({ kind: 'error', message: response.message ?? response.error ?? 'บันทึกไม่สำเร็จ' });
        return;
      }

      setDialog({ kind: 'success' });
    } catch {
      setDialog({ kind: 'error', message: 'ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeDelete = async () => {
    if (!editVehicle) {
      return;
    }
    setDialog(null);
    setIsSubmitting(true);
    try {
      const response = await userVehicleApi.delete(editVehicle.vehicleId);
      if (response.success === false) {
        setDialog({ kind: 'error', message: response.message ?? response.error ?? 'ลบไม่สำเร็จ' });
        return;
      }
      setDialog({ kind: 'success-delete' });
    } catch {
      setDialog({ kind: 'error', message: 'ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={handleBack}
      statusBarTranslucent
      transparent={false}
      visible={visible}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <Pressable
            hitSlop={12}
            onPress={handleBack}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <Icon color={colors.text} name="chevron-back" size={24} />
          </Pressable>
          <Text style={styles.headerTitle}>
            {isEditMode
              ? 'แก้ไขข้อมูลรถ'
              : step === 'select-car'
                ? 'เลือกรุ่นรถ EV'
                : 'ข้อมูลรถของคุณ'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {step === 'select-car' ? (
          <SelectCarStep
            cars={filteredCars}
            isLoading={isLoadingCars}
            onSearchChange={setSearchText}
            onSelect={handleSelectCar}
            searchText={searchText}
          />
        ) : selectedCar === null ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : (
          <FillDetailStep
            car={selectedCar}
            color={color}
            hasColorError={showValidationErrors && color.trim().length === 0}
            hasLicensePlateError={showValidationErrors && licensePlate.trim().length === 0}
            insetBottom={insets.bottom}
            isEditMode={isEditMode}
            isSubmitting={isSubmitting}
            licensePlate={licensePlate}
            nickname={nickname}
            onColorChange={setColor}
            onDeletePress={() => setDialog({ kind: 'confirm-delete' })}
            onLicensePlateChange={setLicensePlate}
            onNicknameChange={setNickname}
            onSave={handleSave}
          />
        )}
      </KeyboardAvoidingView>

      <AppAlertDialog
        cancelText="ยกเลิก"
        confirmText="บันทึก"
        message={`ยืนยันบันทึกข้อมูลรถ\n${selectedCar ? `${selectedCar.brand} ${selectedCar.model}` : ''}\nทะเบียน ${licensePlate.trim()}`}
        onCancel={() => setDialog(null)}
        onConfirm={executeSave}
        title="ยืนยันบันทึกข้อมูล"
        type="info"
        visible={dialog?.kind === 'confirm'}
      />

      <AppAlertDialog
        confirmText="ตกลง"
        message={dialog?.kind === 'error' ? dialog.message : ''}
        onConfirm={() => setDialog(null)}
        title="ไม่สามารถบันทึกได้"
        type="warning"
        visible={dialog?.kind === 'error'}
      />

      <AppAlertDialog
        confirmText="ตกลง"
        message="บันทึกข้อมูลรถ EV ของคุณเรียบร้อยแล้ว"
        onConfirm={() => {
          setDialog(null);
          onSuccess();
          onClose();
        }}
        title="บันทึกสำเร็จ"
        type="success"
        visible={dialog?.kind === 'success'}
      />

      <AppAlertDialog
        cancelText="ยกเลิก"
        confirmText="ลบ"
        message="ต้องการลบข้อมูลรถคันนี้ใช่หรือไม่?\nการดำเนินการนี้ไม่สามารถยกเลิกได้"
        onCancel={() => setDialog(null)}
        onConfirm={executeDelete}
        title="ยืนยันการลบ"
        type="warning"
        visible={dialog?.kind === 'confirm-delete'}
      />

      <AppAlertDialog
        confirmText="ตกลง"
        message="ลบข้อมูลรถ EV เรียบร้อยแล้ว"
        onConfirm={() => {
          setDialog(null);
          onSuccess();
          onClose();
        }}
        title="ลบสำเร็จ"
        type="success"
        visible={dialog?.kind === 'success-delete'}
      />
    </Modal>
  );
}

function SelectCarStep({
  cars,
  isLoading,
  onSearchChange,
  onSelect,
  searchText,
}: {
  cars: EvCar[];
  isLoading: boolean;
  onSearchChange: (text: string) => void;
  onSelect: (car: EvCar) => void;
  searchText: string;
}) {
  return (
    <View style={styles.stepContainer}>
      <HStack alignItems="center" style={styles.searchBox}>
        <Icon color="#4A5568" name="search-outline" size={22} />
        <TextInput
          onChangeText={onSearchChange}
          placeholder="ค้นหายี่ห้อหรือรุ่น..."
          placeholderTextColor="#6B7280"
          returnKeyType="search"
          style={styles.searchInput}
          value={searchText}
        />
        {searchText.length > 0 ? (
          <Pressable hitSlop={8} onPress={() => onSearchChange('')}>
            <Icon color="#9AA3AF" name="close-circle" size={20} />
          </Pressable>
        ) : null}
      </HStack>

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.stateText}>กำลังโหลดรายการรถ EV...</Text>
        </View>
      ) : cars.length === 0 ? (
        <View style={styles.centerState}>
          <Icon color="#CBD5E1" name="car-sport-outline" size={52} />
          <Text style={styles.stateTitle}>ไม่พบรายการรถ</Text>
          <Text style={styles.stateText}>
            {searchText.length > 0
              ? 'ลองค้นหาด้วยคำอื่น'
              : 'ยังไม่มีข้อมูลรถ EV ในระบบ'}
          </Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={cars}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => (
            <EvCarCard car={item} onPress={() => onSelect(item)} />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

function EvCarCard({ car, onPress }: { car: EvCar; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.carCard, pressed && styles.carCardPressed]}
    >
      <CarThumbnail imageUrl={car.image_car_url} />
      <VStack flex={1} style={styles.carInfo}>
        <Text numberOfLines={1} style={styles.carName}>
          {car.brand} {car.model}
        </Text>

        {car.year ? (
          <HStack alignItems="center" style={styles.specRow}>
            <Icon color="#64748B" name="calendar-outline" size={14} />
            <Text style={styles.specLabel}>ปีผลิต</Text>
            <Text style={styles.specValue}>{car.year}</Text>
          </HStack>
        ) : null}

        {car.battery_capacity ? (
          <HStack alignItems="center" style={styles.specRow}>
            <Icon color="#F59E0B" name="battery-charging-outline" size={14} />
            <Text style={styles.specLabel}>ความจุแบตเตอรี่</Text>
            <Text style={styles.specValue}>{car.battery_capacity} kWh</Text>
          </HStack>
        ) : null}

        {car.range_km ? (
          <HStack alignItems="center" style={styles.specRow}>
            <Icon color="#3B82F6" name="speedometer-outline" size={14} />
            <Text style={styles.specLabel}>ระยะทางต่อชาร์จเต็ม</Text>
            <Text style={styles.specValue}>{car.range_km} km</Text>
          </HStack>
        ) : null}

        {car.charge_type ? (
          <Box style={styles.chargeBadge}>
            <Text style={styles.chargeBadgeText}>
              {car.charge_type.toUpperCase()}
            </Text>
          </Box>
        ) : null}
      </VStack>
      <Icon color="#CBD5E1" name="chevron-forward" size={22} />
    </Pressable>
  );
}

function CarThumbnail({ imageUrl }: { imageUrl?: string }) {
  const [hasError, setHasError] = useState(false);

  if (imageUrl && !hasError) {
    return (
      <Image
        onError={() => setHasError(true)}
        resizeMode="contain"
        source={{ uri: imageUrl }}
        style={styles.carImage}
      />
    );
  }

  return (
    <View style={styles.carIconBox}>
      <Icon color={colors.primary} name="car-sport-outline" size={36} />
    </View>
  );
}

function FillDetailStep({
  car,
  color,
  hasColorError,
  hasLicensePlateError,
  insetBottom,
  isEditMode,
  isSubmitting,
  licensePlate,
  nickname,
  onColorChange,
  onDeletePress,
  onLicensePlateChange,
  onNicknameChange,
  onSave,
}: {
  car: EvCar;
  color: string;
  hasColorError: boolean;
  hasLicensePlateError: boolean;
  insetBottom: number;
  isEditMode: boolean;
  isSubmitting: boolean;
  licensePlate: string;
  nickname: string;
  onColorChange: (text: string) => void;
  onDeletePress: () => void;
  onLicensePlateChange: (text: string) => void;
  onNicknameChange: (text: string) => void;
  onSave: () => void;
}) {
  return (
    <View style={styles.stepContainer}>
      <ScrollView
        contentContainerStyle={styles.detailScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Selected car summary — mirrors EvCarCard layout */}
        <View style={styles.selectedCarBanner}>
          <CarThumbnail imageUrl={car.image_car_url} />
          <VStack flex={1} style={styles.carInfo}>
            <HStack alignItems="center" style={styles.carNameRow}>
              <Text numberOfLines={1} style={[styles.selectedCarName, styles.carNameFlex]}>
                {car.brand} {car.model}
              </Text>
              <Icon color={colors.primary} name="checkmark-circle" size={24} />
            </HStack>

            {car.year ? (
              <HStack alignItems="center" style={styles.specRow}>
                <Icon color="#64748B" name="calendar-outline" size={14} />
                <Text style={styles.specLabel}>ปีผลิต</Text>
                <Text style={styles.specValue}>ปี {car.year}</Text>
              </HStack>
            ) : null}

            {car.battery_capacity ? (
              <HStack alignItems="center" style={styles.specRow}>
                <Icon color="#F59E0B" name="battery-charging-outline" size={14} />
                <Text style={styles.specLabel}>ความจุแบตเตอรี่</Text>
                <Text style={styles.specValue}>{car.battery_capacity} kWh</Text>
              </HStack>
            ) : null}

            {car.range_km ? (
              <HStack alignItems="center" style={styles.specRow}>
                <Icon color="#3B82F6" name="speedometer-outline" size={14} />
                <Text style={styles.specLabel}>ระยะทางต่อชาร์จเต็ม</Text>
                <Text style={styles.specValue}>{car.range_km} km</Text>
              </HStack>
            ) : null}

            {car.charge_type ? (
              <Box style={styles.chargeBadge}>
                <Text style={styles.chargeBadgeText}>
                  {car.charge_type.toUpperCase()}
                </Text>
              </Box>
            ) : null}
          </VStack>
        </View>

        {/* Form fields */}
        <View style={styles.formSection}>
          <Text style={styles.formLabel}>
            ทะเบียนรถ <Text style={styles.required}>*</Text>
          </Text>
          <View style={[styles.inputShell, hasLicensePlateError && styles.inputShellError]}>
            <Icon color={colors.muted} name="card-outline" size={20} />
            <TextInput
              autoCapitalize="characters"
              autoCorrect={false}
              onChangeText={onLicensePlateChange}
              placeholder="เช่น กข 1234"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              value={licensePlate}
            />
          </View>

          <Text style={[styles.formLabel, styles.formLabelSpaced]}>
            สีรถ <Text style={styles.required}>*</Text>
          </Text>
          <View style={[styles.inputShell, hasColorError && styles.inputShellError]}>
            <Icon color={colors.muted} name="color-palette-outline" size={20} />
            <TextInput
              autoCorrect={false}
              onChangeText={onColorChange}
              placeholder="เช่น สีขาว, สีดำ"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              value={color}
            />
          </View>

          <Text style={[styles.formLabel, styles.formLabelSpaced]}>
            ชื่อเล่น
          </Text>
          <View style={styles.inputShell}>
            <Icon color={colors.muted} name="pricetag-outline" size={20} />
            <TextInput
              autoCorrect={false}
              onChangeText={onNicknameChange}
              placeholder="เช่น รถคันโปรด"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              value={nickname}
            />
          </View>
        </View>
      </ScrollView>

      {/* Save button — pinned at bottom */}
      <View style={[styles.saveButtonContainer, { paddingBottom: Math.max(insetBottom, spacing.lg) }]}>
        {isEditMode ? (
          <VStack style={styles.buttonRow}>
            <Pressable
              disabled={isSubmitting}
              onPress={onSave}
              style={({ pressed }) => [
                styles.saveButton,
                styles.saveButtonFlex,
                pressed && styles.saveButtonPressed,
                isSubmitting && styles.saveButtonDisabled,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <HStack alignItems="center" style={styles.saveButtonContent}>
                  <Icon color={colors.white} name="checkmark-circle-outline" size={22} />
                  <Text style={styles.saveButtonText}>บันทึกข้อมูลรถ</Text>
                </HStack>
              )}
            </Pressable>

            <Pressable
              disabled={isSubmitting}
              onPress={onDeletePress}
              style={({ pressed }) => [
                styles.deleteButton,
                pressed && styles.deleteButtonPressed,
                isSubmitting && styles.saveButtonDisabled,
              ]}
            >
              <HStack alignItems="center" style={styles.saveButtonContent}>
                <Icon color="#EF4444" name="trash-outline" size={20} />
                <Text style={styles.deleteButtonText}>ลบข้อมูลรถ</Text>
              </HStack>
            </Pressable>
          </VStack>
        ) : (
          <Pressable
            disabled={isSubmitting}
            onPress={onSave}
            style={({ pressed }) => [
              styles.saveButton,
              pressed && styles.saveButtonPressed,
              isSubmitting && styles.saveButtonDisabled,
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <HStack alignItems="center" style={styles.saveButtonContent}>
                <Icon color={colors.white} name="checkmark-circle-outline" size={22} />
                <Text style={styles.saveButtonText}>บันทึกข้อมูลรถ</Text>
              </HStack>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = parseFloat(value.trim());
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

function extractEvCars(response: unknown): EvCar[] {
  const asRecord = (v: unknown) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? (v as Record<string, unknown>)
      : null;

  const record = asRecord(response);
  const dataRecord = asRecord(record?.data);

  const candidates = [
    dataRecord?.items,
    dataRecord?.rows,
    dataRecord?.data,
    dataRecord?.ev_cars,
    dataRecord?.evCars,
    record?.items,
    record?.rows,
    record?.data,
    record?.ev_cars,
    record?.evCars,
    response,
  ];

  let rawList: unknown[] = [];
  for (const c of candidates) {
    if (Array.isArray(c)) {
      rawList = c;
      break;
    }
  }

  const result: EvCar[] = [];

  for (const item of rawList) {
    const r = asRecord(item);
    if (!r) {
      continue;
    }
    const rawId = typeof r.id === 'number' ? r.id : Number(r.id);
    const brand = typeof r.brand === 'string' ? r.brand.trim() : '';
    const model = typeof r.model === 'string' ? r.model.trim() : '';
    if (!brand && !model) {
      continue;
    }
    const car: EvCar = {
      id: Number.isFinite(rawId) ? rawId : 0,
      brand: brand || 'Unknown',
      model: model || 'Unknown',
    };
    const battery = toFiniteNumber(r.battery_capacity);
    if (battery !== undefined) {
      car.battery_capacity = battery;
    }
    if (typeof r.charge_type === 'string' && r.charge_type.trim()) {
      car.charge_type = r.charge_type.trim();
    }
    const range = toFiniteNumber(r.range_km);
    if (range !== undefined) {
      car.range_km = range;
    }
    const year = toFiniteNumber(r.year);
    if (year !== undefined && year > 1900) {
      car.year = year;
    }
    const imageUrl =
      typeof r.image_car_url === 'string' && r.image_car_url.trim()
        ? r.image_car_url.trim()
        : typeof r.imageCarUrl === 'string' && r.imageCarUrl.trim()
          ? r.imageCarUrl.trim()
          : undefined;
    if (imageUrl) {
      car.image_car_url = imageUrl;
    }
    result.push(car);
  }

  return result;
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  carCard: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    elevation: 2,
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: '#0F172A',
    shadowOffset: { height: 3, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  carCardPressed: {
    backgroundColor: '#F8FAFC',
    opacity: 0.9,
  },
  carImage: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    height: 80,
    width: 80,
  },
  carIconBox: {
    alignItems: 'center',
    backgroundColor: '#EEF8F3',
    borderRadius: 14,
    height: 80,
    justifyContent: 'center',
    width: 80,
  },
  carInfo: {
    gap: 4,
    minWidth: 0,
  },
  carName: {
    color: '#0F172A',
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  carNameRow: {
    gap: 6,
  },
  centerState: {
    alignItems: 'center',
    flex: 1,
    gap: 10,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  chargeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    marginTop: 2,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chargeBadgeTop: {
    marginTop: 4,
  },
  chargeBadgeText: {
    color: '#16A34A',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 15,
  },
  specLabel: {
    color: '#64748B',
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  specRow: {
    gap: 5,
  },
  specValue: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  yearBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    flexShrink: 0,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  yearBadgeText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 15,
  },
  container: {
    backgroundColor: '#F8FBFA',
    flex: 1,
  },
  errorRow: {
    gap: 6,
    marginTop: 12,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  formLabel: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  formLabelSpaced: {
    marginTop: 16,
  },
  formSection: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#F8FBFA',
    borderBottomColor: '#F1F5F9',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 14,
    paddingHorizontal: spacing.lg,
  },
  headerSpacer: {
    width: 38,
  },
  headerTitle: {
    color: colors.text,
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    textAlign: 'center',
  },
  input: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    minHeight: 50,
    padding: 0,
  },
  inputShell: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: '#DADDE2',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  inputShellError: {
    borderColor: colors.danger,
  },
  listContent: {
    gap: 0,
    paddingBottom: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: 8,
  },
  pressed: {
    opacity: 0.72,
  },
  required: {
    color: colors.danger,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    justifyContent: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    minHeight: 54,
  },
  saveButtonFlex: {
    flex: 1,
    marginHorizontal: 0,
    marginTop: 0,
  },
  saveButtonContent: {
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.62,
  },
  saveButtonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  buttonRow: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  deleteButton: {
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 18,
  },
  deleteButtonPressed: {
    backgroundColor: '#FEE2E2',
  },
  deleteButtonText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  searchBox: {
    backgroundColor: colors.white,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    marginBottom: 12,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchInput: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  selectedCarBanner: {
    alignItems: 'center',
    backgroundColor: '#EEF8F3',
    borderColor: 'rgba(22,185,104,0.25)',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  selectedCarIcon: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  selectedCarName: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  selectedCarYear: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  separator: {
    height: 10,
  },
  stateText: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  stateTitle: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  stepContainer: {
    flex: 1,
  },
  detailScrollContent: {
    paddingBottom: 16,
  },
  saveButtonContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  carNameFlex: {
    flex: 1,
  },
});
