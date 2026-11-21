import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DateForm } from '../src/components/DateForm'
import { StatsPanel } from '../src/components/StatsPanel'
import { WeeksGrid } from '../src/components/WeeksGrid'
import { TOTAL_WEEKS } from '../src/lib/weeks'
import type { Stats, WeekState } from '../src/types'

afterEach(cleanup)

const stats = (over: Partial<Stats> = {}): Stats => ({
  weeksLived: 1234,
  totalWeeks: 4680,
  percentLifeElapsed: 26.36,
  weeksWithChara: 567,
  percentOfLifeWithChara: 45.95,
  weeksFullySwitched: 100,
  percentOfLifeFullySwitched: 8.1,
  percentOfCharaUseFullySwitched: 17.64,
  ...over,
})

const tiles = (container: HTMLElement) =>
  [...container.querySelectorAll('.stat-item')].map((el) => [
    el.querySelector('dt')!.textContent,
    el.querySelector('dd')!.textContent,
  ])

describe('StatsPanel', () => {
  it('shows four tiles, with thousands separators and one decimal place', () => {
    const { container } = render(<StatsPanel stats={stats()} hasFullSwitch={false} />)
    expect(tiles(container)).toEqual([
      ['Weeks lived', '1,234'],
      ['Life elapsed (of 90 years)', '26.4%'],
      ['Weeks with CharaChorder', '567'],
      ['Share of life so far with CharaChorder', '46.0%'],
    ])
  })

  it('puts thousands separators on every count', () => {
    const { container } = render(
      <StatsPanel stats={stats({ weeksLived: 4321, weeksWithChara: 2345, weeksFullySwitched: 1234 })} hasFullSwitch />,
    )
    const values = Object.fromEntries(tiles(container))
    expect(values['Weeks lived']).toBe('4,321')
    expect(values['Weeks with CharaChorder']).toBe('2,345')
    expect(values['Weeks fully switched']).toBe('1,234')
  })

  it('adds three tiles when fully switched', () => {
    const { container } = render(<StatsPanel stats={stats()} hasFullSwitch />)
    expect(tiles(container).slice(4)).toEqual([
      ['Weeks fully switched', '100'],
      ['Share of life so far fully switched', '8.1%'],
      ["Share of CharaChorder use that's full-switch", '17.6%'],
    ])
    expect(tiles(container)).toHaveLength(7)
  })

  it('leaves them out when the flag is off, even if the numbers are there', () => {
    const { container } = render(<StatsPanel stats={stats()} hasFullSwitch={false} />)
    expect(tiles(container)).toHaveLength(4)
  })

  it('leaves them out when the flag is on but there is no count', () => {
    const { container } = render(
      <StatsPanel stats={stats({ weeksFullySwitched: null })} hasFullSwitch />,
    )
    expect(tiles(container)).toHaveLength(4)
  })

  it('shows a zero count with zero shares', () => {
    const { container } = render(
      <StatsPanel
        stats={stats({ weeksFullySwitched: 0, percentOfLifeFullySwitched: 0, percentOfCharaUseFullySwitched: 0 })}
        hasFullSwitch
      />,
    )
    expect(tiles(container).slice(4).map(([, v]) => v)).toEqual(['0', '0.0%', '0.0%'])
  })
})

describe('WeeksGrid', () => {
  const states = (fill: (i: number) => WeekState): WeekState[] =>
    Array.from({ length: TOTAL_WEEKS }, (_, i) => fill(i))
  const cells = (container: HTMLElement) => [...container.querySelectorAll('.week-cell')]

  it('draws 90 rows of 52 weeks', () => {
    const { container } = render(<WeeksGrid weekStates={states(() => 'future')} />)
    expect(cells(container)).toHaveLength(4680)
    expect(container.querySelectorAll('.weeks-grid-row-label')).toHaveLength(90)
    expect((container.querySelector('.weeks-grid') as HTMLElement).style.gridTemplateColumns).toBe(
      'max-content repeat(52, 1fr)',
    )
  })

  it('gives each cell the class of its state, in order', () => {
    const order: WeekState[] = ['pre-chara', 'chara-partial', 'chara-full', 'future']
    const { container } = render(<WeeksGrid weekStates={states((i) => order[i % 4])} />)
    const found = cells(container).map((el) => el.className)
    for (let i = 0; i < 40; i++) expect(found[i]).toBe(`week-cell week-cell--${order[i % 4]}`)
    expect(found[4679]).toBe(`week-cell week-cell--${order[4679 % 4]}`)
  })

  it('puts the 53rd week at the start of the second row', () => {
    const { container } = render(
      <WeeksGrid weekStates={states((i) => (i < 52 ? 'pre-chara' : 'future'))} />,
    )
    const all = [...container.querySelector('.weeks-grid')!.children]
    // children go: label, 52 cells, label, 52 cells ...
    expect(all[1].className).toContain('pre-chara')
    expect(all[52].className).toContain('pre-chara')
    expect(all[53].className).toBe('weeks-grid-row-label')
    expect(all[54].className).toContain('future')
  })

  it('labels every tenth row with its age and leaves the others blank', () => {
    const { container } = render(<WeeksGrid weekStates={states(() => 'future')} />)
    const labels = [...container.querySelectorAll('.weeks-grid-row-label')].map((el) => el.textContent)
    expect(labels.filter(Boolean)).toEqual(['0', '10', '20', '30', '40', '50', '60', '70', '80'])
    expect(labels[0]).toBe('0')
    expect(labels[10]).toBe('10')
    expect(labels[11]).toBe('')
    expect(labels[89]).toBe('')
  })

  it('has a legend of four meanings', () => {
    const { container } = render(<WeeksGrid weekStates={states(() => 'future')} />)
    const legend = [...container.querySelectorAll('.weeks-grid-legend li')].map((li) => [
      li.querySelector('.legend-swatch')!.className,
      li.textContent!.trim(),
    ])
    expect(legend).toEqual([
      ['legend-swatch legend-swatch--pre-chara', 'Before CharaChorder'],
      ['legend-swatch legend-swatch--chara-partial', 'Using CharaChorder'],
      ['legend-swatch legend-swatch--chara-full', 'Fully switched to CharaChorder'],
      ['legend-swatch legend-swatch--future', 'Future'],
    ])
  })
})

