/**
 * DashboardSidebar - Main Export
 * 
 * Re-exports the refactored DashboardSidebar component from the sidebar directory
 * This file maintains backward compatibility with existing imports
 * 
 * The component has been refactored into smaller, maintainable pieces:
 * - sidebar/DashboardSidebar.jsx - Main component orchestrator
 * - sidebar/SidebarHeader.jsx - Branding and logo
 * - sidebar/SidebarNav.jsx - Navigation container
 * - sidebar/SidebarNavItem.jsx - Individual nav items
 * - sidebar/SidebarProBanner.jsx - Pro plan promotional banner
 * - sidebar/SidebarFooter.jsx - Settings and logout
 * - sidebar/SidebarCollapseToggle.jsx - Collapse/expand button
 * - sidebar/useSidebar.js - Custom hook for state management
 * - sidebar/sidebarConfig.js - Configuration and menu items
 */

export { default } from './sidebar/DashboardSidebar'
