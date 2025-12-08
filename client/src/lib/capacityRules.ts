/**
 * Capacity Rules Module
 *
 * Provides utility functions for scheduling capacity rules:
 * - Sunday adjustment (no appointments on Sundays)
 *
 * @module capacityRules
 */

import { addDays, getDay } from 'date-fns';

/**
 * Adjusts a date to avoid Sunday (0 vacancies).
 * If the date falls on Sunday, moves to the next Monday.
 *
 * @param date - The date to adjust
 * @returns Adjusted date (never falls on Sunday)
 *
 * @example
 * // Sunday 2024-12-01 -> Monday 2024-12-02
 * adjustForSunday(new Date('2024-12-01'))
 */
export function adjustForSunday(date: Date): Date {
  // Sunday is day 0 in JavaScript
  if (getDay(date) === 0) {
    return addDays(date, 1); // Move to Monday
  }
  return date;
}

/**
 * Checks if a date is a Sunday.
 *
 * @param date - The date to check
 * @returns true if the date is Sunday
 */
export function isSunday(date: Date): boolean {
  return getDay(date) === 0;
}
