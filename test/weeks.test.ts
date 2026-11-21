import { describe, expect, it } from 'vitest'
import {
  LIFESPAN_YEARS,
  TOTAL_WEEKS,
  WEEKS_PER_ROW,
  buildWeekStates,
  computeStats,
  parseDateInput,
  startOfToday,
  validateInput,
  weeksBetween,
} from '../src/lib/weeks'

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day)

describe('constants', () => {
  it('are 52 weeks a row for 90 years', () => {
    expect(WEEKS_PER_ROW).toBe(52)
    expect(LIFESPAN_YEARS).toBe(90)
    expect(TOTAL_WEEKS).toBe(4680)
  })
})

describe('parseDateInput', () => {
  it('reads YYYY-MM-DD as a local midnight', () => {
    const date = parseDateInput('2024-03-05')!
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2024, 2, 5])
    expect([date.getHours(), date.getMinutes(), date.getSeconds()]).toEqual([0, 0, 0])
  })

  it('refuses anything that is not exactly YYYY-MM-DD', () => {
    for (const bad of ['', '2024-3-5', '24-03-05', '2024/03/05', '2024-03-05T00:00', ' 2024-03-05', '2024-03-05 ', 'abcd-ef-gh', '20240305']) {
      expect(parseDateInput(bad), JSON.stringify(bad)).toBeNull()
    }
  })

  it('accepts a leap day', () => {
    const date = parseDateInput('2024-02-29')!
    expect([date.getMonth(), date.getDate()]).toEqual([1, 29])
  })

  it('has no complaint about a date that does not exist (it rolls over), current behaviour', () => {
    const date = parseDateInput('2023-02-30')!
    expect([date.getMonth(), date.getDate()]).toEqual([2, 2])
    const month13 = parseDateInput('2023-13-01')!
    expect([month13.getFullYear(), month13.getMonth()]).toEqual([2024, 0])
  })
})

describe('startOfToday', () => {
  it('is local midnight of the current day', () => {
    const before = new Date()
    const today = startOfToday()
    expect([today.getHours(), today.getMinutes(), today.getSeconds(), today.getMilliseconds()]).toEqual([0, 0, 0, 0])
    expect(today.getTime()).toBeLessThanOrEqual(before.getTime() + 1000)
    expect(before.getTime() - today.getTime()).toBeLessThan(25 * 3600 * 1000)
    expect(today.getDate()).toBeGreaterThanOrEqual(1)
  })
})

describe('test environment', () => {
  it('runs in a time zone with daylight saving, so the date tests mean something', () => {
    expect(new Date(2024, 2, 10, 12).getTimezoneOffset()).not.toBe(new Date(2024, 0, 10, 12).getTimezoneOffset())
  })
})

describe('weeksBetween', () => {
  it('counts whole weeks, rounding down', () => {
    expect(weeksBetween(d(2024, 1, 1), d(2024, 1, 1))).toBe(0)
    expect(weeksBetween(d(2024, 1, 1), d(2024, 1, 7))).toBe(0)
    expect(weeksBetween(d(2024, 1, 1), d(2024, 1, 8))).toBe(1)
    expect(weeksBetween(d(2024, 1, 1), d(2024, 1, 14))).toBe(1)
    expect(weeksBetween(d(2024, 1, 1), d(2024, 1, 15))).toBe(2)
    expect(weeksBetween(d(2024, 1, 1), d(2025, 1, 1))).toBe(52)
  })

  it('is negative when the second date is earlier', () => {
    expect(weeksBetween(d(2024, 1, 8), d(2024, 1, 1))).toBe(-1)
    expect(weeksBetween(d(2024, 1, 2), d(2024, 1, 1))).toBe(-1)
  })

  it('still gives exact weeks across a daylight-saving change (only meaningful in a zone that has one)', () => {
    // 2024-03-10 (US spring forward) and 2024-10-27 (EU fall back) both fall inside these spans
    expect(weeksBetween(d(2024, 3, 3), d(2024, 3, 17))).toBe(2)
    expect(weeksBetween(d(2024, 10, 20), d(2024, 11, 3))).toBe(2)
    expect(weeksBetween(d(2000, 1, 1), d(2024, 1, 1))).toBe(1252)
  })

  it('counts a week that starts in winter and ends in summer as a full week', () => {
    // 2024-03-10 is the spring-forward day in New York: that span is 14 days minus an hour
    expect(weeksBetween(d(2024, 3, 3), d(2024, 3, 17))).toBe(2)
    expect(weeksBetween(d(2024, 1, 1), d(2024, 7, 1))).toBe(26) // 182 days
    expect(weeksBetween(d(1990, 1, 15), d(2024, 7, 1))).toBe(Math.floor(12586 / 7)) // 12586 days
  })
})

