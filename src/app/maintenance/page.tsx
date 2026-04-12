'use client'

import Image from 'next/image'

export default function MaintenancePage()
{

    return (
        <>
            <div className="flex flex-col min-h-screen items-center justify-center">
                <div className="space-y-4 px-4">
                    <Image src="/logo.png"
                        alt="logo"
                        width={430}
                        height={131}
                    /> 
                </div>
                <h1>This site is currently under maintenance. Please revisit soon.</h1>
            </div>
        </>
    )
}