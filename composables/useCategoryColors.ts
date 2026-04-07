export type ExpenseCategoryRow = {
  id: string
  name: string
  color: string | null
}

/** Combobox / lists: name + optional swatch color */
export type CategoryListItem = { name: string; color: string | null }

export function useExpenseCategories() {
  const auth = useAuth()
  const key = computed(
    () => `expense-categories:${auth.currentVaultId.value ?? 'none'}`,
  )
  return useAsyncData(
    key,
    () => {
      if (!auth.currentVaultId.value) return Promise.resolve([])
      const api = useApiFetch()
      return api<ExpenseCategoryRow[]>('/api/categories')
    },
    { server: false, watch: [key] },
  )
}

export function categoryColorForName(
  list: ExpenseCategoryRow[] | null | undefined,
  name: string | null | undefined,
): string | null {
  const n = name?.trim()
  if (!n || !list?.length) return null
  return list.find((c) => c.name === n)?.color ?? null
}
