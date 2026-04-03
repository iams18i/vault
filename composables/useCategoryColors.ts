export type ExpenseCategoryRow = {
  id: number
  name: string
  color: string | null
}

/** Combobox / lists: name + optional swatch color */
export type CategoryListItem = { name: string; color: string | null }

export function useExpenseCategories() {
  return useAsyncData('expense-categories', () =>
    $fetch<ExpenseCategoryRow[]>('/api/categories'),
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
