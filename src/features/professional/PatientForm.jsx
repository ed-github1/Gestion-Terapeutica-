import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { useDropzone } from 'react-dropzone'
import { motion } from 'motion/react'
import { patientsAPI } from '../../services/patients'
import { showToast } from '../../components'

const PatientForm = ({ onClose, onSubmit: onFormSubmit, mode = 'invite' }) => {
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      nombre: '',
      apellido: '',
      phone: '',
      dateOfBirth: '',
      gender: '',
      address: '',
      emergencyContact: '',
      emergencyPhone: '',
      medicalHistory: '',
      allergies: '',
      currentMedications: '',
      invitationEmail: '',
    }
  })

  // Photo upload
  const onPhotoDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0]
    if (file) {
      setPhotoFile(file)
      const reader = new FileReader()
      reader.onload = () => setPhotoPreview(reader.result)
      reader.readAsDataURL(file)
    }
  }, [])

  const { getRootProps: getPhotoRootProps, getInputProps: getPhotoInputProps } = useDropzone({
    onDrop: onPhotoDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg'] },
    maxFiles: 1
  })

  // Documents upload
  const onDocumentDrop = useCallback((acceptedFiles) => {
    setUploadedFiles(prev => [...prev, ...acceptedFiles.map(file => ({
      name: file.name,
      size: file.size,
      file
    }))])
  }, [])

  const { getRootProps: getDocRootProps, getInputProps: getDocInputProps } = useDropzone({
    onDrop: onDocumentDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/msword': ['.doc', '.docx']
    }
  })

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (data) => {
    try {
      // Get current professional ID from localStorage/sessionStorage
      const userDataStr = localStorage.getItem('userData') || sessionStorage.getItem('userData')
      console.log('🔍 userDataStr:', userDataStr)
      const user = JSON.parse(userDataStr || '{}')
      console.log('🔍 Parsed user:', user)
      
      // Try multiple possible ID fields
      const professionalId = user.id || user._id || user.userId || user.professional_id || user.professionalId
      console.log('🔍 Professional ID found:', professionalId)

      if (!professionalId) {
        console.error('❌ User data:', user)
        console.error('❌ Available keys:', Object.keys(user))
        showToast('Error: No se encontró el ID del profesional. Por favor, vuelve a iniciar sesión.', 'error')
        return
      }

      // Send invitation for patient to register themselves
      const fullName = `${data.nombre || ''} ${data.apellido || ''}`.trim()
      
      const invitationData = {
        patientEmail: data.invitationEmail || null,
        patientName: fullName,
        firstName: data.nombre || '',
        lastName: data.apellido || '',
        phone: data.phone || null,
        professionalId: professionalId,
        channels: ['EMAIL'], // Email only for invitations
        // Backend might also accept these formats
        nombre: data.nombre,
        apellido: data.apellido,
        telefono: data.phone,
        // Additional patient info to pre-fill registration
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        address: data.address,
        emergencyContact: data.emergencyContact,
        emergencyPhone: data.emergencyPhone,
        medicalHistory: data.medicalHistory,
        allergies: data.allergies,
        currentMedications: data.currentMedications
      }

      console.log('═══════════════════════════════════════')
      console.log('📤 SENDING INVITATION PAYLOAD')
      console.log('═══════════════════════════════════════')
      console.log('Form Data Received:', data)
      console.log('Email Field Value:', data.invitationEmail)
      console.log('Phone Field Value:', data.phone)
      console.log('─────────────────────────────────────')
      console.log('Professional User Data:', user)
      console.log('Professional Role:', user?.role || user?.rol)
      console.log('─────────────────────────────────────')
      console.log('Invitation Payload:', JSON.stringify(invitationData, null, 2))
      console.log('Channels:', invitationData.channels)
      console.log('Email in payload:', invitationData.patientEmail)
      console.log('═══════════════════════════════════════')
      
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
      console.log('🔑 Auth Token:', token ? `${token.substring(0, 20)}...` : 'NOT FOUND')
      
      // Send invitation via API
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/invitations/send`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(invitationData)
        }
      )

      const result = await response.json()

      if (response.ok) {
        showToast(`✅ Invitación enviada exitosamente a ${data.invitationEmail}`, 'success')
        console.log('✅ Invitation sent:', result)
        
        if (onFormSubmit) {
          onFormSubmit(result.data)
        }
        
        onClose()
      } else {
        throw new Error(result.message || 'Error al enviar invitación')
      }

    } catch (error) {
      console.error('Error sending invitation:', error)
      showToast(error.message || 'Error al enviar invitación', 'error')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-gray-900">Invitar Nuevo Paciente</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-medium">El paciente recibirá una invitación por email</p>
              <p className="text-blue-600 mt-1">Podrá registrarse para acceder a videollamadas y su portal de paciente</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">

          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
              <input
                {...register('nombre', { required: 'El nombre es requerido' })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.nombre ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Juan"
              />
              {errors.nombre && <p className="text-red-600 text-sm mt-1">{errors.nombre.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Apellido *</label>
              <input
                {...register('apellido', { required: 'El apellido es requerido' })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.apellido ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Pérez García"
              />
              {errors.apellido && <p className="text-red-600 text-sm mt-1">{errors.apellido.message}</p>}
            </div>

            {/* Registration Invitation Section */}
            <div className="col-span-2 bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div className="text-sm text-purple-800">
                  <p className="font-medium mb-1">Invitación de Registro</p>
                  <p>Se enviará un link de registro al correo del paciente. El paciente creará su propia contraseña de forma segura.</p>
                </div>
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico *
              </label>
              <input
                type="email"
                {...register('invitationEmail', { 
                  required: 'El correo electrónico es requerido',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Correo inválido' }
                })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${errors.invitationEmail ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="paciente@ejemplo.com"
              />
              {errors.invitationEmail && <p className="text-red-600 text-sm mt-1">{errors.invitationEmail.message}</p>}
              <p className="text-xs text-gray-500 mt-1">
                📧 Se enviará la invitación por correo electrónico
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono (opcional)</label>
              <input
                {...register('phone')}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="+1 234 567 8900"
              />
              {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Nacimiento *</label>
              <input
                type="date"
                {...register('dateOfBirth', { required: 'La fecha es requerida' })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.dateOfBirth && <p className="text-red-600 text-sm mt-1">{errors.dateOfBirth.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Género *</label>
              <select
                {...register('gender', { required: 'El género es requerido' })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.gender ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Seleccionar</option>
                <option value="male">Masculino</option>
                <option value="female">Femenino</option>
                <option value="other">Otro</option>
              </select>
              {errors.gender && <p className="text-red-600 text-sm mt-1">{errors.gender.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
              <input
                {...register('address')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Calle 123, Ciudad"
              />
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contacto de Emergencia</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                <input
                  {...register('emergencyContact')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Nombre del contacto"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                <input
                  {...register('emergencyPhone')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Médica</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Historial Médico</label>
                <textarea
                  {...register('medicalHistory')}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Condiciones médicas previas, cirugías, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Alergias</label>
                <textarea
                  {...register('allergies')}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Alergias conocidas a medicamentos, alimentos, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Medicamentos Actuales</label>
                <textarea
                  {...register('currentMedications')}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Medicamentos que está tomando actualmente"
                />
              </div>
            </div>
          </div>

          {/* Documents Upload */}
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Documentos</label>
            <div {...getDocRootProps()} className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition">
              <input {...getDocInputProps()} />
              <svg className="w-10 h-10 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-gray-600">Arrastra archivos o haz clic para seleccionar</p>
              <p className="text-sm text-gray-500 mt-1">PDF, DOC, DOCX, imágenes</p>
            </div>
            
            {uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition disabled:opacity-50 shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enviando Invitación...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                  </svg>
                  Enviar Invitación
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default PatientForm
