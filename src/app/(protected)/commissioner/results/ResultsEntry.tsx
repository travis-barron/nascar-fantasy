'use client'

import { useState, useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { finalizeRace } from '@/app/actions/finalizeRace'
import { fetchRaceResults, Lap } from '@/lib/nascar/fetchRaceResults'

type NascarResult = {
    nascar_driver_id: number
    finishing_position: number
    running_pos?: number
    stage_1_points?: number
    stage_2_points?: number
    laps: Lap[]
}

type Result = {
    driver_id: string
    nascar_driver_id: number
    name: string
    finish_position: number | ''
    stage_1_points: number
    stage_2_points: number
    race_points: number
}

export default function ResultsEntry({
    races,
    drivers, 
    race_stages
}: any) {
    const supabase = createSupabaseBrowserClient()

    const [selectedRace, setSelectedRace] = useState(races[0] || null)
    const [results, setResults] = useState<Result[]>([])

    useEffect(() => {
        if (!selectedRace) return

        const fetchResults = async () => {
            const { data } = await supabase
                .from('race_results')
                .select('*')
                .eq('race_id', selectedRace.id)

            const mapped = drivers.map((driver: any) => {
                const result = data?.find(
                    (r: any) => r.driver_id === driver.id
                )

                return {
                    driver_id: driver.id,
                    nascar_driver_id: driver.nascar_driver_id,
                    name: `${driver.first_name} ${driver.last_name}`,
                    finish_position: result?.finish_position || '',
                    stage_1_points: result?.stage_1_points || 0,
                    stage_2_points: result?.stage_2_points || 0,
                    race_points: result?.race_points || 0,
                }
            })

            setResults(mapped)
        }

        fetchResults()
    }, [selectedRace])

    const updateField = (
        nascar_driver_id: string,
        field: keyof Result,
        value: string
    ) => {
        setResults((prev) =>
            prev.map((r) =>
                r.nascar_driver_id.toString() === nascar_driver_id
                    ? { ...r, [field]: Number(value) }
                    : r
            )
        )
    }

    const handleNascarImport = async () => {
        try {
            const raceId = selectedRace.nascar_race_id
            const year = 2026

            const data = await fetchRaceResults(year, raceId)

            //console.log(data);

            // 🔥 Build a lookup map from NASCAR data
            const lookup = new Map<string, NascarResult>(
                data.map((d: any) => [
                    d.nascar_driver_id.toString(),
                    d
                ])
            )

            console.log(lookup);

            // 🔥 Build full updated results in ONE pass
            const updatedResults = results.map((r: any) => {
                const match = lookup.get(r.nascar_driver_id?.toString())

                if (!match) return r

                const stage_1_lap = (match.laps[race_stages[0].ending_lap])
                let stage1Points = 0
                if (stage_1_lap) {
                    stage1Points = calculateStagePoints(stage_1_lap.RunningPos)
                }

                const stage_2_lap = (match.laps[race_stages[1].ending_lap])
                let stage2Points = 0
                if (stage_2_lap) {
                    stage2Points = calculateStagePoints(stage_2_lap.RunningPos)
                }

                return {
                    ...r,
                    finish_position: Number(match.running_pos),
                    race_points: calculateRacePoints(Number(match.running_pos)),
                    stage_1_points: stage1Points,
                    stage_2_points: stage2Points
                }
            })

            // ✅ ONE state update
            setResults(updatedResults)

            alert("Imported from NASCAR successfully")

        } catch (err) {
            console.error(err)
            alert("Failed to import NASCAR results")
        }
    }

    const calculateRacePoints = (position: number) => {
        const table = [
            55, 35, 34, 33, 32, 31, 30, 29, 28, 27,
            26, 25, 24, 23, 22, 21, 20, 19, 18, 17
        ]

        return table[position - 1] ?? Math.max(1, 40 - position)
    }

    const calculateStagePoints = (position: number) => {
        const table = [
            10, 9, 8, 7, 6, 5, 4, 3, 2, 1
        ]

        if (position < 11)
        {
            return table[position - 1]
        } else {
            return 0
        }
    }

    const getStageFinish = (lapdata: Lap[], lapnumber: number) => {
        return lapdata[lapnumber].RunningPos;
    }

    const saveResults = async () => {
        // Filter only drivers with a finish position entered
        const validResults = results.filter(
            (r: { finish_position: number | ''; race_points: number }) =>
                r.finish_position !== '' &&
                r.finish_position !== null &&
                r.race_points !== null
        )

        if (validResults.length === 0) {
            alert('No valid results entered.')
            return
        }

        await supabase
            .from('race_results')
            .delete()
            .eq('race_id', selectedRace.id)

        const inserts = validResults.map((r: { driver_id: any; finish_position: any; stage_1_points: any; stage_2_points: any; race_points: any }) => ({
            race_id: selectedRace.id,
            driver_id: r.driver_id,
            finish_position: r.finish_position,
            stage_1_points: r.stage_1_points,
            stage_2_points: r.stage_2_points,
            race_points: r.race_points,
        }))

        const { error } = await supabase
            .from('race_results')
            .insert(inserts)

        if (error) {
            console.error(error)
            alert('Error saving results.')
        } else {
            alert('Results saved.')
        }
    }


    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">
                Enter Results — {selectedRace.name}
            </h1>
            <div className="space-x-6">
            <select
                value={selectedRace?.id}
                onChange={(e) => {
                    const race = races.find((r: any) => r.id === e.target.value)
                    setSelectedRace(race)
                }}
                className="border p-2"
            >
                {races.map((r: any) => (
                    <option key={r.id} value={r.id}>
                        {r.name}
                    </option>
                ))}
            </select>
            </div>

            <button
                onClick={handleNascarImport}
                className="bg-blue-600 text-white px-4 py-2 rounded"
            >
                Import from NASCAR
            </button>

            <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {results.map((r: Result) => (
                    <div
                        key={r.nascar_driver_id}
                        className="grid grid-cols-5 gap-2 border p-2 bg-white"
                    >
                        <div>{r.name}</div>

                        <input
                            id={r.nascar_driver_id + "finish_field"}
                            type="string"
                            placeholder="Finish"
                            value={r.finish_position}
                            onChange={(e) =>
                                updateField(
                                    r.nascar_driver_id.toString(),
                                    'finish_position',
                                    e.target.value
                                )
                            }
                            className="border p-1"
                        />

                        <input
                            type="number"
                            placeholder="Stage 1"
                            value={r.stage_1_points}
                            onChange={(e) =>
                                updateField(
                                    r.nascar_driver_id.toString(),
                                    'stage_1_points',
                                    e.target.value
                                )
                            }
                            className="border p-1"
                        />

                        <input
                            type="number"
                            placeholder="Stage 2"
                            value={r.stage_2_points}
                            onChange={(e) =>
                                updateField(
                                    r.nascar_driver_id.toString(),
                                    'stage_2_points',
                                    e.target.value
                                )
                            }
                            className="border p-1"
                        />

                        <input
                            type="number"
                            placeholder="Race Points"
                            value={r.race_points}
                            onChange={(e) =>
                                updateField(
                                    r.nascar_driver_id.toString(),
                                    'race_points',
                                    e.target.value
                                )
                            }
                            className="border p-1"
                        />
                    </div>
                ))}
            </div>

            <button
                onClick={saveResults}
                className="bg-black text-white px-4 py-2 rounded"
            >
                Save Results
            </button>
            <button
                disabled={selectedRace.is_finalized}
                onClick={async () => {
                    const result = await finalizeRace(selectedRace.id)
                    if (result?.error) {
                        alert(result.error)
                    } else {
                        alert('Race finalized and standings updated.')
                    }
                }}
                className={`px-4 py-2 rounded ${selectedRace.is_finalized
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-green-600 text-white'
                    }`}
            >
                {selectedRace.is_finalized ? 'Race Finalized' : 'Finalize Race'}
            </button>
        </div>
    )
}