describe('buildWeekStates', () => {
  const birthday = d(2000, 1, 1)

  it('always gives one state per week of the 90 years', () => {
    const states = buildWeekStates({ birthday, charaStart: d(2010, 1, 1) }, d(2020, 1, 1))
    expect(states).toHaveLength(TOTAL_WEEKS)
  })

  it('is all future on the birthday itself', () => {
    const states = buildWeekStates({ birthday, charaStart: birthday }, birthday)
    expect(new Set(states)).toEqual(new Set(['future']))
  })

  it('marks lived weeks before the start as pre-chara, from the start as partial, the rest future', () => {
    // today is 20 weeks in, start at week 5
    const states = buildWeekStates({ birthday, charaStart: d(2000, 2, 5) }, d(2000, 5, 20))
    const lived = weeksBetween(birthday, d(2000, 5, 20))
    const start = weeksBetween(birthday, d(2000, 2, 5))
    expect(states.slice(0, start).every((s) => s === 'pre-chara')).toBe(true)
    expect(states.slice(start, lived).every((s) => s === 'chara-partial')).toBe(true)
    expect(states.slice(lived).every((s) => s === 'future')).toBe(true)
    expect([start, lived]).toEqual([5, 20])
  })

  it('switches to chara-full from the full-switch week', () => {
    const today = d(2000, 5, 20) // 20 weeks
    const states = buildWeekStates(
      { birthday, charaStart: d(2000, 2, 5), charaFull: d(2000, 3, 18) }, // weeks 5 and 11
      today,
    )
    expect(states[4]).toBe('pre-chara')
    expect(states[5]).toBe('chara-partial')
    expect(states[10]).toBe('chara-partial')
    expect(states[11]).toBe('chara-full')
    expect(states[19]).toBe('chara-full')
    expect(states[20]).toBe('future')
  })

  it('the week of the start date itself already counts', () => {
    const states = buildWeekStates({ birthday, charaStart: d(2000, 1, 8) }, d(2000, 1, 15))
    expect(states.slice(0, 3)).toEqual(['pre-chara', 'chara-partial', 'future'])
  })

  it('starting on the birthday means no pre-chara weeks', () => {
    const states = buildWeekStates({ birthday, charaStart: birthday }, d(2000, 1, 15))
    expect(states.slice(0, 3)).toEqual(['chara-partial', 'chara-partial', 'future'])
  })

  it('without a full-switch date there is no chara-full', () => {
    const states = buildWeekStates({ birthday, charaStart: d(2005, 1, 1) }, d(2020, 1, 1))
    expect(states).not.toContain('chara-full')
  })

  it('a full-switch on the start week leaves no partial weeks', () => {
    const states = buildWeekStates({ birthday, charaStart: d(2005, 1, 1), charaFull: d(2005, 1, 1) }, d(2020, 1, 1))
    expect(states).not.toContain('chara-partial')
    expect(states).toContain('chara-full')
  })

  it('a person past 90 has no future weeks', () => {
    const states = buildWeekStates({ birthday, charaStart: d(2010, 1, 1) }, d(2100, 1, 1))
    expect(states).not.toContain('future')
    expect(states).toHaveLength(TOTAL_WEEKS)
    expect(states[TOTAL_WEEKS - 1]).toBe('chara-partial')
  })

  it('a birthday in the future gives only future weeks', () => {
    const states = buildWeekStates({ birthday: d(2030, 1, 1), charaStart: d(2031, 1, 1) }, d(2020, 1, 1))
    expect(new Set(states)).toEqual(new Set(['future']))
  })

  it('a start before the birthday is treated as the birthday', () => {
    const states = buildWeekStates({ birthday, charaStart: d(1990, 1, 1) }, d(2000, 1, 15))
    expect(states.slice(0, 2)).toEqual(['chara-partial', 'chara-partial'])
  })

  it('uses today when none is given', () => {
    const states = buildWeekStates({ birthday: d(2000, 1, 1), charaStart: d(2000, 1, 1) })
    const lived = states.filter((s) => s !== 'future').length
    expect(lived).toBe(weeksBetween(d(2000, 1, 1), startOfToday()))
  })
})

