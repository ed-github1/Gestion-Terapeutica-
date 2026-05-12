import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { BrandLogo } from '@shared/ui'
import { ROUTES } from '@shared/constants/routes'

const REDIRECT_SECONDS = 5

const KycCompletePage = () => {
    const [params] = useSearchParams()
    const navigate = useNavigate()
    const status = params.get('status')
    const isApproved = status === 'Approved'
    const isDeclined = status === 'Declined'

    const [seconds, setSeconds] = useState(REDIRECT_SECONDS)

    useEffect(() => {
        const interval = setInterval(() => {
            setSeconds(s => {
                if (s <= 1) {
                    clearInterval(interval)
                    navigate(ROUTES.PROFESSIONAL_DASHBOARD, { replace: true })
                    return 0
                }
                return s - 1
            })
        }, 1000)
        return () => clearInterval(interval)
    }, [navigate])

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
            <div className="mb-8">
                <BrandLogo symbolOnly size="h-10 w-10" />
            </div>

            <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
                {isApproved && (
                    <>
                        <div className="flex justify-center mb-5">
                            <CheckCircle className="w-16 h-16 text-emerald-500" strokeWidth={1.5} />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Identidad verificada</h1>
                        <p className="text-gray-500 text-[15px] leading-relaxed">
                            Tu verificación fue aprobada. Ya puedes acceder a todas las funciones de tu cuenta.
                        </p>
                    </>
                )}

                {isDeclined && (
                    <>
                        <div className="flex justify-center mb-5">
                            <XCircle className="w-16 h-16 text-rose-500" strokeWidth={1.5} />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Verificación rechazada</h1>
                        <p className="text-gray-500 text-[15px] leading-relaxed">
                            No pudimos verificar tu identidad. Podrás intentarlo nuevamente desde tu panel.
                        </p>
                    </>
                )}

                {!isApproved && !isDeclined && (
                    <>
                        <div className="flex justify-center mb-5">
                            <Clock className="w-16 h-16 text-amber-400" strokeWidth={1.5} />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Verificación enviada</h1>
                        <p className="text-gray-500 text-[15px] leading-relaxed">
                            Recibimos tu solicitud. Te notificaremos por correo cuando tu identidad sea aprobada.
                        </p>
                    </>
                )}

                {/* Countdown */}
                <p className="mt-6 text-sm text-gray-400">
                    Redirigiendo al panel en <span className="font-semibold text-gray-600">{seconds}s</span>…
                </p>

                <button
                    onClick={() => navigate(ROUTES.PROFESSIONAL_DASHBOARD, { replace: true })}
                    className="mt-4 w-full bg-[#0075C9] text-white py-3 rounded-xl text-[15px] font-semibold hover:bg-[#005faa] transition-colors"
                >
                    Ir al panel ahora
                </button>
            </div>
        </div>
    )
}

export default KycCompletePage
