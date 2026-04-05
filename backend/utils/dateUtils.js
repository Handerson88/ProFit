const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const MAPUTO_TZ = 'Africa/Maputo';

/**
 * Returns the current date/time in Mozambique (Africa/Maputo)
 */
exports.getMaputoNow = () => {
  return dayjs().tz(MAPUTO_TZ);
};

/**
 * Returns the current date in YYYY-MM-DD format (Maputo local time)
 */
exports.getTodayString = () => {
  return dayjs().tz(MAPUTO_TZ).format('YYYY-MM-DD');
};

/**
 * Formats any date for consistent comparison in YYYY-MM-DD
 */
exports.formatDate = (date) => {
  return dayjs(date).tz(MAPUTO_TZ).format('YYYY-MM-DD');
};

/**
 * Converts a Maputo local time to a JS Date object
 */
exports.parseToDate = (dateStr) => {
  return dayjs(dateStr).tz(MAPUTO_TZ).toDate();
};

/**
 * Formats a date for display (HH:mm)
 */
exports.formatTime = (date) => {
  return dayjs(date).tz(MAPUTO_TZ).format('HH:mm');
};
