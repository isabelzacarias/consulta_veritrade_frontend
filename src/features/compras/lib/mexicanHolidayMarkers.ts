export type HolidayMarkerGroup = 'official' | 'easter' | 'custom'

export interface HolidayMarker {
  year: number
  month: number
  day: number
  x: number
  name: string
  group: HolidayMarkerGroup
}

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

function daysInMonth(year: number, month: number): number {
  if (month === 2 && year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) {
    return 29
  }
  return DAYS_IN_MONTH[month - 1] ?? 0
}

function nthWeekdayOfMonth(
  year: number,
  month: number,
  weekday: number,
  occurrence: number,
): number {
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
  const daysUntilWeekday = (weekday - firstWeekday + 7) % 7
  return 1 + daysUntilWeekday + (occurrence - 1) * 7
}

function easterSunday(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(Date.UTC(year, month - 1, day))
}

function shiftDate(date: Date, days: number): Date {
  const shifted = new Date(date)
  shifted.setUTCDate(shifted.getUTCDate() + days)
  return shifted
}

export function getMexicanHolidayMarkers(years: number[]): HolidayMarker[] {
  const markers: HolidayMarker[] = []

  const add = (
    year: number,
    month: number,
    day: number,
    name: string,
    group: HolidayMarkerGroup,
  ) => {
    markers.push({
      year,
      month,
      day,
      x: month - 1 + (day - 1) / daysInMonth(year, month),
      name,
      group,
    })
  }

  for (const year of years) {
    add(year, 1, 1, 'Año Nuevo', 'official')
    add(
      year,
      2,
      nthWeekdayOfMonth(year, 2, 1, 1),
      'Día de la Constitución',
      'official',
    )
  
    add(year, 5, 1, 'Día del Trabajo', 'official')
    add(year, 9, 16, 'Día de la Independencia', 'official')
    add(
      year,
      11,
      nthWeekdayOfMonth(year, 11, 1, 3),
      'Día de la Revolución',
      'official',
    )
    add(year, 12, 25, 'Navidad', 'official')



    const easter = easterSunday(year)
    for (const [offset, name] of [
      [-3, 'Jueves Santo'],
      [-2, 'Viernes Santo'],
    ] as const) {
      const date = shiftDate(easter, offset)
      add(
        year,
        date.getUTCMonth() + 1,
        date.getUTCDate(),
        name,
        'easter',
      )
    }
  }

  return markers
}

export function getRecurringDateMarkers(
  years: number[],
  month: number,
  day: number,
  name: string,
): HolidayMarker[] {
  return years.flatMap((year) => {
    if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12 ||
      !Number.isInteger(day) ||
      day < 1 ||
      day > daysInMonth(year, month)
    ) {
      return []
    }

    return [
      {
        year,
        month,
        day,
        x: month - 1 + (day - 1) / daysInMonth(year, month),
        name,
        group: 'custom' as const,
      },
    ]
  })
}
