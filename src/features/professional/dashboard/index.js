/**
 * Dashboard Components Barrel Exports
 * All modular dashboard components for the professional dashboard
 */

// Components
export { default as ProfessionalDashboard } from '../components/ProfessionalDashboard'
export { default as DashboardHeader } from './DashboardHeader'
export { default as DashboardStats } from '../components/DashboardStats'
export { default as QuickActions } from '../components/QuickActions'
export { default as TodaysSessions } from './TodaysSessions'
export { default as ActivityFeed } from './ActivityFeed'
export { default as ProgressSummary } from '../components/ProgressSummary'
export { default as ProfileSidebar } from './ProfileSidebar'

// Hooks
export { useDashboardData, useDashboardView, useCurrentTime } from './useDashboard'

// Utilities
export * from './dashboardUtils'

