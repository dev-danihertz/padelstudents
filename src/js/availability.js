/**
 * Availability & Schedule Management Module
 * 
 * Defines the core structure of coaching availability:
 * - Days: Weekdays (Monday to Friday) and Weekends (Saturday and Sunday)
 * - Daily Time Periods: Morning, Midday, Afternoon, Late Afternoon
 */

export const TIME_PERIODS_CONFIG = [
  {
    id: 'morning',
    name: 'Morning',
    timeWindow: '08:00 – 12:00',
    description: 'Early morning & mid-morning coaching sessions',
    appliesTo: ['weekdays', 'weekends']
  },
  {
    id: 'midday',
    name: 'Midday',
    timeWindow: '12:00 – 14:00',
    description: 'Lunchtime & midday sessions',
    appliesTo: ['weekdays', 'weekends']
  },
  {
    id: 'afternoon',
    name: 'Afternoon',
    timeWindow: '14:00 – 17:00',
    description: 'Afternoon coaching blocks',
    appliesTo: ['weekdays', 'weekends']
  },
  {
    id: 'late_afternoon',
    name: 'Late Afternoon',
    timeWindow: '17:00 – 20:00',
    description: 'Post-work, evening & twilight floodlit sessions',
    appliesTo: ['weekdays', 'weekends']
  }
];

export const DAYS_CONFIG = {
  weekdays: [
    { id: 'monday', name: 'Monday', short: 'Mon', type: 'Weekday', active: true },
    { id: 'tuesday', name: 'Tuesday', short: 'Tue', type: 'Weekday', active: true },
    { id: 'wednesday', name: 'Wednesday', short: 'Wed', type: 'Weekday', active: true },
    { id: 'thursday', name: 'Thursday', short: 'Thu', type: 'Weekday', active: true },
    { id: 'friday', name: 'Friday', short: 'Fri', type: 'Weekday', active: true }
  ],
  weekends: [
    { id: 'saturday', name: 'Saturday', short: 'Sat', type: 'Weekend', active: true },
    { id: 'sunday', name: 'Sunday', short: 'Sun', type: 'Weekend', active: true }
  ]
};

/**
 * Returns a flat array of all 7 days of the week
 */
export function getAllDays() {
  return [...DAYS_CONFIG.weekdays, ...DAYS_CONFIG.weekends];
}

/**
 * Returns a unique slot identifier (e.g. 'wednesday_morning')
 */
export function getSlotKey(dayId, periodId) {
  return `${dayId}_${periodId}`;
}
