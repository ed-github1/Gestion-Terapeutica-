import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { showToast } from '@components'
import { patientsAPI } from '@services/patients'
import PatientForm from './PatientForm'
import PatientDiary from './PatientDiary'

// Mock patients data
const mockPatients = [
  {
    id: 1,
    nombre: 'María',
    apellido: 'González',
    email: 'maria.gonzalez@email.com',
    telefono: '+34 612 345 678',
    status: 'active',
    lastSession: '10 Feb 2026'
  },
  {
    id: 2,
    nombre: 'Carlos',
    apellido: 'Rodríguez',
    email: 'carlos.rodriguez@email.com',
    telefono: '+34 623 456 789',
    status: 'active',
    lastSession: '08 Feb 2026'
  },
  {
    id: 3,
    nombre: 'Ana',
    apellido: 'Martínez',
    email: 'ana.martinez@email.com',
    telefono: '+34 634 567 890',
    status: 'pending',
    lastSession: 'Sin sesiones'
  },
  {
    id: 4,
    nombre: 'David',
    apellido: 'López',
    email: 'david.lopez@email.com',
    telefono: '+34 645 678 901',
    status: 'active',
    lastSession: '12 Feb 2026'
  },
  {
    id: 5,
    nombre: 'Laura',
    apellido: 'Sánchez',
    email: 'laura.sanchez@email.com',
    telefono: '+34 656 789 012',
    status: 'inactive',
    lastSession: '15 Ene 2026'
  },
  {
    id: 6,
    nombre: 'Miguel',
    apellido: 'Fernández',
    email: 'miguel.fernandez@email.com',
    telefono: '+34 667 890 123',
    status: 'active',
    lastSession: '11 Feb 2026'
  },
  {
    id: 7,
    nombre: 'Isabel',
    apellido: 'García',
    email: 'isabel.garcia@email.com',
    telefono: '+34 678 901 234',
    status: 'pending',
    lastSession: 'Sin sesiones'
  },
  {
    id: 8,
    nombre: 'Javier',
    apellido: 'Díaz',
    email: 'javier.diaz@email.com',
    telefono: '+34 689 012 345',
    status: 'active',
    lastSession: '09 Feb 2026'
  },
  {
    id: 9,
    nombre: 'Carmen',
    apellido: 'Ruiz',
    email: 'carmen.ruiz@email.com',
    telefono: '+34 690 123 456',
    status: 'active',
    lastSession: '13 Feb 2026'
  },
  {
    id: 10,
    nombre: 'Pablo',
    apellido: 'Torres',
    email: 'pablo.torres@email.com',
    telefono: '+34 601 234 567',
    status: 'inactive',
    lastSession: '20 Ene 2026'
  },
  {
    id: 11,
    nombre: 'Elena',
    apellido: 'Ramírez',
    email: 'elena.ramirez@email.com',
    telefono: '+34 612 345 789',
    status: 'pending',
    lastSession: 'Sin sesiones'
  },
  {
    id: 12,
    nombre: 'Roberto',
    apellido: 'Moreno',
    email: 'roberto.moreno@email.com',
    telefono: '+34 623 456 890',
    status: 'active',
    lastSession: '07 Feb 2026'
  }
]

