'use client'

import { useState } from 'react'
import DriverHistoryModal from './DriverHistoryModal'

type Driver = {
    id: string
    first_name: string
    last_name: string
    team_name: string
    car_number: string
    is_active: boolean
}

type Props = {
    drivers: Driver[]
}

export default function TeamDetailClient({ drivers }: Props) {
    const [selectedDriver, setSelectedDriver] = useState<string | null>(null)
    const [selectedDriverName, setSelectedDriverName] = useState<string | null>(null)

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {drivers.map((driver) => (
                    <div
                        key={driver.id}
                        className={`p-4 rounded-xl shadow border transition ${driver.is_active ? 'bg-green-100' : 'bg-white'}`}
                    >
                        <p className="font-semibold">
                            <button
                                key={driver.id}
                                onClick={() => { setSelectedDriver(driver.id); setSelectedDriverName(driver.first_name + ' ' + driver.last_name)}}
                                className="text-blue-600 hover:underline"
                            >
                                {driver.first_name} {driver.last_name}
                            </button>
                        </p>
                        <p className="text-sm text-gray-500">
                            #{driver.car_number} •{' '}
                            {driver.team_name}
                        </p>
                    </div>
                ))}
            </div>
            {selectedDriver && (
                <DriverHistoryModal
                    driverId={selectedDriver}
                    seasonId={'9dbd3292-01a9-4aa2-8027-bb6e0a38679d'}
                    driverName={selectedDriverName}
                    open={!!selectedDriver}
                    onClose={() => setSelectedDriver(null)}
                />
            )}
        </>
    )
}
