import { motion, AnimatePresence } from 'motion/react'
import logoSymbol from '@/assets/SIMBOLO_LOGO_TOTALMENTE.png'

/**
 * SidebarHeader Component
 * Displays the branding and role-specific subtitle
 * Adapts to collapsed/expanded states with smooth animations
 * 
 * @param {Object} props
 * @param {boolean} props.isCollapsed - Whether sidebar is collapsed
 * @param {string} props.userRole - Current user role ('professional' or 'patient')
 */
const SidebarHeader = ({ isCollapsed, userRole }) => {

    return (
        <div className="h-20 px-4 flex items-center border-b border-white/50 bg-transparent">
            <AnimatePresence mode="wait">
                {!isCollapsed ? (
                    <motion.div
                        key="expanded"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="flex items-center gap-2.5"
                    >
                        <img src={logoSymbol} alt="" className="h-9 w-9 object-contain shrink-0" />
                        <div className="flex flex-col leading-tight">
                            <span className="text-[17px] text-[#4A5568] tracking-tight">
                                <span className="font-normal">Total</span><span className="font-bold">Mente</span>
                            </span>
                            <span className="text-[8px] font-semibold text-gray-500 tracking-wider uppercase">
                                Acompaña·Transforma·Gestiona
                            </span>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="collapsed"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="w-full flex items-center justify-center"
                    >
                        <img src={logoSymbol} alt="TotalMente" className="h-9 w-9 object-contain" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default SidebarHeader
