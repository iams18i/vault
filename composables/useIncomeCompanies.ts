export type IncomeCompanyRow = {
  id: number
  name: string
}

export function useIncomeCompanies() {
  return useAsyncData('income-companies', () =>
    $fetch<IncomeCompanyRow[]>('/api/companies'),
  )
}
