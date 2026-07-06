export async function fetchRaceResults(year: number, raceId: string) {
  
  const res = await fetch(
    `https://cf.nascar.com/cacher/${year}/1/${raceId}/lap-times.json`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch NASCAR results");
  }

  const data = await res.json();

  const parsedData = data.laps.map((l: { FullName: string; RunningPos: Number, NASCARDriverID: Number, Laps: Lap[]}) => ({
    full_name: normalizeDriverName(l.FullName),
    running_pos: l.RunningPos,
    nascar_driver_id: l.NASCARDriverID, 
    laps: l.Laps
  }))

  return parsedData;
}

function normalizeDriverName(name: string): string {
  return name
    .replace(/^\W+\s*/, "")        // leading junk (*, #, etc.)
    .replace(/\s*\([^)]*\)/g, "")  // remove (i), (R), etc.
    .replace(/\s*[#*]+\s*$/, "")       // remove trailing #
    .replace(/\s+/g, " ")          // normalize spaces
    .trim();
}

export interface Lap {
  LapNumber: number,
  LapTime: number,
  LapSpeed: number, 
  RunningPos: number
}