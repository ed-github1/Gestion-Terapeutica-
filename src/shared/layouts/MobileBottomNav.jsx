import { motion } from 'motion/react'
import {
  Home, Calendar, BookOpen,
  LayoutGrid, Users, UserCircle,
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

const NavBtn = ({ path, exact, label, Icon, badge }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const active = exact ? location.pathname === path : location.pathname.includes(path.split('/').pop())
  return (
    <motion.button
      whileTap={{ scale: 0.88 }}
      onClick={() => navigate(path)}
      className="relative flex-1 flex items-center justify-center py-4 group"
    >
      <Icon
        className={active
          ? 'text-[#0075C9] dark:text-white'
          : 'text-gray-400 dark:text-gray-600 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-150'}
        style={{ width: 26, height: 26 }}
        strokeWidth={active ? 2.5 : 1.6}
      />
      {badge && <span className="absolute top-3 right-[calc(50%-16px)] w-1.5 h-1.5 bg-red-500 rounded-full" />}
    </motion.button>
  )
}

const MobileBottomNav = ({ userRole }) => {
  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#0f1623] border-t border-gray-200 dark:border-transparent"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center">
        {userRole === 'professional' ? (
          <>
            <NavBtn path={`/dashboard/${userRole}`} exact label="INICIO" Icon={LayoutGrid} />
            <NavBtn path={`/dashboard/${userRole}/patients`} label="PACIENTES" Icon={Users} />
            <NavBtn path={`/dashboard/${userRole}/appointments`} label="AGENDA" Icon={Calendar} />
            <NavBtn path={`/dashboard/${userRole}/profile`} label="PERFIL" Icon={UserCircle} />
          </>
        ) : (
          <>
            <NavBtn path={`/dashboard/${userRole}`} exact label="INICIO" Icon={Home} />
            <NavBtn path={`/dashboard/${userRole}/appointments`} label="CITAS" Icon={Calendar} />
            <NavBtn path={`/dashboard/${userRole}/diary`} label="DIARIO" Icon={BookOpen} />
            <NavBtn path={`/dashboard/${userRole}/profile`} label="PERFIL" Icon={UserCircle} />
          </>
        )}
      </div>
    </motion.div>
  )
}

export default MobileBottomNav
