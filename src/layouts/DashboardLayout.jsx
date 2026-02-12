import { useState } from 'react'
import { Menu, X, User } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import DashboardSidebar from '@components/layout/DashboardSidebar'
import { useAuth } from '@features/auth'

// Dashboard Layout with persistent sidebar in rounded container
const DashboardLayout = ({ children, userRole }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const { user } = useAuth()

    // Get user initials
    const getInitials = () => {
        if (!user) return '?'
        if (user.nombre && user.apellido) {
            return `${user.nombre[0]}${user.apellido[0]}`.toUpperCase()
        }
        if (user.name) {
            const parts = user.name.split(' ')
            return parts.length > 1 
                ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
                : user.name.substring(0, 2).toUpperCase()
        }
        return user.email ? user.email[0].toUpperCase() : '?'
    }

    return (
        <div className="h-screen bg-indigo-50 flex flex-col">
            {/* Mobile Top Bar */}
            <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm z-30">
                <div className="flex items-center gap-3">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                        {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </motion.button>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                            <span className="text-white text-sm font-bold">T</span>
                        </div>
                        <span className="text-lg font-semibold text-gray-900">TotalMente</span>
                    </div>
                </div>
                {/* Mobile Profile Circle */}
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center text-white text-xs font-semibold cursor-pointer shadow-sm"
                >
                    {getInitials()}
                </motion.div>
            </div>

            {/* Main Container */}
            <div className="flex-1 flex overflow-hidden">
                {/* Mobile Overlay */}
                <AnimatePresence>
                    {isSidebarOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsSidebarOpen(false)}
                            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
                        />
                    )}
                </AnimatePresence>

                {/* Sidebar - Hidden on mobile, always visible on md+ */}
                <div className={`${isSidebarOpen ? 'fixed' : 'hidden'
                    } md:block left-0 md:relative md:left-0 top-[52px] md:top-0 h-[calc(100vh-52px)] md:h-full z-50`}>
                    <DashboardSidebar userRole={userRole} onClose={() => setIsSidebarOpen(false)} />
                </div>

                {/* Main Content with Profile Circle */}
                <div className="flex-1 h-full overflow-hidden bg-white md:bg-transparent relative">
                    {/* Desktop Profile Circle - Top Right */}
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="hidden md:flex fixed top-6 right-6 z-50 w-10 h-10 rounded-full bg-gray-900 items-center justify-center text-white text-sm font-semibold cursor-pointer shadow-lg hover:shadow-xl transition-shadow"
                    >
                        {getInitials()}
                    </motion.div>
                    {children}
                </div>
            </div>
        </div>
    )
}

export default DashboardLayout
