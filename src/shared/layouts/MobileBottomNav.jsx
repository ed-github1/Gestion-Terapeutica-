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
      className="relative flex-1 flex flex-col items-center justify-center py-2 gap-0.5 group"
    >
      <Icon
        className={active
          ? 'text-[#0075C9] dark:text-white'
          : 'text-gray-400 dark:text-gray-600 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-150'}
        style={{ width: 24, height: 24 }}
        strokeWidth={active ? 2.5 : 1.6}
      />
      <span className={`text-[10px] font-medium leading-none transition-colors duration-150 ${
        active ? 'text-[#0075C9] dark:text-white' : 'text-gray-400 dark:text-gray-600 group-hover:text-gray-600 dark:group-hover:text-gray-300'
      }`}>
        {label}
      </span>
      {badge && <span className="absolute top-2 right-[calc(50%-14px)] w-1.5 h-1.5 bg-red-500 rounded-full" />}
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
            <NavBtn path={`/dashboard/${userRole}`} exact label="Inicio" Icon={LayoutGrid} />
            <NavBtn path={`/dashboard/${userRole}/patients`} label="Pacientes" Icon={Users} />
            <NavBtn path={`/dashboard/${userRole}/appointments`} label="Agenda" Icon={Calendar} />
            <NavBtn path={`/dashboard/${userRole}/profile`} label="Perfil" Icon={UserCircle} />
          </>
        ) : (
          <>
            <NavBtn path={`/dashboard/${userRole}`} exact label="Inicio" Icon={Home} />
            <NavBtn path={`/dashboard/${userRole}/appointments`} label="Citas" Icon={Calendar} />
            <NavBtn path={`/dashboard/${userRole}/diary`} label="Diario" Icon={BookOpen} />
            <NavBtn path={`/dashboard/${userRole}/profile`} label="Perfil" Icon={UserCircle} />
          </>
        )}
      </div>
    </motion.div>
  )
}

export default MobileBottomNav
