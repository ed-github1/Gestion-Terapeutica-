import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { useDropzone } from 'react-dropzone'
import { motion } from 'motion/react'
import { patientsAPI } from '../../services/patients'

const PatientForm = ({ onClose, onSubmit: onFormSubmit }) => {
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
      // Create patient with backend structure (without email/password)
      const patientData = {
        nombre: data.nombre,
        apellido: data.apellido,
        datosPersonales: {
          telefono: data.phone,
          fecha_nacimiento: data.dateOfBirth,
          genero: data.gender,
          direccion: data.address,
          historial_medico: data.medicalHistory,
          alergias: data.allergies,
          medicamentos_actuales: data.currentMedications,
        },
        contactoEmergencia: {
          nombre: data.emergencyContact,
          telefono: data.emergencyPhone,
        }
      }

      const result = await patientsAPI.create(patientData)
      
      // Upload photo if exists
      if (photoFile && result.data?.id) {
        await patientsAPI.uploadPhoto(result.data.id, photoFile)
      }

      // Upload documents if exist
      if (uploadedFiles.length > 0 && result.data?.id) {
        await patientsAPI.uploadDocument(result.data.id, uploadedFiles.map(f => f.file))
      }

      // Send registration invitation if email provided
      if (data.invitationEmail && result.data?.id) {
        try {
          await patientsAPI.sendInvitation(result.data.id, data.invitationEmail)
          
          // Generate registration link for manual sharing
          const registrationLink = `${window.location.origin}/patient/register?patientId=${result.data.id}&token=${result.data.invitationToken || 'temp-token'}`
          
          alert(`✅ Paciente registrado exitosamente!\n\n📧 Se envió un correo de invitación a: ${data.invitationEmail}\n\n🔗 Link de registro:\n${registrationLink}\n\n👉 Comparte este link con el paciente para que complete su registro.`)
        } catch (inviteError) {
          console.error('Error sending invitation:', inviteError)
          // Still show success with manual link
          const registrationLink = `${window.location.origin}/patient/register?patientId=${result.data.id}&token=temp-token`
          alert(`✅ Paciente registrado!\n\n⚠️ No se pudo enviar el email automáticamente.\n\n🔗 Comparte este link manualmente:\n${registrationLink}`)
        }
      } else {
        const registrationLink = `${window.location.origin}/patient/register?patientId=${result.data.id}&token=temp-token`
        alert(`✅ Paciente registrado exitosamente!\n\n🔗 Link de registro:\n${registrationLink}\n\n👉 Comparte este link con el paciente para que complete su registro.`)
      }

      if (onFormSubmit) {
        onFormSubmit(result.data)
      }

      onClose()
    } catch (error) {
      console.error('Error creating patient:', error)
      alert(error.response?.data?.message || 'Error al registrar paciente')
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
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Nuevo Paciente</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Foto del Paciente</label>
            <div {...getPhotoRootProps()} className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition">
              <input {...getPhotoInputProps()} />
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-32 h-32 rounded-full mx-auto object-cover" />
              ) : (
                <div className="text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p>Arrastra una foto o haz clic para seleccionar</p>
                </div>
              )}
            </div>
          </div>

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
                Correo para Invitación (Opcional)
              </label>
              <input
                type="email"
                {...register('invitationEmail', { 
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Correo inválido' }
                })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${errors.invitationEmail ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="paciente@ejemplo.com"
              />
              {errors.invitationEmail && <p className="text-red-600 text-sm mt-1">{errors.invitationEmail.message}</p>}
              <p className="text-xs text-gray-500 mt-1">
                💡 Se generará un link de registro que podrás compartir manualmente si no ingresas un correo
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono *</label>
              <input
                {...register('phone', { required: 'El teléfono es requerido' })}
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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Paciente'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default PatientForm
