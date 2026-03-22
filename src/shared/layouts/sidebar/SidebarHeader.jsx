import logoSymbol from '@/assets/SIMBOLO_LOGO_TOTALMENTE.png'

/**
 * SidebarHeader Component
 * Threads-style: centered logo mark only, no text, no toggle.
 */
const SidebarHeader = () => {
    return (
        <div className="h-16 flex items-center justify-center shrink-0">
            <img
                src={logoSymbol}
                alt="TotalMente"
                className="h-12 w-12 object-contain"
            />
        </div>
    )
}

export default SidebarHeader
