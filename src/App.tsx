import { useState } from 'react'
import { DateForm } from './components/DateForm'
import { WeeksGrid } from './components/WeeksGrid'
import { StatsPanel } from './components/StatsPanel'
import { buildWeekStates, computeStats, startOfToday } from './lib/weeks'
import type { LifeWeeksInput } from './types'
import './App.css'

function App() {
  const [input, setInput] = useState<LifeWeeksInput | null>(null)

  if (!input) {
    return (
      <div className="app-root">
        <header className="app-header">
          <h1>Arcturus</h1>
          <p className="app-subtitle">
            Your life in weeks — with the weeks you've spent chording on a CharaChorder highlighted.
          </p>
        </header>
        <DateForm onSubmit={setInput} />
      </div>
    )
  }

  const today = startOfToday()
  const weekStates = buildWeekStates(input, today)
  const stats = computeStats(input, today)

  return (
    <div className="app-root">
      <header className="app-header">
        <h1>Arcturus</h1>
        <div className="app-actions no-print">
          <button type="button" onClick={() => window.print()}>
            Print
          </button>
          <button type="button" onClick={() => setInput(null)}>
            Start over
          </button>
        </div>
      </header>

      <StatsPanel stats={stats} hasFullSwitch={Boolean(input.charaFull)} />
      <WeeksGrid weekStates={weekStates} />
    </div>
  )
}

export default App
