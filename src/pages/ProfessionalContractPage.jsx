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

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
            <div className="mb-8">
                <BrandLogo symbolOnly size="h-10 w-10" />
            </div>

            <div className="w-full max-w-xl bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100">
                    <h1 className="text-xl font-bold text-gray-900">Contrato de uso de la plataforma</h1>
                    <p className="text-sm text-gray-400 mt-1">Lee y firma para activar tu cuenta</p>
                </div>

                {/* Contract text */}
                <div className="px-8 py-6 space-y-5 max-h-80 overflow-y-auto border-b border-gray-100">
                    {CONTRACT_SECTIONS.map((s) => (
                        <div key={s.title}>
                            <p className="text-xs font-bold text-gray-700 mb-1">{s.title}</p>
                            <p className="text-xs text-gray-500 leading-relaxed">{s.body}</p>
                        </div>
                    ))}
                </div>

                {/* Signature */}
                <div className="px-8 py-6 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Tu firma</p>
                        <button
                            type="button"
                            onClick={handleClear}
                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-rose-500 transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Limpiar
                        </button>
                    </div>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                        <SignatureCanvas
                            ref={sigCanvasRef}
                            penColor="#1d4ed8"
                            canvasProps={{
                                width: 560,
                                height: 130,
                                style: { width: '100%', display: 'block' },
                                className: 'touch-none',
                            }}
                            onEnd={() => setCanvasEmpty(sigCanvasRef.current?.isEmpty() ?? true)}
                        />
                    </div>
                    <p className="mt-2 text-[10px] text-gray-400 text-center">
                        Dibuja tu firma con el ratón o el dedo
                    </p>
                </div>

                {/* Agreement checkbox + action */}
                <div className="px-8 py-6 space-y-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-600 leading-snug">
                            He leído y acepto los términos del contrato de uso de TotalMente Gestión Terapéutica
                        </span>
                    </label>

                    {error && (
                        <p className="text-xs text-red-500">{error}</p>
                    )}

                    <button
                        type="button"
                        onClick={handleSign}
                        disabled={!canSubmit}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0075C9] text-white text-[15px] font-semibold hover:bg-[#005faa] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {signing ? (
                            <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        ) : (
                            <FileCheck2 className="w-5 h-5" />
                        )}
                        {signing ? 'Registrando...' : 'Firmar y activar cuenta'}
                    </button>

                    {(!agreed || canvasEmpty) && (
                        <p className="text-[11px] text-gray-400 text-center">
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
    )
}

export default ProfessionalContractPage
