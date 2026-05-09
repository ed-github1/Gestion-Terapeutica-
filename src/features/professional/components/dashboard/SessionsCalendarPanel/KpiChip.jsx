export const KpiChipSkeleton = () => (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl px-3 pt-2.5 pb-3 animate-pulse w-full flex flex-col gap-1.5">
        <div className="h-2.5 w-16 bg-gray-200 dark:bg-gray-600 rounded-full" />
        <div className="h-6 w-12 bg-gray-200 dark:bg-gray-600 rounded" />
    </div>
)

const KpiChip = ({ value, label, trend, trendPos, Icon, iconColor = 'text-gray-400' }) => (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl px-3 pt-2.5 pb-3 w-full flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
                {Icon && <Icon size={12} className={iconColor} strokeWidth={2.5} />}
                <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 tracking-wide uppercase">{label}</span>
            </div>
            {trend != null && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    trendPos
                        ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-50 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400'
                }`}>
                    {trendPos ? '↑' : '↓'}{Math.abs(trend)}%
                </span>
            )}
        </div>
        <p className="text-[22px] font-black text-gray-900 dark:text-white leading-none tabular-nums tracking-tight">{value}</p>
    </div>
)

export default KpiChip
