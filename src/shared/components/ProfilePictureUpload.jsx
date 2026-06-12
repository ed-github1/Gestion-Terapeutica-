import { useState, useRef } from 'react'
import { motion } from 'motion/react'
import { Upload, X } from 'lucide-react'
import { professionalsService } from '@shared/services/professionalsService'
import { showToast } from '@shared/ui/Toast'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

const ProfilePictureUpload = ({ onUploadSuccess, currentImage = null, altText = 'Profile picture' }) => {
  const [preview, setPreview] = useState(currentImage || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Solo se permiten archivos JPG, PNG o WebP.'
    }
    if (file.size > MAX_SIZE) {
      return 'El archivo no puede superar 5MB.'
    }
    return null
  }

  const handleFileSelect = async (file) => {
    setError(null)
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      showToast(validationError, 'error')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target.result)
    reader.readAsDataURL(file)

    setLoading(true)
    try {
      console.log('Uploading file:', file.name, file.type, file.size)
      const res = await professionalsService.uploadPicture(file)
      console.log('Upload response:', res.data)
      const pictureUrl = res.data?.data?.pictureUrl
      console.log('Picture URL:', pictureUrl)
      showToast('Foto de perfil actualizada correctamente.', 'success')
      onUploadSuccess?.(pictureUrl)
    } catch (err) {
      console.error('Upload error details:', err.response?.data || err.data || err)
      const message = err.response?.data?.message
        || err.data?.message
        || (err.status === 400 ? 'Archivo inválido o demasiado grande.' : null)
        || err.message
        || 'Error al subir la foto.'
      setError(message)
      showToast(message, 'error')
      setPreview(currentImage || null)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileSelect(file)
  }

  return (
    <div className="space-y-3">
      {/* Preview */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-32 h-32 mx-auto"
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt={altText}
              className="w-full h-full rounded-full object-cover border-2 border-sky-200 dark:border-sky-900"
            />
            {!loading && (
              <button
                onClick={() => setPreview(null)}
                className="absolute top-0 right-0 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </>
        ) : (
          <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-100 to-sky-50 dark:from-blue-900/30 dark:to-sky-900/30 border-2 border-dashed border-blue-300 dark:border-blue-700 flex items-center justify-center">
            <Upload className="w-8 h-8 text-blue-400 dark:text-blue-500" />
          </div>
        )}
      </motion.div>

      {/* Upload Area */}
      <motion.div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        whileHover={{ borderColor: 'rgb(59, 130, 246)' }}
        className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center cursor-pointer transition-colors hover:bg-blue-50 dark:hover:bg-blue-950/10"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          onChange={handleInputChange}
          disabled={loading}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="w-full disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Upload className="w-5 h-5 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {loading ? 'Subiendo...' : 'Selecciona una imagen o arrastrala aquí'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            JPG, PNG o WebP • Máximo 5MB
          </p>
        </button>
      </motion.div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-red-600 dark:text-red-400 text-center"
        >
          {error}
        </motion.p>
      )}
    </div>
  )
}

export default ProfilePictureUpload
