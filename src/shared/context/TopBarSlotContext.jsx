import { createContext, useContext, useState } from 'react'

/**
 * Lets any dashboard (patient, professional, admin) inject a ReactNode into
 * the layout's top bar — right beside the dark/light mode toggle — without
 * prop-drilling or DOM portals.
 *
 * Usage:
 *   // In a dashboard component (register on mount, clean up on unmount):
 *   const { setSlot } = useTopBarSlot()
 *   useEffect(() => {
 *     setSlot(<MyBell />)
 *     return () => setSlot(null)
 *   }, [deps])
 *
 *   // In DashboardLayout (render whatever was registered):
 *   const { slot } = useTopBarSlot()
 *   // ... <div>{slot}</div>
 */

const TopBarSlotContext = createContext({ slot: null, setSlot: () => {} })

export const TopBarSlotProvider = ({ children }) => {
  const [slot, setSlot] = useState(null)
  return (
    <TopBarSlotContext.Provider value={{ slot, setSlot }}>
      {children}
    </TopBarSlotContext.Provider>
  )
}

export const useTopBarSlot = () => useContext(TopBarSlotContext)
