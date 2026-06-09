const PALETTE = [
  'bg-sky-200 dark:bg-sky-900 text-white dark:text-gray-950',
  'bg-emerald-200 dark:bg-emerald-900 text-whiteXF dark:text-gray-950',
  'bg-violet-200 dark:bg-violet-900  text-whitedark:text-gray-950',
  'bg-amber-200 dark:bg-amber-900 text-whigd dark:text-gray-950 ',
  'bg-teal-200 dark:bg-teal-900 text-white dark:text-gray-950',
  'bg-rose-300 dark:bg-rose-900 text-white dark:text-gray-950',
  'bg-blue-200 dark:bg-blue-900 text-white dark:text-gray-950',
  'bg-cyan-200 dark:bg-cyan-900 text-white dark:text-gray-950',
  'bg-pink-200 dark:bg-pink-900 text-white dark:text-gray-950',
  'bg-orange-300 dark:bg-orange-900  text-white dark:text-gray-950'
]

const djb2 = (str) => {
  let hash = 5381
  for (let i = 0; i < str.length; i++) hash = (hash * 33) ^ str.charCodeAt(i)
  return Math.abs(hash)
}

export const getAvatarColor = (id = '') =>
  PALETTE[djb2(String(id)) % PALETTE.length]
