export interface LifeWeeksInput {
  birthday: Date
  charaStart: Date
  charaFull?: Date
}

export type WeekState = 'future' | 'pre-chara' | 'chara-partial' | 'chara-full'

export interface Stats {
  weeksLived: number
  totalWeeks: number
  percentLifeElapsed: number
  weeksWithChara: number
  percentOfLifeWithChara: number
  weeksFullySwitched: number | null
  percentOfLifeFullySwitched: number | null
  percentOfCharaUseFullySwitched: number | null
}

export interface DateFormValues {
  birthday: string
  charaStart: string
  charaFull: string
}

export interface ValidationErrors {
  birthday?: string
  charaStart?: string
  charaFull?: string
}
