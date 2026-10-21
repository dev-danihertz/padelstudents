/**
 * Filter and Player Matching Logic
 * 
 * In Phase 4 & 5:
 * Implements search filtering and the group matching algorithm (overlapping level ranges).
 */

/**
 * Checks if two level ranges overlap: [minA, maxA] and [minB, maxB]
 * Matching condition: minA <= maxB && maxA >= minB
 */
export function areLevelsCompatible(studentMin, studentMax, sessionMin, sessionMax) {
  return studentMin <= sessionMax && studentMax >= sessionMin;
}
