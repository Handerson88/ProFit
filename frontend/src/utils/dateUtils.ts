import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/pt-br';

// Extended functionality for timezone handling
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('pt-br');

const MAPUTO_TIMEZONE = 'Africa/Maputo';

/**
 * Returns a current Date object set to Mozambique time
 */
export const getMaputoNow = (): dayjs.Dayjs => {
  return dayjs().tz(MAPUTO_TIMEZONE);
};

/**
 * Formats a date string or Date object to Maputo time (HH:mm)
 */
export const formatMaputoTime = (date: string | Date | number): string => {
  try {
    if (!date) return '--:--';
    return dayjs(date).tz(MAPUTO_TIMEZONE).format('HH:mm');
  } catch (e) {
    console.error('Error formatting Maputo time:', e);
    return '--:--';
  }
};

/**
 * Formats a date string or Date object to Maputo date (DD/MM/YYYY)
 */
export const formatMaputoDate = (date: string | Date | number): string => {
  try {
    if (!date) return '--/--/----';
    return dayjs(date).tz(MAPUTO_TIMEZONE).format('DD/MM/YYYY');
  } catch (e) {
    console.error('Error formatting Maputo date:', e);
    return '--/--/----';
  }
};

/**
 * Formats a date string or Date object to Maputo long date (e.g., "26 de Março")
 */
export const formatMaputoLongDate = (date: string | Date | number): string => {
  try {
    if (!date) return '';
    const formatted = dayjs(date).tz(MAPUTO_TIMEZONE).format('D [de] MMMM');
    // Capitalize month if needed
    return formatted.replace(/ de ([a-z])/g, (match, p1) => ` de ${p1.toUpperCase()}`);
  } catch (e) {
    console.error('Error formatting Maputo long date:', e);
    return '';
  }
};

/**
 * Returns the day name (e.g., "Segunda-feira") in Maputo time
 */
export const getMaputoDayName = (date: string | Date | number): string => {
  try {
    if (!date) return '';
    const d = dayjs(date).tz(MAPUTO_TIMEZONE);
    const day = d.format('dddd');
    return day.charAt(0).toUpperCase() + day.slice(1);
  } catch (e) {
    return '';
  }
};

/**
 * Checks if a given date is "today" in Maputo time
 */
export const isMaputoToday = (date: string | Date | number): boolean => {
  const now = getMaputoNow();
  const d = dayjs(date).tz(MAPUTO_TIMEZONE);
  return d.format('YYYY-MM-DD') === now.format('YYYY-MM-DD');
};

/**
 * Returns the start of the current day in Maputo time (UTC Date object)
 */
export const getStartOfMaputoToday = (): Date => {
  return dayjs().tz(MAPUTO_TIMEZONE).startOf('day').toDate();
};

/**
 * Formats for the "pt-MZ" specific requirement
 */
export const formatMaputoNative = (date: string | Date | number): string => {
  return new Date(date).toLocaleString("pt-MZ", {
    timeZone: MAPUTO_TIMEZONE
  });
};
