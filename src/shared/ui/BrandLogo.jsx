import logoSymbol from '@/assets/SIMBOLO_LOGO_TOTALMENTE.png'
import logoFull from '@/assets/LOGOTIPO_TOTALMENTE.png'

/**
 * BrandLogo Component
 *
 * @param {Object}  props
 * @param {boolean} [props.symbolOnly] - Show only the symbol image (for auth pages)
 * @param {boolean} [props.fullLogo]   - Show the full color logotype image (for footer / hero)
 * @param {string}  [props.size]       - Symbol/full logo size class, e.g. 'h-16 w-16' (default: 'h-9 w-9')
 * @param {string}  [props.className]  - Extra classes for the wrapper
 */
const BrandLogo = ({ symbolOnly = false, fullLogo = false, size = 'h-9 w-9', className = '' }) => {
    if (symbolOnly) {
        return (
            <img
                src={logoSymbol}
                alt="TotalMente"
                className={`${size} object-contain ${className}`}
            />
        )
    }

    if (fullLogo) {
        return (
            <img
                src={logoFull}
                alt="TotalMente"
                className={`${size} object-contain ${className}`}
            />
        )
    }

    return (
        <div className={`flex items-center gap-2.5 ${className}`}>
            <img src={logoSymbol} alt="" className="h-9 w-9 object-contain shrink-0" />
            <div className="flex flex-col leading-tight">
                <span className="text-[17px] text-[#4A5568] tracking-tight">
                    <span className="font-normal">Total</span><span className="font-bold">Mente</span>
                </span>
                <span className="text-[8px] font-semibold text-gray-500 tracking-wider uppercase">
                    Acompaña·Transforma·Gestiona
                </span>
            </div>
        </div>
    )
}

export default BrandLogo
