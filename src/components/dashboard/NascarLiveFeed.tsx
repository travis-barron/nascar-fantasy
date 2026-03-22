export interface NascarLiveFeed {
  race_id: number
  series_id: number
  run_id: number
  lap_number: number
  laps_in_race: number
  laps_to_go: number
  flag_state: string
  race_status: string
  leaderboard: LeaderboardEntry[]
}

export interface LeaderboardEntry {
  car_number: string
  driver_id: number
  driver_name: string
  position: number
  laps_led: number
  interval: string
  interval_ms: number
  last_lap_time: number
  best_lap_time: number
  pit_stop_count: number
  manufacturer: string
  team_name: string
}