const ModernPatientsList = () => {
  const [patients, setPatients] = useState(mockPatients) // Start with mock data
  const [filteredPatients, setFilteredPatients] = useState([])
  const [loading, setLoading] = useState(false) // No loading since we have mock data
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [viewMode, setViewMode] = useState('grid')
  const [showAddPatient, setShowAddPatient] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [showDiary, setShowDiary] = useState(false)

  console.log('🔵 ModernPatientsList rendering, patients:', patients.length)
  console.log('🔵 Filtered patients:', filteredPatients.length)

  useEffect(() => {
    // Comment out API call - using mock data for now
    // loadPatients()
  }, [])

  useEffect(() => {
    filterPatients()
  }, [patients, searchTerm, filterStatus])

  const loadPatients = async () => {
    try {
      setLoading(true)
      const response = await patientsAPI.getAll()
      const data = response.data?.data || response.data || []
      const patientsArray = Array.isArray(data) ? data : []
      
      // Use mock data if API returns empty or fails
      if (patientsArray.length === 0) {
        console.log('📦 Using mock patients data')
        setPatients(mockPatients)
      } else {
        setPatients(patientsArray)
      }
    } catch (error) {
      console.log('📦 API failed, using mock patients data')
      setPatients(mockPatients)
    } finally {
      setLoading(false)
    }
  }

  const filterPatients = () => {
    if (!Array.isArray(patients)) {
      setFilteredPatients([])
      return
    }

    let filtered = [...patients]

    if (searchTerm) {
      filtered = filtered.filter(patient =>
        patient.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.apellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.telefono?.includes(searchTerm)
      )
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(patient => patient.status === filterStatus)
    }

    setFilteredPatients(filtered)
  }

  const handleDeletePatient = async (patientId) => {
    if (!confirm('¿Está seguro de eliminar este paciente?')) return

    try {
      await patientsAPI.delete(patientId)
      showToast('Paciente eliminado exitosamente', 'success')
      loadPatients()
    } catch (error) {
      // If API fails, remove from local state (for mock data)
      console.log('📦 Removing patient from local state')
      setPatients(prev => prev.filter(p => p.id !== patientId))
      showToast('Paciente eliminado', 'success')
    }
  }

  const openDiary = (patient) => {
    setSelectedPatient(patient)
    setShowDiary(true)
  }

  if (showDiary && selectedPatient) {
    return (
      <PatientDiary
        patientId={selectedPatient.id}
        patientName={`${selectedPatient.nombre} ${selectedPatient.apellido}`}
        onClose={() => {
          setShowDiary(false)
          setSelectedPatient(null)
        }}
      />
    )
  }

  return (
    <div className="h-screen bg-gray-50 overflow-y-auto">
      <div className="p-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Mis Pacientes</h1>
              <p className="text-gray-600">Gestiona y da seguimiento a tus pacientes</p>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddPatient(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl hover:bg-gray-800 transition shadow-lg font-semibold"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar Paciente
            </motion.button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-4xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{Array.isArray(patients) ? patients.length : 0}</p>
            <p className="text-sm text-gray-600">Total Pacientes</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="bg-linear-to-br from-emerald-500 to-teal-600 rounded-4xl p-6 shadow-lg text-white"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold mb-1">
              {Array.isArray(patients) ? patients.filter(p => p.status === 'active').length : 0}
            </p>
            <p className="text-sm text-emerald-100">Activos</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-4xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {Array.isArray(patients) ? patients.filter(p => p.status === 'pending').length : 0}
            </p>
            <p className="text-sm text-gray-600">Pendientes</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-4xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{filteredPatients.length}</p>
            <p className="text-sm text-gray-600">Resultados</p>
          </motion.div>
        </div>

        {/* Search and Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-4xl p-6 shadow-sm mb-6 border border-gray-100"
        >
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search */}
            <div className="flex-1 w-full relative">
              <input
                type="text"
                placeholder="Buscar por nombre, email o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition bg-gray-50"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-6 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition bg-gray-50 text-gray-700 font-medium"
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
              <option value="pending">Pendientes</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-2xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-3 rounded-xl transition ${viewMode === 'grid' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-3 rounded-xl transition ${viewMode === 'list' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        )}

        {/* No Results */}
        {!loading && filteredPatients.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-4xl shadow-sm p-12 text-center border border-gray-100"
          >
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No se encontraron pacientes</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza agregando tu primer paciente'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowAddPatient(true)}
                className="px-6 py-3 bg-gray-900 text-white rounded-2xl hover:bg-gray-800 transition font-semibold"
              >
                Agregar Primer Paciente
              </button>
            )}
          </motion.div>
        )}

        {/* Grid View */}
        {!loading && viewMode === 'grid' && filteredPatients.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPatients.map((patient) => (
              <ModernPatientCard
                key={patient.id}
                patient={patient}
                onDelete={handleDeletePatient}
                onOpenDiary={openDiary}
                onRefresh={loadPatients}
              />
            ))}
          </div>
        )}

        {/* List View */}
        {!loading && viewMode === 'list' && filteredPatients.length > 0 && (
          <div className="bg-white rounded-4xl shadow-sm overflow-hidden border border-gray-100">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Paciente
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Última Sesión
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPatients.map((patient) => (
                  <ModernPatientRow
                    key={patient.id}
                    patient={patient}
                    onDelete={handleDeletePatient}
                    onOpenDiary={openDiary}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showAddPatient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddPatient(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <PatientForm 
                onClose={() => setShowAddPatient(false)} 
                onSuccess={() => {
                  setShowAddPatient(false)
                  loadPatients()
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Modern Patient Card Component
const ModernPatientCard = ({ patient, onDelete, onOpenDiary, onRefresh }) => {
  const getInitials = (nombre, apellido) => {
    return `${nombre?.[0] || ''}${apellido?.[0] || ''}`.toUpperCase()
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-700'
      case 'pending':
        return 'bg-amber-100 text-amber-700'
      case 'inactive':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Activo'
      case 'pending':
        return 'Pendiente'
      case 'inactive':
        return 'Inactivo'
      default:
        return status
    }
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-4xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all"
    >
      <div className="flex items-start gap-4 mb-4">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-md">
          {getInitials(patient.nombre, patient.apellido)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-lg mb-1 truncate">
            {patient.nombre} {patient.apellido}
          </h3>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(patient.status)}`}>
            {getStatusText(patient.status)}
          </span>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="truncate">{patient.email || 'Sin email'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <span>{patient.telefono || 'Sin teléfono'}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onOpenDiary(patient)}
          className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition"
        >
          Ver Diario
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onDelete(patient.id)}
          className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-sm font-semibold hover:bg-rose-100 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </motion.button>
      </div>
    </motion.div>
  )
}

// Modern Patient Row Component (List View)
const ModernPatientRow = ({ patient, onDelete, onOpenDiary }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-700'
      case 'pending':
        return 'bg-amber-100 text-amber-700'
      case 'inactive':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Activo'
      case 'pending':
        return 'Pendiente'
      case 'inactive':
        return 'Inactivo'
      default:
        return status
    }
  }

  return (
    <tr className="hover:bg-gray-50 transition">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
            {`${patient.nombre?.[0] || ''}${patient.apellido?.[0] || ''}`.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{patient.nombre} {patient.apellido}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">
        <p>{patient.email || 'Sin email'}</p>
        <p className="text-xs text-gray-500">{patient.telefono || 'Sin teléfono'}</p>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(patient.status)}`}>
          {getStatusText(patient.status)}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">
        {patient.lastSession || 'Sin sesiones'}
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onOpenDiary(patient)}
            className="p-2 hover:bg-gray-100 rounded-xl transition"
            title="Ver Diario"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(patient.id)}
            className="p-2 hover:bg-rose-100 rounded-xl transition"
            title="Eliminar"
          >
            <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  )
}

export default ModernPatientsList
