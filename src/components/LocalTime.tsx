'use client'

type Props = {
  timestamp: string
}

export default function LocalTime({ timestamp }: Props) {
  const date = new Date(timestamp)

  return (
    <span>
      {date.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })}
    </span>
  )
}