describe('computeStats', () => {
  const birthday = d(2000, 1, 1)

  it('works out weeks and shares', () => {
    // 100 weeks lived, start at week 40, full switch at week 70
    const today = new Date(birthday.getTime())
    today.setDate(today.getDate() + 700)
    const start = new Date(birthday.getTime())
    start.setDate(start.getDate() + 280)
    const full = new Date(birthday.getTime())
    full.setDate(full.getDate() + 490)
    const stats = computeStats({ birthday, charaStart: start, charaFull: full }, today)
    expect(stats.weeksLived).toBe(100)
    expect(stats.totalWeeks).toBe(4680)
    expect(stats.percentLifeElapsed).toBeCloseTo((100 / 4680) * 100, 10)
    expect(stats.weeksWithChara).toBe(60)
    expect(stats.percentOfLifeWithChara).toBeCloseTo(60, 10)
    expect(stats.weeksFullySwitched).toBe(30)
    expect(stats.percentOfLifeFullySwitched).toBeCloseTo(30, 10)
    expect(stats.percentOfCharaUseFullySwitched).toBeCloseTo(50, 10)
  })

  it('has null full-switch figures when there is no full-switch date', () => {
    const stats = computeStats({ birthday, charaStart: d(2005, 1, 1) }, d(2010, 1, 1))
    expect(stats.weeksFullySwitched).toBeNull()
    expect(stats.percentOfLifeFullySwitched).toBeNull()
    expect(stats.percentOfCharaUseFullySwitched).toBeNull()
    expect(stats.weeksWithChara).toBeGreaterThan(0)
  })

  it('is all zeros on the birthday, with no division by zero', () => {
    const stats = computeStats({ birthday, charaStart: birthday, charaFull: birthday }, birthday)
    expect(stats.weeksLived).toBe(0)
    expect(stats.percentLifeElapsed).toBe(0)
    expect(stats.weeksWithChara).toBe(0)
    expect(stats.percentOfLifeWithChara).toBe(0)
    expect(stats.weeksFullySwitched).toBe(0)
    expect(stats.percentOfLifeFullySwitched).toBeNull()
    expect(stats.percentOfCharaUseFullySwitched).toBeNull()
  })

  it('has no chara weeks yet when the start is still ahead', () => {
    const stats = computeStats({ birthday, charaStart: d(2020, 1, 1) }, d(2010, 1, 1))
    expect(stats.weeksWithChara).toBe(0)
    expect(stats.percentOfLifeWithChara).toBe(0)
  })

  it('has no full-switch figures when full-switch is ahead, but a zero count', () => {
    const stats = computeStats({ birthday, charaStart: d(2005, 1, 1), charaFull: d(2020, 1, 1) }, d(2010, 1, 1))
    expect(stats.weeksFullySwitched).toBe(0)
    expect(stats.percentOfLifeFullySwitched).toBe(0)
    expect(stats.percentOfCharaUseFullySwitched).toBe(0)
  })

  it('stops counting at 90 years', () => {
    const stats = computeStats({ birthday, charaStart: d(2010, 1, 1) }, d(2200, 1, 1))
    expect(stats.weeksLived).toBe(4680)
    expect(stats.percentLifeElapsed).toBe(100)
    expect(stats.weeksWithChara).toBe(4680 - weeksBetween(birthday, d(2010, 1, 1)))
  })

  it('a birthday in the future has no weeks lived', () => {
    const stats = computeStats({ birthday: d(2030, 1, 1), charaStart: d(2031, 1, 1) }, d(2020, 1, 1))
    expect(stats.weeksLived).toBe(0)
    expect(stats.percentLifeElapsed).toBe(0)
  })

  it('agrees with the week states', () => {
    const input = { birthday, charaStart: d(2008, 6, 1), charaFull: d(2015, 3, 1) }
    const today = d(2024, 5, 5)
    const states = buildWeekStates(input, today)
    const stats = computeStats(input, today)
    expect(stats.weeksLived).toBe(states.filter((s) => s !== 'future').length)
    expect(stats.weeksWithChara).toBe(states.filter((s) => s === 'chara-partial' || s === 'chara-full').length)
    expect(stats.weeksFullySwitched).toBe(states.filter((s) => s === 'chara-full').length)
  })
})

