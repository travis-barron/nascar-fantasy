'use client'

import { useState } from 'react'

type Props = {
    teamId: string
    initialName: string
}

export default function EditableTeamName({
    teamId,
    initialName,
}: Props) {
    const [isEditing, setIsEditing] = useState(false)
    const [name, setName] = useState(initialName)
    const [loading, setLoading] = useState(false)
    const [showToast, setShowToast] = useState(false)


    const save = async () => {
        if (!name.trim()) return

        setLoading(true)

        const res = await fetch('/api/update-team-name', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                teamId,
                name: name.trim(),
            }),
        })

        if (res.ok) {
            setIsEditing(false)
            setShowToast(true)

            setTimeout(() => {
                setShowToast(false)
            }, 2500)
        }

        setLoading(false)
    }

    if (isEditing) {
        return (
            <div className="flex items-center gap-2">
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="border px-2 py-1 rounded"
                    maxLength={40}
                />
                <button
                    onClick={save}
                    disabled={loading}
                    className="px-3 py-1 bg-blue-600 text-white rounded"
                >
                    Save
                </button>
                <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1 border rounded"
                >
                    Cancel
                </button>
            </div>
        )
    }

    return (
        <div>
            <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{name}</h1>
                <button
                    onClick={() => setIsEditing(true)}
                    className="text-gray-500 hover:text-black"
                >
                    ✏️
                </button>
            </div>

            {showToast && (
                <div className="fixed bottom-6 right-6 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg transition-opacity duration-300">
                    Team name updated
                </div>
            )}
        </div>
  )
}
