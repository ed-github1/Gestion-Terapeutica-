import { createContext, useContext } from 'react'
import { useDarkMode } from './hooks/useDarkMode'

const DarkModeContext = createContext({ dark: false, toggleDark: () => {} })

export const DarkModeProvider = ({ children }) => {
  const [dark, toggleDark] = useDarkMode('app-dark')
  return (
    <DarkModeContext.Provider value={{ dark, toggleDark }}>
      {children}
    </DarkModeContext.Provider>
  )
}

export const useDarkModeContext = () => useContext(DarkModeContext)
