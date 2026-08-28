import { PhysicalCondition } from '../types';

/**
 * Calculates physical condition strictly based on damage percentage rules:
 * 0% = Good (Baik)
 * 1%–30% = Minor Damage (Rusak Ringan)
 * 31%–46% = Moderate Damage (Rusak Sedang)
 * 47%–85% = Major Damage (Rusak Berat)
 * Above 85% = Total Damage (Rusak Total)
 */
export function calculateConditionFromPercentage(percentage: number): PhysicalCondition {
  const p = Math.max(0, Math.min(100, Number(percentage) || 0));
  if (p === 0) return 'Baik';
  if (p <= 30) return 'Rusak Ringan';
  if (p <= 46) return 'Rusak Sedang';
  if (p <= 85) return 'Rusak Berat';
  return 'Rusak Total';
}

export function getConditionColor(condition: PhysicalCondition): {
  bg: string;
  text: string;
  border: string;
  badgeClass: string;
  hex: string;
} {
  switch (condition) {
    case 'Baik':
      return {
        bg: 'bg-emerald-50 text-emerald-700',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        hex: '#10b981'
      };
    case 'Rusak Ringan':
      return {
        bg: 'bg-amber-50 text-amber-700',
        text: 'text-amber-700',
        border: 'border-amber-200',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
        hex: '#f59e0b'
      };
    case 'Rusak Sedang':
      return {
        bg: 'bg-orange-50 text-orange-700',
        text: 'text-orange-700',
        border: 'border-orange-200',
        badgeClass: 'bg-orange-100 text-orange-800 border-orange-300',
        hex: '#f97316'
      };
    case 'Rusak Berat':
      return {
        bg: 'bg-rose-50 text-rose-700',
        text: 'text-rose-700',
        border: 'border-rose-200',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
        hex: '#ef4444'
      };
    case 'Rusak Total':
    default:
      return {
        bg: 'bg-red-100 text-red-900',
        text: 'text-red-900',
        border: 'border-red-300',
        badgeClass: 'bg-red-200 text-red-900 border-red-400 font-bold',
        hex: '#991b1b'
      };
  }
}

/**
 * Calculates total quantity for facilities items:
 * Formula: Total = Good + Minor Damage + Moderate Damage + Major Damage + Total Damage
 */
export function calculateFacilityTotal(
  good: number,
  minor: number = 0,
  moderate: number = 0,
  major: number = 0,
  totalDamage: number = 0
): number {
  const g = Math.max(0, Number(good) || 0);
  const min = Math.max(0, Number(minor) || 0);
  const mod = Math.max(0, Number(moderate) || 0);
  const maj = Math.max(0, Number(major) || 0);
  const tot = Math.max(0, Number(totalDamage) || 0);
  return g + min + mod + maj + tot;
}

/**
 * Calculates dominant physical condition for facility items based on damage counts
 */
export function calculateFacilityCondition(
  good: number,
  minor: number = 0,
  moderate: number = 0,
  major: number = 0,
  totalDamage: number = 0
): PhysicalCondition {
  const g = Math.max(0, Number(good) || 0);
  const min = Math.max(0, Number(minor) || 0);
  const mod = Math.max(0, Number(moderate) || 0);
  const maj = Math.max(0, Number(major) || 0);
  const tot = Math.max(0, Number(totalDamage) || 0);
  const totalUnits = g + min + mod + maj + tot;

  if (totalUnits === 0) return 'Baik';

  const damageScore = (min * 0.2 + mod * 0.45 + maj * 0.75 + tot * 1.0) / totalUnits;
  const damagePercentage = damageScore * 100;

  return calculateConditionFromPercentage(damagePercentage);
}

/**
 * Calculates area from length and width
 */
export function calculateArea(length: number, width: number): number {
  const l = Math.max(0, Number(length) || 0);
  const w = Math.max(0, Number(width) || 0);
  return Number((l * w).toFixed(2));
}