describe('validateInput', () => {
  const today = d(2024, 6, 15)
  const check = (birthday: string, charaStart: string, charaFull = '') =>
    validateInput({ birthday, charaStart, charaFull }, today)

  it('accepts good dates and returns them as Dates', () => {
    const { errors, input } = check('1990-05-01', '2020-01-01', '2022-02-02')
    expect(errors).toEqual({})
    expect(input).toEqual({ birthday: d(1990, 5, 1), charaStart: d(2020, 1, 1), charaFull: d(2022, 2, 2) })
  })

  it('leaves charaFull out when it is not given', () => {
    const { input } = check('1990-05-01', '2020-01-01')
    expect(input!.charaFull).toBeUndefined()
  })

  it('asks for the two required dates', () => {
    expect(check('', '').errors).toEqual({
      birthday: 'Enter your birthday.',
      charaStart: 'Enter the date you started using CharaChorder.',
    })
    expect(check('', '').input).toBeNull()
  })

  it('treats a date it cannot read as missing', () => {
    expect(check('nope', '2020-01-01').errors.birthday).toBe('Enter your birthday.')
    expect(check('1990-05-01', '2020/01/01').errors.charaStart).toBe(
      'Enter the date you started using CharaChorder.',
    )
  })

  it('refuses a birthday in the future, but allows today', () => {
    expect(check('2024-06-16', '2024-06-16').errors.birthday).toBe('Birthday cannot be in the future.')
    expect(check('2024-06-15', '2024-06-15').errors).toEqual({})
  })

  it('refuses a start in the future, but allows today', () => {
    expect(check('1990-05-01', '2024-06-16').errors.charaStart).toBe('This date cannot be in the future.')
    expect(check('1990-05-01', '2024-06-15').errors).toEqual({})
  })

  it('refuses a start before the birthday, but allows the birthday itself', () => {
    expect(check('1990-05-01', '1990-04-30').errors.charaStart).toBe('Cannot be before your birthday.')
    expect(check('1990-05-01', '1990-05-01').errors).toEqual({})
  })

  it('does not also complain about the start being before a birthday that is itself wrong', () => {
    const { errors } = check('', '1990-04-30')
    expect(errors).toEqual({ birthday: 'Enter your birthday.' })
  })

  it('refuses an unreadable full-switch date, but a missing one is fine', () => {
    expect(check('1990-05-01', '2020-01-01', 'junk').errors).toEqual({ charaFull: 'Invalid date.' })
    expect(check('1990-05-01', '2020-01-01', '').errors).toEqual({})
  })

  it('refuses a full-switch in the future, but allows today', () => {
    expect(check('1990-05-01', '2020-01-01', '2024-06-16').errors.charaFull).toBe('This date cannot be in the future.')
    expect(check('1990-05-01', '2020-01-01', '2024-06-15').errors).toEqual({})
  })

  it('refuses a full-switch before the start, but allows the same day', () => {
    expect(check('1990-05-01', '2020-01-01', '2019-12-31').errors.charaFull).toBe(
      'Cannot be before the CharaChorder start date.',
    )
    expect(check('1990-05-01', '2020-01-01', '2020-01-01').errors).toEqual({})
  })

  it('reports several problems at once, and gives no input', () => {
    const { errors, input } = check('2030-01-01', '2031-01-01', '2000-01-01')
    expect(Object.keys(errors).sort()).toEqual(['birthday', 'charaFull', 'charaStart'])
    expect(input).toBeNull()
  })

  it('uses today when none is given', () => {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const iso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    expect(validateInput({ birthday: iso, charaStart: iso, charaFull: '' }).errors).toEqual({})
  })
})
