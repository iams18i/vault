export function useCommandPalette() {
  const open = useState('command-palette-open', () => false)

  function openPalette() {
    open.value = true
  }

  function closePalette() {
    open.value = false
  }

  function togglePalette() {
    open.value = !open.value
  }

  return { open, openPalette, closePalette, togglePalette }
}
