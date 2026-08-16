import { Fragment } from 'react'
import { LIFESPAN_YEARS, WEEKS_PER_ROW } from '../lib/weeks'
import type { WeekState } from '../types'
import './WeeksGrid.css'

interface WeeksGridProps {
  weekStates: WeekState[]
}

const ROWS = Array.from({ length: LIFESPAN_YEARS }, (_, rowIndex) => rowIndex)
const COLUMNS = Array.from({ length: WEEKS_PER_ROW }, (_, colIndex) => colIndex)

export function WeeksGrid({ weekStates }: WeeksGridProps) {
  return (
    <div className="weeks-grid-wrap">
      <div
        className="weeks-grid"
        style={{ gridTemplateColumns: `max-content repeat(${WEEKS_PER_ROW}, 1fr)` }}
      >
        {ROWS.map((rowIndex) => (
          <Fragment key={rowIndex}>
            <div className="weeks-grid-row-label">{rowIndex % 10 === 0 ? rowIndex : ''}</div>
            {COLUMNS.map((col) => {
              const weekIndex = rowIndex * WEEKS_PER_ROW + col
              const state = weekStates[weekIndex]
              return <div key={weekIndex} className={`week-cell week-cell--${state}`} />
            })}
          </Fragment>
        ))}
      </div>

      <ul className="weeks-grid-legend">
        <li>
          <span className="legend-swatch legend-swatch--pre-chara" /> Before CharaChorder
        </li>
        <li>
          <span className="legend-swatch legend-swatch--chara-partial" /> Using CharaChorder
        </li>
        <li>
          <span className="legend-swatch legend-swatch--chara-full" /> Fully switched to CharaChorder
        </li>
        <li>
          <span className="legend-swatch legend-swatch--future" /> Future
        </li>
      </ul>
    </div>
  )
}
