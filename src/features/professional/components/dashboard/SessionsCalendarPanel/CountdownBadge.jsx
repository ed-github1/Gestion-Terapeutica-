const CountdownBadge = ({ countdown, isNow, isImminent }) => {
    if (!countdown) return null
    const urgent = isNow || isImminent
    return (
        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
            urgent
                ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
                : 'bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400'
        }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${urgent ? 'bg-teal-400' : 'bg-sky-400'}`} />
            Próxima: {countdown}
        </span>
    )
}

export default CountdownBadge
