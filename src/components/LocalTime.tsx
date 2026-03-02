'use client'

type Props = {
  timestamp: string
}

export default function LocalTime({ timestamp }: Props) {
  const date = new Date(timestamp)
  const now = new Date()

  const lineupLocked = now.getTime() > date.getTime() ? true : false;

  const localTime = date.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });

  return (
    <span className={`font-bold ${lineupLocked ? 'text-red-600' : 'text-yellow-600'}`}>
      {localTime} {lineupLocked ? '(lineup locked)' : ''}
    </span>
  )
}