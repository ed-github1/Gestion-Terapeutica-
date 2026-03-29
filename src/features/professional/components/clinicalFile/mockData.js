import { MOOD_META, HOMEWORK_TYPES } from './constants'

// Seeded randomish helper — deterministic per patient id
const seededInt = (seed, min, max) => {
  const s = ((seed * 9301 + 49297) % 233280) / 233280
  return min + Math.floor(s * (max - min + 1))
}

export const buildMockData = (patient) => {
  const seed = typeof patient.id === 'number'
    ? patient.id
    : String(patient.id).charCodeAt(0) + String(patient.id).charCodeAt(1) || 7

  const moods = Object.keys(MOOD_META)
  const diaryEntries = [
    {
      id: 'd1', type: 'patient',
      mood: moods[seededInt(seed, 0, moods.length - 1)],
      date: new Date(Date.now() - 86400000 * 1).toISOString(),
      notes: 'Hoy me sentí más tranquilo después de la sesión. Practiqué los ejercicios de respiración por la mañana.',
      activities: 'Salir a caminar 30 min',
      symptoms: null, energy: 7, sleep: 7,
    },
    {
      id: 'd2', type: 'patient',
      mood: moods[seededInt(seed + 1, 0, moods.length - 1)],
      date: new Date(Date.now() - 86400000 * 3).toISOString(),
      notes: 'Noche difícil. Pensamientos intrusivos. Apliqué la técnica de reestructuración cognitiva.',
      activities: null,
      symptoms: 'Insomnio leve', energy: 4, sleep: 4,
    },
    {
      id: 'd3', type: 'patient',
      mood: moods[seededInt(seed + 2, 0, moods.length - 1)],
      date: new Date(Date.now() - 86400000 * 6).toISOString(),
      notes: 'Buena semana en general. Conecté con amigos y me ayudó mucho.',
      activities: 'Reunión social, ejercicio',
      symptoms: null, energy: 8, sleep: 8,
    },
    {
      id: 'd4', type: 'patient',
      mood: moods[seededInt(seed + 3, 0, moods.length - 1)],
      date: new Date(Date.now() - 86400000 * 9).toISOString(),
      notes: 'Situación estresante en el trabajo. Dificultades concentrarme.',
      activities: null,
      symptoms: 'Tensión muscular', energy: 3, sleep: 5,
    },
    {
      id: 'd5', type: 'patient',
      mood: '😊',
      date: new Date(Date.now() - 86400000 * 12).toISOString(),
      notes: 'Completé las tareas asignadas. Me sentí bien al hacerlo.',
      activities: 'Lectura 20 min, meditación',
      symptoms: null, energy: 8, sleep: 9,
    },
  ]

  const clinicalNotes = [
    {
      id: 'n1', type: 'clinical',
      date: new Date(Date.now() - 86400000 * 2).toISOString(),
      author: 'Profesional', sessionNumber: patient.totalSessions || 1,
      text: 'Sesión de seguimiento. El paciente reporta mejoría subjetiva en el manejo de la ansiedad. Se trabaja el registro de pensamientos automáticos con buena adherencia. Se propone continuar exposición gradual la próxima semana.',
      tags: ['TCC', 'Exposición', 'Registro cognitivo'],
    },
    {
      id: 'n2', type: 'clinical',
      date: new Date(Date.now() - 86400000 * 9).toISOString(),
      author: 'Profesional', sessionNumber: Math.max(1, (patient.totalSessions || 3) - 1),
      text: 'Se revisa plan de seguridad. El paciente describe episodio de crisis leve que manejó de forma autónoma. Refuerzo positivo. Se ajusta la frecuencia de sesiones a semanal.',
      tags: ['Plan de seguridad', 'Crisis', 'Ajuste de tratamiento'],
    },
    {
      id: 'n3', type: 'clinical',
      date: new Date(Date.now() - 86400000 * 16).toISOString(),
      author: 'Profesional', sessionNumber: Math.max(1, (patient.totalSessions || 4) - 2),
      text: 'Evaluación inicial. Diagnóstico provisional. Se plantean objetivos terapéuticos y se explica el modelo cognitivo-conductual.',
      tags: ['Evaluación', 'GAD-7', 'Psicoeducación'],
    },
  ]

  const types = Object.keys(HOMEWORK_TYPES)
  const homeworkTasks = [
    {
      id: 'h1', type: types[seededInt(seed, 0, types.length - 1)],
      title: 'Registro de pensamientos automáticos',
      description: 'Anotar 3 pensamientos negativos diarios y sus alternativas racionales usando la hoja de registro TCC.',
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
      completed: true,
      completedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      assignedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    },
    {
      id: 'h2', type: 'breathing',
      title: 'Práctica de respiración diafragmática',
      description: '10 minutos cada mañana al despertar siguiendo el audio enviado. Registrar nivel de ansiedad antes y después (escala 0-10).',
      dueDate: new Date(Date.now() + 86400000 * 7).toISOString(),
      completed: false, completedAt: null,
      assignedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: 'h3', type: 'exercise',
      title: 'Activación conductual: actividad placentera',
      description: 'Realizar una actividad que solía disfrutar (30 min mínimo). Registrar humor antes y después.',
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
      completed: true,
      completedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      assignedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      id: 'h4', type: 'reading',
      title: 'Lectura: capítulo 3 "El cerebro ansioso"',
      description: 'Leer el capítulo asignado y anotar los conceptos que más resuenen con su experiencia personal.',
      dueDate: new Date(Date.now() - 86400000 * 1).toISOString(),
      completed: false, completedAt: null,
      assignedAt: new Date(Date.now() - 86400000 * 9).toISOString(),
    },
    {
      id: 'h5', type: 'journaling',
      title: 'Diario de gratitud',
      description: 'Escribir 3 cosas positivas del día cada noche antes de dormir. Duración: 2 semanas.',
      dueDate: new Date(Date.now() + 86400000 * 10).toISOString(),
      completed: false, completedAt: null,
      assignedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ]

  const sessionHistory = Array.from({ length: Math.min(patient.totalSessions || 5, 8) }, (_, i) => ({
    id: `s${i + 1}`,
    number: (patient.totalSessions || 5) - i,
    date: new Date(Date.now() - 86400000 * 7 * (i + 1)).toISOString(),
    duration: [50, 55, 60][i % 3],
    type: ['Presencial', 'Videollamada', 'Presencial'][i % 3],
    mood: seededInt(seed + i, 3, 9),
  }))

  return { diaryEntries, clinicalNotes, homeworkTasks, sessionHistory }
}
