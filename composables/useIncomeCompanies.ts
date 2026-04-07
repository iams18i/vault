export type IncomeCompanyRow = {
  id: string
  name: string
}

export function useIncomeCompanies() {
  const auth = useAuth()
  const key = computed(
    () => `income-companies:${auth.currentVaultId.value ?? 'none'}`,
  )
  return useAsyncData(
    key,
    () => {
      if (!auth.currentVaultId.value) return Promise.resolve([])
      const api = useApiFetch()
      return api<IncomeCompanyRow[]>('/api/companies')
    },
    { server: false, watch: [key] },
  )
}
