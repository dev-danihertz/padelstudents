/**
 * Availability & Schedule Management Module
 * 
 * Defines the core structure of coaching availability:
 * - Weekdays (Dias úteis): Monday to Friday
 * - Weekends (Fins de semana): Saturday and Sunday
 */

export const DAYS_CONFIG = {
  weekdays: [
    { id: 'monday', name: 'Monday', labelPt: 'Segunda-feira', type: 'weekday', active: true },
    { id: 'tuesday', name: 'Tuesday', labelPt: 'Terça-feira', type: 'weekday', active: true },
    { id: 'wednesday', name: 'Wednesday', labelPt: 'Quarta-feira', type: 'weekday', active: true },
    { id: 'thursday', name: 'Thursday', labelPt: 'Quinta-feira', type: 'weekday', active: true },
    { id: 'friday', name: 'Friday', labelPt: 'Sexta-feira', type: 'weekday', active: true }
  ],
  weekends: [
    { id: 'saturday', name: 'Saturday', labelPt: 'Sábado', type: 'weekend', active: true },
    { id: 'sunday', name: 'Sunday', labelPt: 'Domingo', type: 'weekend', active: true }
  ]
};

export const TIME_PERIODS = {
  WEEKDAY: ['Morning', 'Midday', 'Afternoon'],
  SATURDAY: ['Morning', 'Midday', 'Afternoon', 'Late Afternoon'],
  SUNDAY: ['Morning', 'Midday', 'Afternoon']
};

/**
 * Returns a flat list of all active coaching days
 */
export function getAllDays() {
  return [...DAYS_CONFIG.weekdays, ...DAYS_CONFIG.weekends];
}
