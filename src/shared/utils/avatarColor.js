const PALETTE = [
  'bg-sky-200 dark:bg-sky-900 text-sky-700 dark:text-sky-300',
  'bg-emerald-200 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300',
  'bg-violet-200 dark:bg-violet-900 text-violet-700 dark:text-violet-300',
  'bg-amber-200 dark:bg-amber-900 text-amber-700 dark:text-amber-300',
  'bg-teal-200 dark:bg-teal-900 text-teal-700 dark:text-teal-300',
  'bg-rose-300 dark:bg-rose-900 text-rose-700 dark:text-rose-300',
  'bg-blue-200 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
  'bg-cyan-200 dark:bg-cyan-900 text-white dark:text-gray-900',
  'bg-pink-200 dark:bg-pink-900 text-pink-700 dark:text-pink-300',
  'bg-orange-300 dark:bg-orange-900 text-orange-700 dark:text-orange-300',
]

const djb2 = (str) => {
  let hash = 5381
  for (let i = 0; i < str.length; i++)
    hash = (hash * 33) ^ str.charCodeAt(i)
  return Math.abs(hash)
}

export const getAvatarColor = (id = '') =>
  PALETTE[djb2(String(id)) % PALETTE.length]
