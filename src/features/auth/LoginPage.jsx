import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import {  Brain, Mail, Lock, AlertCircle } from 'lucide-react'
import { useAuth } from './AuthContext'

const LoginPage = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    }
  })
  
  const { login, error } = useAuth()
  const navigate = useNavigate()

  const onSubmit = async (data) => {
    try {
      const userData = await login(data.email, data.password, data.rememberMe)
      
      // Redirect based on user role
      if (userData.role === 'health_professional' || userData.role === 'professional') {
        navigate('/dashboard/professional')
      } else if (userData.role === 'patient' || userData.role === 'pacient') {
        navigate('/dashboard/patient')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      console.error('Login error:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Login Card */}
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="w-14 h-14  rounded-xl flex items-center justify-center">
                <Brain className="w-7 h-7 text-blue-600" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bienvenido</h1>
              <p className="text-sm text-gray-500 mt-1">Inicia sesión en tu cuenta</p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-rose-50 rounded-xl border border-rose-100">
              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
              <p className="text-sm text-rose-700 leading-relaxed">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                  className={`w-full pl-10 pr-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition outline-none ${
                    errors.email ? 'border-rose-500' : 'border-gray-200'
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
                  className={`w-full pl-10 pr-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition outline-none ${
                    errors.password ? 'border-rose-500' : 'border-gray-200'
                  }`}
                  placeholder="••••••••"
                  disabled={isSubmitting}
                />
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-rose-600">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('rememberMe')}
                  className="w-3.5 h-3.5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  disabled={isSubmitting}
                />
                <span className="text-xs text-gray-600">Recordarme</span>
              </label>
              <a href="#" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:from-indigo-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Ingresando...
                </span>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="text-center pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-600">
              ¿No tienes una cuenta?{' '}
              <a href="/register" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                Regístrate
              </a>
            </p>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            Al continuar, aceptas nuestros{' '}
            <a href="#" className="underline hover:text-gray-600">
              Términos
            </a>{' '}
            y{' '}
            <a href="#" className="underline hover:text-gray-600">
              Privacidad
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
