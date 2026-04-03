import { cn } from '@/lib/utils'

const DEFAULT_MAX_PX = 240

/** Shared styling + height sync for single-line-growing textareas (cap + scroll). */
export function useAutoGrowTextarea(maxPx: number = DEFAULT_MAX_PX) {
  const textareaClass = cn(
    'placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input min-h-16 max-h-60 w-full min-w-0 resize-none rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
    'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
    'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
  )

  function resize(el: HTMLTextAreaElement | null) {
    if (!el) return
    el.style.height = 'auto'
    const h = Math.min(el.scrollHeight, maxPx)
    el.style.height = `${h}px`
    el.style.overflowY = el.scrollHeight > maxPx ? 'auto' : 'hidden'
  }

  function onInput(e: Event) {
    resize(e.target as HTMLTextAreaElement)
  }

  return { textareaClass, resize, onInput, maxPx }
}
