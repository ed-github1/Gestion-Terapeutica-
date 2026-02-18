import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'motion/react'
import { useAuth } from './AuthContext'
import { authService } from '@shared/services/authService'
import { showToast } from '@components'
import { Brain, Mail, Lock, User, Phone, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react'

const RegisterPage = () => {
    const [apiError, setApiError] = useState('')

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

    const navigate = useNavigate()

    const password = watch('password')

    const onSubmit = async (data) => {
        setApiError('')
        try {
            // Register user
            const response = await authService.register({
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                password: data.password,
                role: data.role
            })
            showToast('✅ Cuenta creada exitosamente', 'success')
            navigate('/login')
        } catch (err) {
            setApiError(err.message || 'Error al registrar usuario')
            showToast(err.message || 'Error al completar registro', 'error')
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                {/* Register Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
                    {/* Header */}
                    <div className="text-center space-y-3">
                        <div className="flex justify-center">
                            <div className="w-14 h-14  rounded-xl flex items-center justify-center">
                                <Brain className="w-7 h-7 text-blue-600" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Crear Cuenta</h1>
                            <p className="text-sm text-gray-500 mt-1">Comienza tu viaje con nosotros</p>
                        </div>
                    </div>

                    {/* Error Message */}
                    {apiError && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-start gap-2 p-3 bg-rose-50 rounded-xl border border-rose-100"
                        >
                            <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                            <p className="text-sm text-rose-700 leading-relaxed">{apiError}</p>
                        </motion.div>
                    )}

                    {/* Register Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <input type="hidden" {...register('role')} value="health_professional" />

                        {/* Professional Registration Info */}
                        <div className="bg-linear-to-r from-indigo-50 to-blue-50 rounded-xl p-4 border border-indigo-100">
                            <p className="text-xs text-gray-600 leading-relaxed">
                                <span className="font-semibold text-indigo-700">Registro de Profesional</span> - Como profesional de salud, podrás gestionar pacientes y sus tratamientos.
                            </p>
                        </div>

                        {/* First Name Input */}
                        <div>
                            <label htmlFor="firstName" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                Nombre
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
                                    className={`w-full pl-10 pr-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition outline-none ${errors.firstName ? 'border-rose-500' : 'border-gray-200'
                                        }`}
                                    placeholder="Juan"
                                    disabled={isSubmitting}
                                />
                            </div>
                            {errors.firstName && (
                                <p className="mt-1.5 text-xs text-rose-600">{errors.firstName.message}</p>
                            )}
                        </div>

                        {/* Last Name Input */}
                        <div>
                            <label htmlFor="lastName" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                Apellido
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
                                    className={`w-full pl-10 pr-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition outline-none ${errors.lastName ? 'border-rose-500' : 'border-gray-200'
                                        }`}
                                    placeholder="Pérez"
                                    disabled={isSubmitting}
                                />
                            </div>
                            {errors.lastName && (
                                <p className="mt-1.5 text-xs text-rose-600">{errors.lastName.message}</p>
                            )}
                        </div>

                        {/* Email Input */}
                        <div>
                            <label htmlFor="email" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                Correo Electrónico
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
                                    className={`w-full pl-10 pr-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition outline-none ${errors.email ? 'border-rose-500' : 'border-gray-200'
                                        }`}
                                    placeholder="tu@correo.com"
                                    disabled={isSubmitting}
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1.5 text-xs text-rose-600">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Password Input */}
                        <div>
                            <label htmlFor="password" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                Contraseña
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
                                    className={`w-full pl-10 pr-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition outline-none ${errors.password ? 'border-rose-500' : 'border-gray-200'
                                        }`}
                                    placeholder="••••••••"
                                    disabled={isSubmitting}
                                />
                            </div>
                            {errors.password && (
                                <p className="mt-1.5 text-xs text-rose-600">{errors.password.message}</p>
                            )}
                        </div>

                        {/* Confirm Password Input */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                Confirmar Contraseña
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    {...register('confirmPassword', {
                                        required: 'Debes confirmar la contraseña',
                                        validate: value => value === password || 'Las contraseñas no coinciden'
                                    })}
                                    className={`w-full pl-10 pr-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition outline-none ${errors.confirmPassword ? 'border-rose-500' : 'border-gray-200'
                                        }`}
                                    placeholder="••••••••"
                                    disabled={isSubmitting}
                                />
                            </div>
                            {errors.confirmPassword && (
                                <p className="mt-1.5 text-xs text-rose-600">{errors.confirmPassword.message}</p>
                            )}
                        </div>

                        {/* Terms & Conditions */}
                        <label className="flex items-start gap-2 cursor-pointer">
                            <input
                                id="terms"
                                type="checkbox"
                                {...register('terms', {
                                    validate: value => value === true || 'Debes aceptar los términos y condiciones'
                                })}
                                className={`w-3.5 h-3.5 mt-0.5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 ${errors.terms ? 'border-rose-500' : ''
                                    }`}
                                disabled={isSubmitting}
                            />
                            <span className="text-xs text-gray-600 leading-relaxed">
                                Acepto los{' '}
                                <a href="#" onClick={(e) => e.preventDefault()} className="text-indigo-600 hover:text-indigo-700 font-medium">
                                    Términos
                                </a>{' '}
                                y{' '}
                                <a href="#" onClick={(e) => e.preventDefault()} className="text-indigo-600 hover:text-indigo-700 font-medium">
                                    Políticas de Privacidad
                                </a>
                            </span>
                        </label>
                        {errors.terms && (
                            <p className="text-xs text-rose-600 -mt-2">{errors.terms.message}</p>
                        )}

                        {/* Submit Button */}
                        <motion.button
                            type="submit"
                            disabled={isSubmitting}
                            whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                            whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                            className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:from-indigo-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Procesando...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-1.5">
                                    Continuar
                                    <ArrowRight className="w-4 h-4" />
                                </span>
                            )}
                        </motion.button>
                    </form>


                    {/* Sign In Link */}
                    <div className="text-center pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-600">
                            ¿Ya tienes una cuenta?{' '}
                            <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                                Iniciar Sesión
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-400">
                        Registro seguro y protegido
                    </p>
                </div>
            </motion.div>
        </div>
    )
}

export default RegisterPage
