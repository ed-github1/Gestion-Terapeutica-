import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import SignatureCanvas from 'react-signature-canvas'
import { Trash2, FileCheck2 } from 'lucide-react'
import { BrandLogo } from '@shared/ui'
import { ROUTES } from '@shared/constants/routes'
import { professionalsService } from '@shared/services/professionalsService'
import { useAuth } from '@features/auth'

const CONTRACT_SECTIONS = [
    {
        title: '1. Uso de la plataforma',
        body: 'TotalMente Gestión Terapéutica es una plataforma digital para profesionales de salud mental habilitados. Al aceptar este contrato, confirmas que cuentas con cédula profesional vigente y que ejercerás tu práctica cumpliendo con la normativa sanitaria aplicable en tu país.',
    },
    {
        title: '2. Responsabilidad clínica',
        body: 'Eres el único responsable del diagnóstico, tratamiento y seguimiento de tus pacientes. TotalMente proporciona herramientas de gestión; en ningún caso sustituye el juicio clínico profesional ni asume responsabilidad por las decisiones terapéuticas que tomes.',
    },
    {
        title: '3. Protección de datos',
        body: 'Te comprometes a manejar la información de tus pacientes con estricta confidencialidad, de acuerdo con la Ley General de Salud y la normativa vigente en materia de protección de datos personales. TotalMente implementa medidas de seguridad técnicas y organizativas para salvaguardar dicha información.',
    },
    {
        title: '4. Condiciones del servicio',
        body: 'El acceso a la plataforma está condicionado al cumplimiento de estos términos y al pago de la suscripción correspondiente según el plan elegido. TotalMente se reserva el derecho de suspender el acceso ante el incumplimiento de cualquiera de estas condiciones.',
    },
]

const ProfessionalContractPage = () => {
    const navigate = useNavigate()
    const { refreshUser } = useAuth()
    const sigCanvasRef = useRef(null)

    const [agreed, setAgreed] = useState(false)
    const [canvasEmpty, setCanvasEmpty] = useState(true)
    const [signing, setSigning] = useState(false)
    const [error, setError] = useState(null)

    const canSubmit = agreed && !canvasEmpty && !signing

    const handleClear = () => {
        sigCanvasRef.current?.clear()
        setCanvasEmpty(true)
    }

    const handleSign = async () => {
        if (!canSubmit) return
        setSigning(true)
        setError(null)
        try {
            const canvas = sigCanvasRef.current?.getCanvas()
            if (!canvas) {
                throw new Error('Firma no disponible')
            }

            const signatureDataUrl = canvas.toDataURL('image/png')
            await professionalsService.signContract(signatureDataUrl)
            await refreshUser()
            navigate(ROUTES.PROFESSIONAL_DASHBOARD, { replace: true })
        } catch (err) {
            console.error('[signContract]', err)
            setError('No se pudo registrar la firma. Intenta de nuevo.')
            setSigning(false)
        }
    }

    const { user } = useAuth()
    const fullName = user ? `${user.nombre || ''} ${user.apellido || ''}`.trim() : ''

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-8">
            <div className="w-full max-w-2xl">
                {/* Logo and Title */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <BrandLogo symbolOnly size="h-8 w-8" />
                        <h1 className="text-lg font-bold text-gray-900">TotalMente</h1>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {/* Contract Header */}
                    <div className="px-8 py-8 border-b border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                            CONTRATO DE USO — PROFESIONAL DE SALUD
                        </h2>
                        <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                            <div>
                                <p className="text-xs text-gray-500 font-semibold uppercase">Versión</p>
                                <p>v 1.0</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-semibold uppercase">Firmado el</p>
                                <p>{new Date().toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' })}</p>
                            </div>
                            {fullName && (
                                <div>
                                    <p className="text-xs text-gray-500 font-semibold uppercase">Profesional</p>
                                    <p>{fullName}</p>
                                </div>
                            )}
                        </div>
                    </div>

                {/* Contract text */}
                <div className="px-8 py-8 space-y-6 max-h-96 overflow-y-auto border-b border-gray-200">
                    {CONTRACT_SECTIONS.map((s) => (
                        <div key={s.title}>
                            <p className="text-sm font-semibold text-gray-900 mb-2">{s.title}</p>
                            <p className="text-sm text-gray-700 leading-relaxed">{s.body}</p>
                        </div>
                    ))}
                </div>

                {/* Signature */}
                <div className="px-8 py-8 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-semibold text-gray-900 uppercase">Firma</p>
                        <button
                            type="button"
                            onClick={handleClear}
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-rose-500 transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Limpiar
                        </button>
                    </div>
                    <div className="border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                        <SignatureCanvas
                            ref={sigCanvasRef}
                            penColor="#000000"
                            canvasProps={{
                                width: 640,
                                height: 120,
                                style: { width: '100%', display: 'block' },
                                className: 'touch-none',
                            }}
                            onEnd={() => setCanvasEmpty(sigCanvasRef.current?.isEmpty() ?? true)}
                        />
                    </div>
                    <p className="mt-2 text-xs text-gray-500 text-center">
                        Dibuja tu firma con el ratón o el dedo
                    </p>
                    {fullName && (
                        <p className="mt-4 text-sm font-semibold text-gray-900">{fullName}</p>
                    )}
                </div>

                {/* Agreement checkbox + action */}
                <div className="px-8 py-8 space-y-5">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 leading-relaxed">
                            He leído y acepto los términos del contrato de uso de TotalMente Gestión Terapéutica
                        </span>
                    </label>

                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
                    )}

                    <button
                        type="button"
                        onClick={handleSign}
                        disabled={!canSubmit}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-[#0075C9] text-white text-base font-semibold hover:bg-[#005faa] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {signing ? (
                            <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        ) : (
                            <FileCheck2 className="w-5 h-5" />
                        )}
                        {signing ? 'Registrando...' : 'Firmar y activar cuenta'}
                    </button>

                    {(!agreed || canvasEmpty) && (
                        <p className="text-xs text-gray-500 text-center">
                            {!agreed && canvasEmpty
                                ? 'Acepta los términos y dibuja tu firma para continuar'
                                : !agreed
                                ? 'Acepta los términos para continuar'
                                : 'Dibuja tu firma para continuar'}
                        </p>
                    )}
                </div>
                </div>
            </div>
        </div>
    )
}

export default ProfessionalContractPage
