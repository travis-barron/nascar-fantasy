'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
    proposeTradeAction,
    respondToTradeAction,
} from '@/app/(protected)/trades/actions'

type DriverRow = {
    team_id: string
    driver_id: string
    drivers: {
        first_name: string
        last_name: string
    }
}

type Props = {
    team: { id: string; name: string }
    trades: any[]
    otherTeams: { id: string; name: string }[]
    roster: DriverRow[]
    allTeamDrivers: DriverRow[]
    driverTotals: Record<
        string,
        { total: number; lastRace: number; races: number }
    >
}

export default function TradeClient({
    team,
    trades,
    otherTeams,
    roster,
    allTeamDrivers,
    driverTotals
}: Props) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
    const [offerDriver, setOfferDriver] = useState<string | null>(null)
    const [requestDriver, setRequestDriver] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    // ============================
    // Filter selected team roster
    // ============================

    const selectedTeamRoster = useMemo(() => {
        if (!selectedTeam) return []
        return allTeamDrivers.filter(
            (d) => d.team_id === selectedTeam
        )
    }, [selectedTeam, allTeamDrivers])

    // ============================
    // Propose Trade
    // ============================

    const handlePropose = () => {
        if (!selectedTeam || !offerDriver || !requestDriver) {
            setError('Select team and both drivers.')
            return
        }

        setError(null)

        startTransition(async () => {
            try {
                await proposeTradeAction(
                    selectedTeam,
                    offerDriver,
                    requestDriver
                )

                setSelectedTeam(null)
                setOfferDriver(null)
                setRequestDriver(null)

                router.refresh()
            } catch (err: any) {
                setError(err.message || 'Trade failed.')
            }
        })
    }

    // ============================
    // Respond to Trade
    // ============================

    const handleRespond = (tradeId: string, accept: boolean) => {
        startTransition(async () => {
            try {
                await respondToTradeAction(tradeId, accept)
                router.refresh()
            } catch (err: any) {
                setError(err.message || 'Error processing trade.')
            }
        })
    }

    const getDriverStats = (id: string | null) => {
        if (!id) return null
        return driverTotals[id] ?? {
            total: 0,
            lastRace: 0,
            races: 0,
        }
    }

    return (
        <div className="space-y-12">

            {/* ============================
           PROPOSE TRADE
      ============================ */}

            <section>
                <h2 className="text-2xl font-bold mb-6">
                    Propose Trade
                </h2>

                <div className="grid md:grid-cols-2 gap-6">

                    {/* YOUR SIDE */}
                    <div className="border rounded p-4">
                        <h3 className="font-semibold mb-3">
                            You Give
                        </h3>

                        <select
                            value={offerDriver ?? ''}
                            onChange={(e) =>
                                setOfferDriver(e.target.value)
                            }
                            className="w-full border rounded p-2"
                        >
                            <option value="">Select Your Driver</option>
                            {roster.map((r) => (
                                <option
                                    key={r.driver_id}
                                    value={r.driver_id}
                                >
                                    {r.drivers.first_name}{' '}
                                    {r.drivers.last_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* THEIR SIDE */}
                    <div className="border rounded p-4">
                        <h3 className="font-semibold mb-3">
                            You Receive
                        </h3>

                        <select
                            value={selectedTeam ?? ''}
                            onChange={(e) => {
                                setSelectedTeam(e.target.value)
                                setRequestDriver(null)
                            }}
                            className="w-full border rounded p-2 mb-3"
                        >
                            <option value="">Select Team</option>
                            {otherTeams.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>

                        {selectedTeam && (
                            <select
                                value={requestDriver ?? ''}
                                onChange={(e) =>
                                    setRequestDriver(e.target.value)
                                }
                                className="w-full border rounded p-2"
                            >
                                <option value="">
                                    Select Their Driver
                                </option>
                                {selectedTeamRoster.map((r) => (
                                    <option
                                        key={r.driver_id}
                                        value={r.driver_id}
                                    >
                                        {r.drivers.first_name}{' '}
                                        {r.drivers.last_name}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                {offerDriver && requestDriver && (
                    <div className="mt-8 border rounded p-6 bg-gray-50">
                        <h3 className="text-lg font-semibold mb-4">
                            Trade Preview
                        </h3>

                        <div className="grid md:grid-cols-2 gap-8">

                            {/* You Give */}
                            <div>
                                <div className="font-semibold mb-2">
                                    You Give
                                </div>
                                {(() => {
                                    const stats = getDriverStats(offerDriver)
                                    return (
                                        <div className="space-y-1">
                                            <div>Season Points: {stats?.total}</div>
                                            <div>Last Race Points: {stats?.lastRace}</div>
                                            <div>
                                                Avg Points per Race:{' '}
                                                {stats?.races
                                                    ? (stats.total / stats.races).toFixed(1)
                                                    : 0}
                                            </div>
                                        </div>
                                    )
                                })()}
                            </div>

                            {/* You Receive */}
                            <div>
                                <div className="font-semibold mb-2">
                                    You Receive
                                </div>
                                {(() => {
                                    const stats = getDriverStats(requestDriver)
                                    return (
                                        <div className="space-y-1">
                                            <div>Season Points: {stats?.total}</div>
                                            <div>Last Race Points: {stats?.lastRace}</div>
                                            <div>
                                                Avg Points per Race:{' '}
                                                {stats?.races
                                                    ? (stats.total / stats.races).toFixed(1)
                                                    : 0}
                                            </div>
                                        </div>
                                    )
                                })()}
                            </div>
                        </div>
                    </div>
                )}

                <button
                    onClick={handlePropose}
                    disabled={isPending}
                    className="mt-6 bg-blue-600 text-white px-5 py-2 rounded"
                >
                    {isPending ? 'Sending...' : 'Send Trade'}
                </button>

                {error && (
                    <div className="text-red-600 mt-3 text-sm">
                        {error}
                    </div>
                )}
            </section>

            {/* ============================
           PENDING TRADES
      ============================ */}

            <section>
                <h2 className="text-2xl font-bold mb-6">
                    Pending Trades
                </h2>

                {trades.length === 0 && (
                    <div className="text-gray-500">
                        No pending trades.
                    </div>
                )}

                {trades.map((trade) => (
                    <div
                        key={trade.id}
                        className="border rounded p-4 mb-4"
                    >
                        <div className="text-sm text-gray-500 mb-2">
                            Trade ID: {trade.id}
                        </div>

                        <div>
                            Offering: {trade.proposing_driver_id}
                        </div>
                        <div>
                            Requesting: {trade.receiving_driver_id}
                        </div>

                        {trade.receiving_team_id === team.id && (
                            <div className="mt-4 space-x-2">
                                <button
                                    onClick={() =>
                                        handleRespond(trade.id, true)
                                    }
                                    className="bg-green-600 text-white px-3 py-1 rounded"
                                >
                                    Accept
                                </button>

                                <button
                                    onClick={() =>
                                        handleRespond(trade.id, false)
                                    }
                                    className="bg-red-600 text-white px-3 py-1 rounded"
                                >
                                    Reject
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </section>
        </div>
    )
}