import { useState } from 'react'
import MonthNav from './MonthNav'
import KpiChip, { KpiChipSkeleton } from './KpiChip'

const CalendarCardHeader = ({
    profile,
    calendarData,
    setCalendarMonth,
    kpis,
    kpisLoading = false,
    quickActionsSlot,
    onToday,
}) => {
    const [imageError, setImageError] = useState(false)

    const AvatarButton = ({ size = 'md' }) => {
        const sizeClass = size === 'sm' ? 'w-8 h-8 text-[10px]' : 'w-10 h-10 text-xs'

        return (
            <button
                onClick={profile.onNavigate}
                className={`${sizeClass} rounded-full bg-[#0075C9] flex items-center justify-center text-white font-bold shrink-0 hover:bg-gray-700 transition-colors overflow-hidden`}
                title="Ver Perfil"
            >
                {!imageError ? (
                    <img
                        src="/api/professional/me/picture"
                        alt={profile.name}
                        className="w-full h-full object-cover"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    profile.initials
                )}
            </button>
        )
    }

    return (
    <div className="border-b border-gray-200 dark:border-gray-700 shrink-0">

        {/* Mobile: avatar + name + month nav in one row */}
        <div className="flex md:hidden items-center justify-between px-3 pt-2 pb-1.5">
            <div className="flex items-center gap-2">
                <AvatarButton size="sm" />
                <div className="flex items-center gap-1.5">
                    <p className="text-[13px] font-bold text-gray-900 dark:text-gray-100 leading-none">{profile.name}</p>
                    {profile.isPro && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-[#0075C9] text-white uppercase tracking-wide leading-none">
                            Pro
                        </span>
                    )}
                </div>
            </div>
            <MonthNav calendarData={calendarData} setCalendarMonth={setCalendarMonth} inlineMode onToday={onToday} />
        </div>

        {/* Mobile KPIs: 2×2 */}
        {kpis?.length > 0 && (
            <div className="md:hidden px-3 pb-3">
                <div className="grid grid-cols-2 gap-2">
                    {kpisLoading
                        ? Array.from({ length: 4 }).map((_, i) => <KpiChipSkeleton key={i} />)
                        : kpis.map((k) => <KpiChip key={k.label} {...k} />)
                    }
                </div>
            </div>
        )}

        {/* md–lg: single row — avatar/name · KPIs · MonthNav */}
        <div className="hidden md:flex xl:hidden items-center gap-3 px-4 lg:px-5 pt-3 pb-3">
            <div className="flex items-center gap-2.5 shrink-0">
                <AvatarButton size="md" />
                <div>
                    <p className="text-[10px] text-gray-400 leading-none">{profile.greeting}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-[13px] font-bold text-gray-900 dark:text-gray-100 leading-tight whitespace-nowrap">{profile.name}</p>
                        {profile.isPro && (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-[#0075C9] text-white uppercase tracking-wide leading-none">
                                Pro
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {kpis?.length > 0 && (
                <div className="flex-1 grid grid-cols-4 gap-2 min-w-0">
                    {kpisLoading
                        ? Array.from({ length: 4 }).map((_, i) => <KpiChipSkeleton key={i} />)
                        : kpis.map((k) => <KpiChip key={k.label} {...k} />)
                    }
                </div>
            )}

            <div className="shrink-0">
                <MonthNav calendarData={calendarData} setCalendarMonth={setCalendarMonth} inlineMode onToday={onToday} />
            </div>
        </div>

        {/* Quick actions — all sizes below xl */}
        {quickActionsSlot && (
            <div className="xl:hidden px-3 md:px-4 lg:px-5 pb-3">
                {quickActionsSlot}
            </div>
        )}

        {/* xl: profile + month nav only (KPIs live in right-col stats bar) */}
        <div className="hidden xl:flex items-center justify-between px-5 pt-4 pb-3">
            <div className="flex items-center gap-2.5">
                <AvatarButton size="md" />
                <div>
                    <p className="text-[10px] text-gray-400 leading-none">{profile.greeting}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-[14px] font-bold text-gray-900 dark:text-gray-100 leading-tight">{profile.name}</p>
                        {profile.isPro && (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-[#0075C9] text-white uppercase tracking-wide leading-none">
                                Pro
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <MonthNav calendarData={calendarData} setCalendarMonth={setCalendarMonth} inlineMode onToday={onToday} />
        </div>

        {/* Quick actions — xl */}
        {quickActionsSlot && (
            <div className="hidden xl:block px-5 pb-3">
                {quickActionsSlot}
            </div>
        )}
    </div>
    )
}

export default CalendarCardHeader
