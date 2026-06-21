import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { IconIonicons } from './Icon';
import { colors, spacing } from '../../constants/theme';

type AppDatePickerProps = {
  maxDate?: string;
  minDate?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
  showTodayButton?: boolean;
};

type PickerMode = 'day' | 'month' | 'year';

const monthNames = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

const monthAbbreviations = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
];

const weekdayLabels = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

export function AppDatePicker({
  maxDate,
  minDate,
  onChange,
  placeholder = 'วัน-เดือน-ปี',
  value,
  showTodayButton = true,
}: AppDatePickerProps) {
  const selectedDate = parseDateValue(value);
  const initialDate = selectedDate ?? new Date();
  const [isOpen, setIsOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<PickerMode>('day');
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(initialDate.getFullYear(), initialDate.getMonth(), 1),
  );
  const [yearPageStart, setYearPageStart] = useState(
    getYearPageStart(initialDate.getFullYear()),
  );

  const min = parseDateValue(minDate);
  const max = parseDateValue(maxDate);
  const calendarDays = useMemo(() => getCalendarDays(visibleMonth), [visibleMonth]);

  const handleOpen = () => {
    const nextDate = parseDateValue(value) ?? new Date();
    setVisibleMonth(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
    setYearPageStart(getYearPageStart(nextDate.getFullYear()));
    setPickerMode('day');
    setIsOpen(true);
  };

  const handleSelectDate = (date: Date) => {
    if (isDateDisabled(date, min, max)) {
      return;
    }

    onChange(formatDateValue(date));
    setIsOpen(false);
  };

  return (
    <>
      <Pressable
        onPress={handleOpen}
        style={({ pressed }) => [styles.inputShell, pressed && styles.pressed]}
      >
        <IconIonicons color={colors.muted} name="calendar-outline" size={20} />
        <Text style={[styles.inputText, !value && styles.placeholderText]}>
          {value || placeholder}
        </Text>
        <IconIonicons color={colors.muted} name="chevron-down" size={18} />
      </Pressable>

      <Modal
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
        statusBarTranslucent
        transparent
        visible={isOpen}
      >
        <View style={styles.overlay}>
          <View style={styles.panel}>
            <View style={styles.headerRow}>
              <Pressable
                hitSlop={10}
                onPress={() => {
                  if (pickerMode === 'year') {
                    setYearPageStart(current => current - 12);
                    return;
                  }

                  setVisibleMonth(
                    current =>
                      new Date(
                        current.getFullYear(),
                        current.getMonth() - (pickerMode === 'month' ? 12 : 1),
                        1,
                      ),
                  );
                }}
                style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
              >
                <IconIonicons color={colors.text} name="chevron-back" size={20} />
              </Pressable>

              <Pressable
                onPress={() =>
                  setPickerMode(current => (current === 'day' ? 'month' : 'year'))
                }
                style={({ pressed }) => [styles.monthBlock, pressed && styles.pressed]}
              >
                <Text style={styles.monthTitle}>
                  {pickerMode === 'year'
                    ? `${toBuddhistYear(yearPageStart)} - ${toBuddhistYear(yearPageStart + 11)}`
                    : monthNames[visibleMonth.getMonth()]}
                </Text>
                <Text style={styles.yearText}>
                  {toBuddhistYear(visibleMonth.getFullYear())}
                </Text>
              </Pressable>

              <Pressable
                hitSlop={10}
                onPress={() => {
                  if (pickerMode === 'year') {
                    setYearPageStart(current => current + 12);
                    return;
                  }

                  setVisibleMonth(
                    current =>
                      new Date(
                        current.getFullYear(),
                        current.getMonth() + (pickerMode === 'month' ? 12 : 1),
                        1,
                      ),
                  );
                }}
                style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
              >
                <IconIonicons color={colors.text} name="chevron-forward" size={20} />
              </Pressable>
            </View>

            {pickerMode === 'day' ? (
              <>
                <View style={styles.weekdayGrid}>
                  {weekdayLabels.map(label => (
                    <Text key={label} style={styles.weekdayText}>
                      {label}
                    </Text>
                  ))}
                </View>

                <View style={styles.dayGrid}>
                  {calendarDays.map((date, index) => {
                    const isSelected = Boolean(
                      date && selectedDate && isSameDay(date, selectedDate),
                    );
                    const disabled = Boolean(date && isDateDisabled(date, min, max));

                    return (
                      <Pressable
                        disabled={!date || disabled}
                        key={`${visibleMonth.getFullYear()}-${visibleMonth.getMonth()}-${index}`}
                        onPress={() => date && handleSelectDate(date)}
                        style={({ pressed }) => [
                          styles.dayCell,
                          isSelected && styles.selectedCell,
                          disabled && styles.disabledDayCell,
                          pressed && styles.pressed,
                        ]}
                      >
                        {date ? (
                          <Text
                            style={[
                              styles.dayText,
                              isSelected && styles.selectedCellText,
                              disabled && styles.disabledDayText,
                            ]}
                          >
                            {date.getDate()}
                          </Text>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : null}

            {pickerMode === 'month' ? (
              <View style={styles.optionGrid}>
                {monthNames.map((monthName, index) => {
                  const isSelected = index === visibleMonth.getMonth();

                  return (
                    <Pressable
                      key={monthName}
                      onPress={() => {
                        setVisibleMonth(
                          current => new Date(current.getFullYear(), index, 1),
                        );
                        setPickerMode('day');
                      }}
                      style={({ pressed }) => [
                        styles.monthCell,
                        isSelected && styles.selectedCell,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          isSelected && styles.selectedCellText,
                        ]}
                      >
                        {monthAbbreviations[index]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            {pickerMode === 'year' ? (
              <View style={styles.optionGrid}>
                {Array.from({ length: 12 }, (_, index) => yearPageStart + index).map(year => {
                  const isSelected = year === visibleMonth.getFullYear();
                  const disabled = isYearDisabled(year, min, max);

                  return (
                  <Pressable
                    disabled={disabled}
                    key={year}
                    onPress={() => {
                      setVisibleMonth(
                        current => new Date(year, current.getMonth(), 1),
                      );
                      setPickerMode('month');
                    }}
                    style={({ pressed }) => [
                      styles.yearCell,
                      isSelected && styles.selectedCell,
                      disabled && styles.disabledDayCell,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.selectedCellText,
                        disabled && styles.disabledDayText,
                      ]}
                    >
                      {toBuddhistYear(year)}
                    </Text>
                  </Pressable>
                );
                })}
              </View>
            ) : null}

            <View style={styles.footerRow}>
              <Pressable
                onPress={() => setIsOpen(false)}
                style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
              >
                <Text style={styles.cancelText}>ยกเลิก</Text>
              </Pressable>
              {showTodayButton !== false ? (
                <Pressable
                  onPress={() => {
                    const today = clampDate(new Date(), min, max);
                    onChange(formatDateValue(today));
                    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                    setIsOpen(false);
                  }}
                  style={({ pressed }) => [styles.todayButton, pressed && styles.primaryPressed]}
                >
                  <Text style={styles.todayText}>วันนี้</Text>
                </Pressable>
              ) : null}
            </View>
          </View>   
        </View>
      </Modal>
    </>
  );
}

function getCalendarDays(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: Array<Date | null> = [];

  for (let index = 0; index < firstDay; index += 1) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push(new Date(year, month, day));
  }

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
}

function parseDateValue(value?: string) {
  if (!value) {
    return null;
  }

  const parts = value.split('-').map(Number);

  if (parts.length !== 3) {
    return null;
  }

  const [firstPart, month, lastPart] = parts;
  const isIsoDate = firstPart > 1900;
  const year = normalizeCalendarYear(isIsoDate ? firstPart : lastPart);
  const day = isIsoDate ? lastPart : firstPart;

  if (!year || !month || !day) {
    return null;
  }

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function formatDateValue(date: Date) {
  const year = toBuddhistYear(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${day}-${month}-${year}`;
}

function isSameDay(date: Date, otherDate: Date) {
  return formatDateValue(date) === formatDateValue(otherDate);
}

function isDateDisabled(date: Date, min: Date | null, max: Date | null) {
  const current = stripTime(date).getTime();

  if (min && current < stripTime(min).getTime()) {
    return true;
  }

  if (max && current > stripTime(max).getTime()) {
    return true;
  }

  return false;
}

function isYearDisabled(year: number, min: Date | null, max: Date | null) {
  if (min && year < min.getFullYear()) {
    return true;
  }

  if (max && year > max.getFullYear()) {
    return true;
  }

  return false;
}

function getYearPageStart(year: number) {
  return year - (year % 12);
}

function normalizeCalendarYear(year: number) {
  return year > 2400 ? year - 543 : year;
}

function toBuddhistYear(year: number) {
  return year + 543;
}

function clampDate(date: Date, min: Date | null, max: Date | null) {
  const current = stripTime(date);

  if (min && current.getTime() < stripTime(min).getTime()) {
    return min;
  }

  if (max && current.getTime() > stripTime(max).getTime()) {
    return max;
  }

  return current;
}

function stripTime(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

const styles = StyleSheet.create({
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  cancelText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '800',
  },
  dayCell: {
    alignItems: 'center',
    borderRadius: 8,
    height: 40,
    justifyContent: 'center',
    width: `${100 / 7}%`,
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  dayText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  disabledDayCell: {
    opacity: 0.32,
  },
  disabledDayText: {
    color: colors.muted,
  },
  footerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.mutedSurface,
    borderColor: 'rgba(22, 185, 104, 0.18)',
    borderRadius: 10,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  inputShell: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderColor: '#DADDE2',
    borderRadius: 9,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 52,
    marginTop: 12,
    paddingHorizontal: 14,
  },
  inputText: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  monthBlock: {
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  monthCell: {
    alignItems: 'center',
    borderRadius: 9,
    justifyContent: 'center',
    minHeight: 44,
    width: '33.3333%',
  },
  monthTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.lg,
  },
  optionText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  panel: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderColor: 'rgba(209, 213, 219, 0.78)',
    borderRadius: 18,
    borderWidth: 1,
    maxWidth: 420,
    padding: spacing.lg,
    shadowColor: '#0F172A',
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    width: '100%',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  pressed: {
    opacity: 0.72,
  },
  primaryPressed: {
    backgroundColor: colors.primaryPressed,
  },
  selectedCell: {
    backgroundColor: colors.primary,
  },
  selectedCellText: {
    color: colors.white,
  },
  todayButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 9,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.lg,
  },
  todayText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  weekdayGrid: {
    flexDirection: 'row',
    marginTop: spacing.lg,
  },
  weekdayText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    width: `${100 / 7}%`,
  },
  yearText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  yearCell: {
    alignItems: 'center',
    borderRadius: 9,
    justifyContent: 'center',
    minHeight: 44,
    width: '33.3333%',
  },
});
