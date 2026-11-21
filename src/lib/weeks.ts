import type { DateFormValues, LifeWeeksInput, Stats, ValidationErrors, WeekState } from '../types'

export const WEEKS_PER_ROW = 52
export const LIFESPAN_YEARS = 90
export const TOTAL_WEEKS = WEEKS_PER_ROW * LIFESPAN_YEARS

const MS_PER_DAY = 24 * 60 * 60 * 1000

// Parsed/compared as local calendar dates at midnight, so a user's "today"
// always matches their own local date regardless of UTC offset.
export function parseDateInput(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  const [, year, month, day] = match
  const date = new Date(Number(year), Number(month) - 1, Number(day))
  if (Number.isNaN(date.getTime())) return null
  // `Date` rolls impossible days over (2023-02-30 -> 2 March), so check it came back unchanged.
  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    return null
  }
  return date
}

export function startOfToday(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max)
}

// Both dates are local midnights, so across a daylight-saving change the gap is a
// whole number of days give or take an hour. Rounding to whole days first keeps a
// span that is exactly N weeks from reading as N weeks minus an hour.
export function weeksBetween(a: Date, b: Date): number {
  return Math.floor(Math.round((b.getTime() - a.getTime()) / MS_PER_DAY) / 7)
}

export function buildWeekStates(input: LifeWeeksInput, today: Date = startOfToday()): WeekState[] {
  const weeksLived = clamp(weeksBetween(input.birthday, today), 0, TOTAL_WEEKS)
  const charaStartIndex = clamp(weeksBetween(input.birthday, input.charaStart), 0, TOTAL_WEEKS)
  const charaFullIndex = input.charaFull
    ? clamp(weeksBetween(input.birthday, input.charaFull), 0, TOTAL_WEEKS)
    : null

  const states: WeekState[] = new Array(TOTAL_WEEKS)
  for (let i = 0; i < TOTAL_WEEKS; i++) {
    if (i >= weeksLived) {
      states[i] = 'future'
    } else if (charaFullIndex !== null && i >= charaFullIndex) {
      states[i] = 'chara-full'
    } else if (i >= charaStartIndex) {
      states[i] = 'chara-partial'
    } else {
      states[i] = 'pre-chara'
    }
  }
  return states
}

export function computeStats(input: LifeWeeksInput, today: Date = startOfToday()): Stats {
  const weeksLived = clamp(weeksBetween(input.birthday, today), 0, TOTAL_WEEKS)
  const charaStartIndex = clamp(weeksBetween(input.birthday, input.charaStart), 0, TOTAL_WEEKS)
  const charaFullIndex = input.charaFull
    ? clamp(weeksBetween(input.birthday, input.charaFull), 0, TOTAL_WEEKS)
    : null

  const weeksWithChara = Math.max(0, weeksLived - charaStartIndex)
  const weeksFullySwitched = charaFullIndex !== null ? Math.max(0, weeksLived - charaFullIndex) : null

  const percentLifeElapsed = (weeksLived / TOTAL_WEEKS) * 100
  const percentOfLifeWithChara = weeksLived > 0 ? (weeksWithChara / weeksLived) * 100 : 0
  const percentOfLifeFullySwitched =
    weeksFullySwitched !== null && weeksLived > 0 ? (weeksFullySwitched / weeksLived) * 100 : null
  const percentOfCharaUseFullySwitched =
    weeksFullySwitched !== null && weeksWithChara > 0 ? (weeksFullySwitched / weeksWithChara) * 100 : null

  return {
    weeksLived,
    totalWeeks: TOTAL_WEEKS,
    percentLifeElapsed,
    weeksWithChara,
    percentOfLifeWithChara,
    weeksFullySwitched,
    percentOfLifeFullySwitched,
    percentOfCharaUseFullySwitched,
  }
}

export function validateInput(
  raw: DateFormValues,
  today: Date = startOfToday(),
): { errors: ValidationErrors; input: LifeWeeksInput | null } {
  const errors: ValidationErrors = {}

  const birthday = raw.birthday ? parseDateInput(raw.birthday) : null
  const charaStart = raw.charaStart ? parseDateInput(raw.charaStart) : null
  const charaFull = raw.charaFull ? parseDateInput(raw.charaFull) : null

  if (!birthday) {
    errors.birthday = 'Enter your birthday.'
  } else if (birthday.getTime() > today.getTime()) {
    errors.birthday = 'Birthday cannot be in the future.'
  }

  if (!charaStart) {
    errors.charaStart = 'Enter the date you started using CharaChorder.'
  } else if (charaStart.getTime() > today.getTime()) {
    errors.charaStart = 'This date cannot be in the future.'
  } else if (birthday && charaStart.getTime() < birthday.getTime()) {
    errors.charaStart = 'Cannot be before your birthday.'
  }

  if (raw.charaFull) {
    if (!charaFull) {
      errors.charaFull = 'Invalid date.'
    } else if (charaFull.getTime() > today.getTime()) {
      errors.charaFull = 'This date cannot be in the future.'
    } else if (charaStart && charaFull.getTime() < charaStart.getTime()) {
      errors.charaFull = 'Cannot be before the CharaChorder start date.'
    }
  }

  if (Object.keys(errors).length > 0 || !birthday || !charaStart) {
    return { errors, input: null }
  }

  return {
    errors,
    input: {
      birthday,
      charaStart,
      charaFull: charaFull ?? undefined,
    },
  }
}
