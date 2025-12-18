import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'motion/react'
import { useAuth } from './AuthContext'
import { authAPI } from '../../services/auth'
import { smsAuth } from '../../services/api'
import { showToast } from '../../components'

const RegisterPage = () => {
    const [apiError, setApiError] = useState('')
    const [step, setStep] = useState(1) // 1: form, 2: phone verification
    const [otpSent, setOtpSent] = useState(false)
    const [phoneNumber, setPhoneNumber] = useState('')
    const [otp, setOtp] = useState('')
    const [verifying, setVerifying] = useState(false)
    const [tempFormData, setTempFormData] = useState(null)

    const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            confirmPassword: '',
            role: 'health_professional',
            terms: false,
        }
    })

    const { login } = useAuth()
    const navigate = useNavigate()

    const password = watch('password')

    const onSubmit = async (data) => {
        setApiError('')
        
        console.log('📝 Form submitted:', { ...data, password: '***', confirmPassword: '***' })
        
        setTempFormData(data)
        setStep(2) // Move to phone verification
        showToast('✅ Datos guardados. Ahora verifica tu teléfono', 'success')
    }

    const sendOTP = async () => {
        if (!phoneNumber || phoneNumber.length < 10) {
            showToast('Ingresa un número de teléfono válido', 'warning')
            return
        }

        console.log('📱 Attempting to send OTP to:', phoneNumber)
        setVerifying(true)
        try {
            const result = await smsAuth.sendOTP(phoneNumber)
            console.log('✅ OTP send result:', result)
            setOtpSent(true)
            showToast('✅ Código enviado a tu teléfono', 'success')
        } catch (error) {
            console.error('❌ Error sending OTP:', error)
            showToast(error.message || 'Error al enviar código', 'error')
        } finally {
            setVerifying(false)
        }
    }

    const verifyOTPAndRegister = async () => {
        if (!otp || otp.length < 4) {
            showToast('Ingresa el código de verificación', 'warning')
            return
        }

        setVerifying(true)
        try {
            // Verify OTP
            await smsAuth.verifyOTP(phoneNumber, otp)
            showToast('✅ Teléfono verificado', 'success')

            // Register user
            console.log('Registering user:', { firstName: tempFormData.firstName, lastName: tempFormData.lastName, email: tempFormData.email, role: tempFormData.role })
            const response = await authAPI.register({
                firstName: tempFormData.firstName,
                lastName: tempFormData.lastName,
                email: tempFormData.email,
                password: tempFormData.password,
                role: tempFormData.role,
                phone: phoneNumber,
                phoneVerified: true
            })
            console.log('Registration response:', response)

            // After successful registration, log the user in automatically
            console.log('Logging in user...')
            const userData = await login(tempFormData.email, tempFormData.password, false)
            console.log('Login successful:', userData)

            showToast('✅ Cuenta creada exitosamente', 'success')
            // Redirect to professional dashboard
            navigate('/dashboard/professional')
        } catch (err) {
            console.error('Registration/Login error:', err)
            setApiError(err.message || 'Error al registrar usuario')
            showToast(err.message || 'Error al completar registro', 'error')
        } finally {
            setVerifying(false)
        }
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                {/* Register Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-linear-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-800">Crear Cuenta</h1>
                        <p className="text-gray-500">Gestión Terapéutica</p>
                        {step === 2 && (
                            <div className="flex items-center justify-center mt-4 space-x-2 text-sm">
                                <span className="flex items-center text-green-600">
                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Paso 1
                                </span>
                                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                                <span className="text-blue-600 font-medium">Paso 2: Verificar Teléfono</span>
                            </div>
                        )}
                    </div>

                    {/* Error Message */}
                    {apiError && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
                        >
                            {apiError}
                        </motion.div>
                    )}

                    {/* Step 1: Register Form */}
                    {step === 1 && (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <input type="hidden" {...register('role')} value="health_professional" />

                        {/* Professional Registration Info */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start">
                                <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <p className="text-sm font-medium text-blue-800">Registro de Profesional</p>
                                    <p className="text-xs text-blue-600 mt-1">Como profesional de salud, podrás gestionar pacientes y sus tratamientos.</p>
                                </div>
                            </div>
                        </div>

                        {/* First Name Input */}
                        <div>
                            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                                Nombre
                            </label>
                            <input
                                id="firstName"
                                type="text"
                                {...register('firstName', {
                                    required: 'El nombre es requerido',
                                    minLength: {
                                        value: 2,
                                        message: 'El nombre debe tener al menos 2 caracteres'
                                    }
                                })}
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 outline-none ${errors.firstName ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Juan"
                                disabled={isSubmitting}
                            />
                            {errors.firstName && (
                                <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                            )}
                        </div>

                        {/* Last Name Input */}
                        <div>
                            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                                Apellido
                            </label>
                            <input
                                id="lastName"
                                type="text"
                                {...register('lastName', {
                                    required: 'El apellido es requerido',
                                    minLength: {
                                        value: 2,
                                        message: 'El apellido debe tener al menos 2 caracteres'
                                    }
                                })}
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 outline-none ${errors.lastName ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Pérez"
                                disabled={isSubmitting}
                            />
                            {errors.lastName && (
                                <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                            )}
                        </div>

                        {/* Email Input */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Correo Electrónico
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
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 outline-none ${errors.email ? 'border-red-500' : 'border-gray-300'
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
                                Contraseña
                            </label>
                            <input
                                id="password"
                                type="password"
                                {...register('password', {
                                    required: 'La contraseña es requerida',
                                    minLength: {
                                        value: 6,
                                        message: 'La contraseña debe tener al menos 6 caracteres'
                                    }
                                })}
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 outline-none ${errors.password ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="••••••••"
                                disabled={isSubmitting}
                            />
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                            )}
                        </div>

                        {/* Confirm Password Input */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                Confirmar Contraseña
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                {...register('confirmPassword', {
                                    required: 'Debes confirmar la contraseña',
                                    validate: value => value === password || 'Las contraseñas no coinciden'
                                })}
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 outline-none ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="••••••••"
                                disabled={isSubmitting}
                            />
                            {errors.confirmPassword && (
                                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                            )}
                        </div>

                        {/* Terms & Conditions */}
                        <div>
                            <div className="flex items-start">
                                <input
                                    id="terms"
                                    type="checkbox"
                                    {...register('terms', {
                                        validate: value => value === true || 'Debes aceptar los términos y condiciones'
                                    })}
                                    className={`w-4 h-4 mt-0.5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 ${errors.terms ? 'border-red-500' : ''
                                        }`}
                                    disabled={isSubmitting}
                                />
                                <label htmlFor="terms" className="ml-2 text-sm text-gray-600 cursor-pointer">
                                    Acepto los{' '}
                                    <a href="#" onClick={(e) => e.preventDefault()} className="text-indigo-600 hover:text-indigo-700 font-medium">
                                        Términos de Servicio
                                    </a>{' '}
                                    y la{' '}
                                    <a href="#" onClick={(e) => e.preventDefault()} className="text-indigo-600 hover:text-indigo-700 font-medium">
                                        Política de Privacidad
                                    </a>
                                </label>
                            </div>
                            {errors.terms && (
                                <p className="mt-1 text-sm text-red-600">{errors.terms.message}</p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <motion.button
                            type="submit"
                            disabled={isSubmitting}
                            whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                            whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                            className="w-full bg-linear-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Continuar →
                        </motion.button>
                    </form>
                    )}

                    {/* Step 2: Phone Verification */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-start">
                                    <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <div>
                                        <p className="text-sm font-medium text-blue-800">Verificación de Teléfono</p>
                                        <p className="text-xs text-blue-600 mt-1">
                                            {!otpSent 
                                                ? 'Ingresa tu número de teléfono para recibir un código de verificación'
                                                : 'Ingresa el código de 6 dígitos que enviamos a tu teléfono'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {!otpSent ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Número de Teléfono
                                        </label>
                                        <input
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            placeholder="5512345678"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            disabled={verifying}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Formato: 10 dígitos sin espacios</p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={sendOTP}
                                        disabled={verifying}
                                        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                    >
                                        {verifying ? 'Enviando...' : 'Enviar Código'}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Código de Verificación
                                        </label>
                                        <input
                                            type="text"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            placeholder="123456"
                                            maxLength={6}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl tracking-widest focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            disabled={verifying}
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={verifyOTPAndRegister}
                                        disabled={verifying}
                                        className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                    >
                                        {verifying ? 'Verificando...' : 'Verificar y Crear Cuenta'}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setOtpSent(false)
                                            setOtp('')
                                        }}
                                        className="w-full text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                                    >
                                        ¿No recibiste el código? Reenviar
                                    </button>
                                </>
                            )}

                            <button
                                type="button"
                                onClick={() => {
                                    setStep(1)
                                    setOtpSent(false)
                                    setOtp('')
                                    setPhoneNumber('')
                                }}
                                className="w-full text-sm text-gray-600 hover:text-gray-800"
                            >
                                ← Volver al formulario
                            </button>
                        </div>
                    )}

                    {/* Sign In Link */}
                    <div className="text-center pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                            ¿Ya tienes una cuenta?{' '}
                            <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                                Iniciar Sesión
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500">
                        Al registrarte, aceptas recibir comunicaciones de Gestión Terapéutica
                    </p>
                </div>
            </motion.div>
        </div>
    )
}

export default RegisterPage
