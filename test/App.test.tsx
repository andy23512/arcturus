import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../src/App'

// The clock is fixed so the numbers on the page can be worked out by hand.
// Birthday 2000-01-01, today 2024-06-15: 8932 days = 1276 weeks.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2024, 5, 15, 13, 30))
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const fill = (id: string, value: string) =>
  fireEvent.change(document.querySelector(`#${id}`)!, { target: { value } })
const draw = (full = '') => {
  fill('birthday', '2000-01-01')
  fill('charaStart', '2010-01-01')
  if (full) fill('charaFull', full)
  fireEvent.click(screen.getByRole('button', { name: 'Draw my weeks' }))
}
const stat = (label: string) =>
  [...document.querySelectorAll('.stat-item')].find((el) => el.querySelector('dt')!.textContent === label)!
    .querySelector('dd')!.textContent

describe('App', () => {
  it('starts with the form, no results', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Arcturus')
    expect(document.querySelector('.date-form')).not.toBeNull()
    expect(document.querySelector('.weeks-grid')).toBeNull()
    expect(document.querySelector('.stats-panel')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Print' })).toBeNull()
  })

  it('links to the source in a new tab, on both screens', () => {
    render(<App />)
    const link = () => screen.getByRole('link', { name: 'Source on GitHub' }) as HTMLAnchorElement
    expect(link().href).toBe('https://github.com/andy23512/arcturus')
    expect([link().target, link().rel]).toEqual(['_blank', 'noopener'])
    draw()
    expect(link().href).toBe('https://github.com/andy23512/arcturus')
  })

  it('does not move on while the form has errors', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Draw my weeks' }))
    expect(document.querySelector('.weeks-grid')).toBeNull()
    expect(document.querySelectorAll('.date-form-error')).toHaveLength(2)
  })

  it('shows the stats and the grid after a good submit, with the right numbers', () => {
    render(<App />)
    draw()
    expect(document.querySelector('.date-form')).toBeNull()
    expect(stat('Weeks lived')).toBe('1,276')
    expect(stat('Life elapsed (of 90 years)')).toBe('27.3%')
    // start 2010-01-01 is 3653 days = 521 weeks in
    expect(stat('Weeks with CharaChorder')).toBe('755')
    expect(stat('Share of life so far with CharaChorder')).toBe('59.2%')
    expect(document.querySelectorAll('.week-cell')).toHaveLength(4680)
  })

  it('colours the grid to match: lived weeks first, then future', () => {
    render(<App />)
    draw()
    const count = (state: string) => document.querySelectorAll(`.week-cell--${state}`).length
    expect(count('pre-chara')).toBe(521)
    expect(count('chara-partial')).toBe(755)
    expect(count('chara-full')).toBe(0)
    expect(count('future')).toBe(4680 - 1276)
  })

  it('adds the full-switch tiles only when that date was given', () => {
    render(<App />)
    draw()
    expect(document.querySelectorAll('.stat-item')).toHaveLength(4)
    fireEvent.click(screen.getByRole('button', { name: 'Start over' }))
    draw('2020-01-01') // 7305 days = 1043 weeks in; 1276 - 1043 = 233 weeks
    expect(document.querySelectorAll('.stat-item')).toHaveLength(7)
    expect(stat('Weeks fully switched')).toBe('233')
    expect(document.querySelectorAll('.week-cell--chara-full')).toHaveLength(233)
  })

  it('Start over returns to an empty form', () => {
    render(<App />)
    draw()
    fireEvent.click(screen.getByRole('button', { name: 'Start over' }))
    expect(document.querySelector('.weeks-grid')).toBeNull()
    expect((document.querySelector('#birthday') as HTMLInputElement).value).toBe('')
  })

  it('Print opens the print dialog; the action buttons are hidden when printing', () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => {})
    render(<App />)
    draw()
    fireEvent.click(screen.getByRole('button', { name: 'Print' }))
    expect(print).toHaveBeenCalledTimes(1)
    expect(document.querySelector('.app-actions')!.classList.contains('no-print')).toBe(true)
    expect(document.querySelector('.app-footer')!.classList.contains('no-print')).toBe(true)
  })

  it('a birthday today shows an empty life', () => {
    render(<App />)
    fill('birthday', '2024-06-15')
    fill('charaStart', '2024-06-15')
    fireEvent.click(screen.getByRole('button', { name: 'Draw my weeks' }))
    expect(stat('Weeks lived')).toBe('0')
    expect(document.querySelectorAll('.week-cell--future')).toHaveLength(4680)
  })
})
