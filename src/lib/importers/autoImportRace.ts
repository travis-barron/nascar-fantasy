import { pool } from "@/lib/db";
import { fetchRaceResults } from "@/lib/nascar/fetchRaceResults";

export async function autoImportRace(raceId: string) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // ---------------------------
    // 1. Get race from DB
    // ---------------------------
    const raceRes = await client.query(
      `SELECT * FROM races WHERE id = $1`,
      [raceId]
    );

    if (!raceRes.rows.length) {
      throw new Error("Race not found");
    }

    const race = raceRes.rows[0];

    if (!race.nascar_race_id) {
      throw new Error("Missing nascar_race_id");
    }

    const year = new Date(race.race_date).getFullYear();

    // ---------------------------
    // 2. Fetch NASCAR results
    // ---------------------------
    const data = await fetchRaceResults(year, race.nascar_race_id);

    const results = data?.results || data;

    if (!results || results.length === 0) {
      throw new Error("No results returned from NASCAR");
    }

    // ---------------------------
    // 3. Clear existing results
    // ---------------------------
    await client.query(
      `DELETE FROM race_results WHERE race_id = $1`,
      [race.id]
    );

    // ---------------------------
    // 4. Process each driver
    // ---------------------------
    for (const r of results) {
      const first = r.first_name?.trim();
      const last = r.last_name?.trim();

      if (!first || !last) continue;

      // Find or create driver
      let driverRes = await client.query(
        `SELECT id FROM drivers WHERE first_name=$1 AND last_name=$2`,
        [first, last]
      );

      let driverId;

      if (driverRes.rows.length) {
        driverId = driverRes.rows[0].id;
      } else {
        const insert = await client.query(
          `INSERT INTO drivers (first_name, last_name, car_number)
           VALUES ($1,$2,$3)
           RETURNING id`,
          [first, last, r.car_number || "0"]
        );

        driverId = insert.rows[0].id;
      }

      // Insert result
      await client.query(
        `INSERT INTO race_results (
          race_id,
          driver_id,
          finish_position,
          stage_1_points,
          stage_2_points,
          race_points,
          laps_led
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          race.id,
          driverId,
          Number(r.finishing_position),
          Number(r.stage_1_points || 0),
          Number(r.stage_2_points || 0),
          calculateRacePoints(Number(r.finishing_position)),
          Number(r.laps_led || 0),
        ]
      );
    }

    await client.query("COMMIT");

    return { success: true };
  } catch (err: any) {
    await client.query("ROLLBACK");
    return { success: false, error: err.message };
  } finally {
    client.release();
  }
}

function calculateRacePoints(position: number) {
  const table = [
    40, 35, 34, 33, 32, 31, 30, 29, 28, 27,
    26, 25, 24, 23, 22, 21, 20, 19, 18, 17
  ];

  return table[position - 1] ?? Math.max(1, 40 - position);
}