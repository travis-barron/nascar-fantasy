'use client'

import { JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { finalizeRace } from '@/app/actions/finalizeRace'


export default function ResultsEntry({
    race,
    drivers,
    existingResults,
}: any) {
    const supabase = createSupabaseBrowserClient()

    const initial = drivers.map((driver: any) => {
        const result = existingResults.find(
            (r: any) => r.driver_id === driver.id
        )

        return {
            driver_id: driver.id,
            name: `${driver.first_name} ${driver.last_name}`,
            finish_position: result?.finish_position || '',
            stage_1_points: result?.stage_1_points || 0,
            stage_2_points: result?.stage_2_points || 0,
            race_points: result?.race_points || 0,
        }
    })

    const [results, setResults] = useState(initial)

    const updateField = (
        driverId: string,
        field: string,
        value: string
    ) => {
        setResults((prev: { driver_id: string }[]) =>
            prev.map((r: { driver_id: string }) =>
                r.driver_id === driverId
                    ? { ...r, [field]: Number(value) }
                    : r
            )
        )
    }

    const saveResults = async () => {
        // Filter only drivers with a finish position entered
        const validResults = results.filter(
            (r: { finish_position: string | null; race_points: null }) =>
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
            .eq('race_id', race.id)

        const inserts = validResults.map((r: { driver_id: any; finish_position: any; stage_1_points: any; stage_2_points: any; race_points: any }) => ({
            race_id: race.id,
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
                Enter Results — {race.name}
            </h1>

            <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {results.map((r: { driver_id: string; name: string; finish_position: number | undefined; stage_1_points: number | undefined; stage_2_points: number | undefined; race_points: number | undefined }) => (
                    <div
                        key={r.driver_id}
                        className="grid grid-cols-5 gap-2 border p-2 bg-white"
                    >
                        <div>{r.name}</div>

                        <input
                            type="number"
                            placeholder="Finish"
                            value={r.finish_position}
                            onChange={(e) =>
                                updateField(
                                    r.driver_id,
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
                                    r.driver_id,
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
                                    r.driver_id,
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
                                    r.driver_id,
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
                disabled={race.is_finalized}
                onClick={async () => {
                    const result = await finalizeRace(race.id)
                    if (result?.error) {
                        alert(result.error)
                    } else {
                        alert('Race finalized and standings updated.')
                    }
                }}
                className={`px-4 py-2 rounded ${race.is_finalized
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-green-600 text-white'
                    }`}
            >
                {race.is_finalized ? 'Race Finalized' : 'Finalize Race'}
            </button>
        </div>
    )
}
