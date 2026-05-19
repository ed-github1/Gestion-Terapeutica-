import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { BrandLogo } from '@shared/ui'
import { ROUTES } from '@shared/constants/routes'
import { useAuth } from '@features/auth'

const COUNTDOWN = 5

const KycCompletePage = () => {
    const navigate = useNavigate()
    const { refreshUser } = useAuth()
    const [seconds, setSeconds] = useState(COUNTDOWN)

    useEffect(() => {
        refreshUser()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (seconds <= 0) {
            navigate(ROUTES.PROFESSIONAL_DASHBOARD, { replace: true })
            return
        }
        const timer = setTimeout(() => setSeconds(s => s - 1), 1000)
        return () => clearTimeout(timer)
    }, [seconds, navigate])

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
            <div className="mb-8">
                <BrandLogo symbolOnly size="h-10 w-10" />
            </div>

            <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
                <div className="flex justify-center mb-5">
                    <Clock className="w-16 h-16 text-amber-400" strokeWidth={1.5} />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-3">Verificación enviada</h1>
                <p className="text-gray-500 text-[15px] leading-relaxed">
                    Revisaremos tus documentos y te notificaremos cuando tu cuenta esté activa.
                </p>
                <p className="mt-4 text-sm text-gray-400">
                    Redirigiendo al panel en {seconds}s…
                </p>

                <button
                    onClick={() => navigate(ROUTES.PROFESSIONAL_DASHBOARD, { replace: true })}
                    className="mt-6 w-full bg-[#0075C9] text-white py-3 rounded-xl text-[15px] font-semibold hover:bg-[#005faa] transition-colors"
                >
                    Volver al panel
                </button>
            </div>
        </div>
    )
}

export default KycCompletePage
