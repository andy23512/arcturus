import type { Stats } from '../types'
import './StatsPanel.css'

interface StatsPanelProps {
  stats: Stats
  hasFullSwitch: boolean
}

export function StatsPanel({ stats, hasFullSwitch }: StatsPanelProps) {
  return (
    <dl className="stats-panel">
      <StatItem label="Weeks lived" value={stats.weeksLived.toLocaleString()} />
      <StatItem label="Life elapsed (of 90 years)" value={`${stats.percentLifeElapsed.toFixed(1)}%`} />
      <StatItem label="Weeks with CharaChorder" value={stats.weeksWithChara.toLocaleString()} />
      <StatItem
        label="Share of life so far with CharaChorder"
        value={`${stats.percentOfLifeWithChara.toFixed(1)}%`}
      />
      {hasFullSwitch && stats.weeksFullySwitched !== null && (
        <>
          <StatItem label="Weeks fully switched" value={stats.weeksFullySwitched.toLocaleString()} />
          <StatItem
            label="Share of life so far fully switched"
            value={`${stats.percentOfLifeFullySwitched!.toFixed(1)}%`}
          />
          <StatItem
            label="Share of CharaChorder use that's full-switch"
            value={`${stats.percentOfCharaUseFullySwitched!.toFixed(1)}%`}
          />
        </>
      )}
    </dl>
  )
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-item">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
