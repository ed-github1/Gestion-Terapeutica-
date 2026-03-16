import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'motion/react'
import { authService } from '@shared/services/authService'
import apiClient from '@shared/api/client'

const SESSION_TYPES = [
  { value: 'individual', label: 'Individual' },
  { value: 'couples', label: 'Pareja' },
  { value: 'family', label: 'Familia' },
  { value: 'group', label: 'Grupo' },
]

const REFERRAL_SOURCES = [
  { value: 'self', label: 'Propia iniciativa' },
  { value: 'gp', label: 'Médico de cabecera' },
  { value: 'insurance', label: 'Seguro médico' },
  { value: 'referral', label: 'Derivación profesional' },
  { value: 'social', label: 'Redes sociales' },
  { value: 'other', label: 'Otro' },
]

const PatientRegisterPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [patientInfo, setPatientInfo] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const token = searchParams.get('token')
  const inviteCode = searchParams.get('code')

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      dateOfBirth: '',
      sessionType: 'individual',
      presentingConcern: '',
      referralSource: 'self',
      emergencyContactName: '',
      emergencyContactPhone: '',
      address: '',
      acceptTerms: false,
      acceptPrivacy: false,
      acceptSensitiveData: false,
    }
  })

  const password = watch('password')

  useEffect(() => {
    // Verify invitation token/code and get patient info
    const verifyInvitation = async () => {
      if (!inviteCode && !token) {
        setError('Link de invitación inválido')
        setIsLoading(false)
        return
      }

      try {
        // Verify the invitation code or token
        const code = inviteCode || token
        const response = await apiClient.get(`/invitations/verify/${code}`)
        
        // Set patient info from invitation
        setPatientInfo({
          firstName: response.data.firstName || '',
          lastName: response.data.lastName || '',
          phone: response.data.phone || '',
          email: response.data.email || '',
          invitationId: response.data.id || response.data._id,
          professionalId: response.data.professionalId
        })
        setIsLoading(false)
      } catch (error) {
        console.error('Error verifying invitation:', error)
        setError('Link de invitación inválido o expirado')
        setIsLoading(false)
      }
    }

    verifyInvitation()
  }, [token, inviteCode])

  const onSubmit = async (data) => {
    try {
      setError(null)
      
      // Complete patient registration with all data
      const registrationData = {
        // Invitation info
        invitationId: patientInfo.invitationId,
        inviteCode: inviteCode || token,
        
        // Basic credentials
        email: data.email,
        password: data.password,
        
        // Personal information
        firstName: patientInfo.firstName,
        lastName: patientInfo.lastName,
        phone: data.phone || patientInfo.phone,
        dateOfBirth: data.dateOfBirth,
        address: data.address,
        
        // Clinical information
        sessionType: data.sessionType,
        presentingConcern: data.presentingConcern,
        referralSource: data.referralSource,
        
        // Emergency contact
        emergencyContact: {
          name: data.emergencyContactName,
          phone: data.emergencyContactPhone,
        }
      }

      await apiClient.post('/patients/complete-registration', registrationData)
      
      alert('✅ Registro completado exitosamente!\n\nYa puedes iniciar sesión con tu correo y contraseña.')
      navigate('/login')
    } catch (error) {
      console.error('Error completing registration:', error)
      setError(error.response?.data?.message || 'Error al completar el registro')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-cyan-50 to-sky-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando invitación...</p>
        </div>
      </div>
    )
  }

  if (error && !patientInfo) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-cyan-50 to-sky-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Link Inválido</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Ir al Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-cyan-50 to-sky-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-linear-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Completa tu Registro</h1>
          <p className="text-gray-600">
            Bienvenido/a {patientInfo?.firstName} {patientInfo?.lastName}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Completa tu información para acceder al portal de pacientes
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Tu profesional de salud te ha invitado</p>
              <p>Ingresa tu correo electrónico y crea una contraseña segura para acceder a tu expediente y gestionar tus citas.</p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Section 1: Credenciales */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide border-b pb-2">
              Credenciales de Acceso
            </h3>
            
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico *
              </label>
              <input
                id="email"
                type="email"
                {...register('email', { 
                  required: 'El correo electrónico es requerido',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Correo electrónico inválido'
                  }
                })}
                defaultValue={patientInfo?.email || ''}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 outline-none ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="tu@correo.com"
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña *
              </label>
              <input
                id="password"
                type="password"
                {...register('password', { 
                  required: 'La contraseña es requerida',
                  minLength: {
                    value: 8,
                    message: 'La contraseña debe tener al menos 8 caracteres'
                  },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message: 'Debe incluir mayúsculas, minúsculas y números'
                  }
                })}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 outline-none ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="••••••••"
                disabled={isSubmitting}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
              <p className="mt-2 text-xs text-gray-500">
                Mínimo 8 caracteres, con mayúsculas, minúsculas y números
              </p>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Contraseña *
              </label>
              <input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword', { 
                  required: 'Confirma tu contraseña',
                  validate: value => value === password || 'Las contraseñas no coinciden'
                })}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 outline-none ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="••••••••"
                disabled={isSubmitting}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          {/* Section 2: Información Personal */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide border-b pb-2">
              Información Personal
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono *
                </label>
                <input
                  id="phone"
                  type="tel"
                  {...register('phone', { 
                    required: 'El teléfono es requerido',
                  })}
                  defaultValue={patientInfo?.phone || ''}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 outline-none ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="+52 123 456 7890"
                  disabled={isSubmitting}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Nacimiento *
                </label>
                <input
                  id="dateOfBirth"
                  type="date"
                  {...register('dateOfBirth', { 
                    required: 'La fecha de nacimiento es requerida',
                  })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 outline-none ${
                    errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isSubmitting}
                />
                {errors.dateOfBirth && (
                  <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth.message}</p>
                )}
              </div>
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Dirección
              </label>
              <input
                id="address"
                type="text"
                {...register('address')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 outline-none"
                placeholder="Calle, número, colonia, ciudad"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Section 3: Información Clínica */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide border-b pb-2">
              Información Clínica
            </h3>

            {/* Session Type */}
            <div>
              <label htmlFor="sessionType" className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Sesión *
              </label>
              <select
                id="sessionType"
                {...register('sessionType', { required: 'Selecciona el tipo de sesión' })}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 outline-none ${
                  errors.sessionType ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              >
                {SESSION_TYPES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              {errors.sessionType && (
                <p className="mt-1 text-sm text-red-600">{errors.sessionType.message}</p>
              )}
            </div>

            {/* Presenting Concern */}
            <div>
              <label htmlFor="presentingConcern" className="block text-sm font-medium text-gray-700 mb-2">
                Motivo de Consulta
              </label>
              <textarea
                id="presentingConcern"
                {...register('presentingConcern')}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 outline-none resize-none"
                placeholder="Describe brevemente el motivo por el que buscas ayuda profesional"
                disabled={isSubmitting}
              />
            </div>

            {/* Referral Source */}
            <div>
              <label htmlFor="referralSource" className="block text-sm font-medium text-gray-700 mb-2">
                ¿Cómo nos conociste? *
              </label>
              <select
                id="referralSource"
                {...register('referralSource', { required: 'Selecciona una opción' })}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 outline-none ${
                  errors.referralSource ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              >
                {REFERRAL_SOURCES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              {errors.referralSource && (
                <p className="mt-1 text-sm text-red-600">{errors.referralSource.message}</p>
              )}
            </div>
          </div>

          {/* Section 4: Contacto de Emergencia */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide border-b pb-2">
              Contacto de Emergencia
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Emergency Contact Name */}
              <div>
                <label htmlFor="emergencyContactName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre
                </label>
                <input
                  id="emergencyContactName"
                  type="text"
                  {...register('emergencyContactName')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 outline-none"
                  placeholder="Nombre del contacto"
                  disabled={isSubmitting}
                />
              </div>

              {/* Emergency Contact Phone */}
              <div>
                <label htmlFor="emergencyContactPhone" className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  id="emergencyContactPhone"
                  type="tel"
                  {...register('emergencyContactPhone')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 outline-none"
                  placeholder="+52 123 456 7890"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          {/* Consent */}
          <div className="space-y-3 pt-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('acceptTerms', { required: 'Debes aceptar los términos y condiciones' })}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={isSubmitting}
              />
              <span className="text-xs text-gray-600 leading-relaxed">
                Acepto los{' '}
                <Link to="/terminos" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-medium">Términos y Condiciones</Link>{' '}y la{' '}
                <Link to="/privacidad" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-medium">Política de Privacidad</Link>.
              </span>
            </label>
            {errors.acceptTerms && (
              <p className="text-xs text-red-500 flex items-center gap-1 ml-7">{errors.acceptTerms.message}</p>
            )}

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('acceptPrivacy', { required: 'Debes aceptar la política de privacidad' })}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={isSubmitting}
              />
              <span className="text-xs text-gray-600 leading-relaxed">
                He leído y acepto el{' '}
                <Link to="/privacidad" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-medium">Aviso de Privacidad Integral</Link>{' '}y el tratamiento de mis datos personales.
              </span>
            </label>
            {errors.acceptPrivacy && (
              <p className="text-xs text-red-500 flex items-center gap-1 ml-7">{errors.acceptPrivacy.message}</p>
            )}

            {/* Sensitive data consent — Art. 9 LFPDPPP */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs text-amber-800 font-semibold mb-2">Consentimiento expreso — Datos de salud mental (Art. 9 LFPDPPP)</p>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('acceptSensitiveData', { required: 'Debes otorgar consentimiento expreso para el tratamiento de tus datos de salud' })}
                  className="mt-0.5 w-4 h-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                  disabled={isSubmitting}
                />
                <span className="text-xs text-amber-800 leading-relaxed">
                  Otorgo consentimiento <strong>expreso, específico e informado</strong> para el tratamiento
                  de mis datos personales sensibles de <strong>salud mental</strong> (diagnósticos, notas terapéuticas,
                  diario personal) por parte de TotalMente y mi terapeuta, conforme al{' '}
                  <Link to="/privacidad#datos-sensibles" target="_blank" rel="noopener noreferrer" className="underline font-medium">Aviso de Privacidad Integral</Link>.
                </span>
              </label>
              {errors.acceptSensitiveData && (
                <p className="text-xs text-red-500 flex items-center gap-1 ml-7 mt-1">{errors.acceptSensitiveData.message}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-linear-to-r from-blue-600 to-cyan-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Completando registro...
              </span>
            ) : (
              'Completar Registro'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600">
            ¿Ya tienes cuenta?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Inicia sesión aquí
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default PatientRegisterPage
