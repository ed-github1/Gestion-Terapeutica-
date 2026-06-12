import { useState } from 'react'

console.log('⚠️ ProfessionalAvatar.jsx file loaded')

const ProfessionalAvatar = ({
  pictureUrl,
  name = 'Profesional',
  size = 'md',
  className = '',
  hasRing = true,
}) => {
  const [imageError, setImageError] = useState(false)
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  console.log('ProfessionalAvatar rendered:', { pictureUrl, name, imageError })

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-20 h-20 text-2xl',
  }

  const ringClasses = hasRing ? 'ring-2 ring-blue-400/20' : ''
  const baseClasses = `${sizeClasses[size]} rounded-full flex items-center justify-center font-bold shrink-0 ${ringClasses} ${className}`

  if (pictureUrl && !imageError) {
    return (
      <img
        src={pictureUrl}
        alt={name}
        className={`${baseClasses} object-cover`}
        onError={(e) => {
          console.error('ProfessionalAvatar image failed to load:', pictureUrl, e)
          setImageError(true)
        }}
        onLoad={() => console.log('ProfessionalAvatar image loaded:', pictureUrl)}
      />
    )
  }

  return (
    <div className={`${baseClasses} bg-gradient-to-br from-blue-600 to-sky-500 text-white`}>
      {initials}
    </div>
  )
}

export default ProfessionalAvatar