describe('DateForm', () => {
  const fill = (id: string, value: string) =>
    fireEvent.change(container().querySelector(`#${id}`)!, { target: { value } })
  let current: HTMLElement
  const container = () => current
  const setup = () => {
    const onSubmit = vi.fn()
    current = render(<DateForm onSubmit={onSubmit} />).container
    return onSubmit
  }
  const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Draw my weeks' }))
  const errors = () => [...current.querySelectorAll('.date-form-error')].map((el) => el.textContent)

  it('has three labelled date fields, the last one marked optional, all empty', () => {
    setup()
    for (const [id, label] of [
      ['birthday', 'Your birthday'],
      ['charaStart', 'Date you started using CharaChorder'],
      ['charaFull', 'Date you fully switched to CharaChorder (optional)'],
    ]) {
      const input = screen.getByLabelText(label) as HTMLInputElement
      expect(input.id).toBe(id)
      expect(input.type).toBe('date')
      expect(input.value).toBe('')
    }
    expect(errors()).toEqual([])
  })

  it('stops the browser from sending the form itself (no page reload)', () => {
    setup()
    // fireEvent returns false when the handler called preventDefault
    expect(fireEvent.submit(current.querySelector('form')!)).toBe(false)
  })

  it('shows the errors for an empty form and does not submit', () => {
    const onSubmit = setup()
    submit()
    expect(errors()).toEqual(['Enter your birthday.', 'Enter the date you started using CharaChorder.'])
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits good dates once, as Dates', () => {
    const onSubmit = setup()
    fill('birthday', '1990-05-01')
    fill('charaStart', '2020-01-01')
    submit()
    expect(errors()).toEqual([])
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith({
      birthday: new Date(1990, 4, 1),
      charaStart: new Date(2020, 0, 1),
      charaFull: undefined,
    })
  })

  it('passes the full-switch date along when it is filled in', () => {
    const onSubmit = setup()
    fill('birthday', '1990-05-01')
    fill('charaStart', '2020-01-01')
    fill('charaFull', '2021-06-30')
    submit()
    expect(onSubmit.mock.calls[0][0].charaFull).toEqual(new Date(2021, 5, 30))
  })

  it('puts each error under its own field', () => {
    setup()
    fill('birthday', '1990-05-01')
    fill('charaStart', '1980-01-01')
    fill('charaFull', '1970-01-01')
    submit()
    const under = (id: string) =>
      current.querySelector(`#${id}`)!.parentElement!.querySelector('.date-form-error')?.textContent
    expect(under('birthday')).toBeUndefined()
    expect(under('charaStart')).toBe('Cannot be before your birthday.')
    expect(under('charaFull')).toBe('Cannot be before the CharaChorder start date.')
  })

  it('clears the errors once the form is fixed and sent again', () => {
    const onSubmit = setup()
    submit()
    expect(errors()).toHaveLength(2)
    fill('birthday', '1990-05-01')
    fill('charaStart', '2020-01-01')
    expect(errors()).toHaveLength(2) // still shown until it is sent again
    submit()
    expect(errors()).toEqual([])
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('keeps what was typed in each field apart', () => {
    setup()
    fill('birthday', '1990-05-01')
    fill('charaFull', '2021-06-30')
    expect((current.querySelector('#birthday') as HTMLInputElement).value).toBe('1990-05-01')
    expect((current.querySelector('#charaStart') as HTMLInputElement).value).toBe('')
    expect((current.querySelector('#charaFull') as HTMLInputElement).value).toBe('2021-06-30')
  })
})
