<script setup lang="ts">
import type { EChartsOption } from 'echarts'

/**
 * Mirrors shadcn/recharts radar (multiple series): PolarGrid + angle axis + two filled radars
 * (desktop opacity 0.6, mobile solid). Data: amounts vs. item counts per category, normalized
 * to 0–100 for a shared scale; tooltips show real PLN and integer counts.
 */
const props = defineProps<{
  categories: string[]
  amounts: number[]
  counts: number[]
  formatValue: (n: number) => string
}>()

const PALETTE_FALLBACK = [
  'oklch(0.646 0.222 41.116)',
  'oklch(0.6 0.118 184.704)',
] as const

function resolveColors() {
  if (typeof document === 'undefined') {
    return { c1: PALETTE_FALLBACK[0]!, c2: PALETTE_FALLBACK[1]! }
  }
  const c1 = getComputedStyle(document.documentElement).getPropertyValue('--chart-1').trim()
  const c2 = getComputedStyle(document.documentElement).getPropertyValue('--chart-2').trim()
  return {
    c1: c1 || PALETTE_FALLBACK[0]!,
    c2: c2 || PALETTE_FALLBACK[1]!,
  }
}

const option = shallowRef<EChartsOption>({})

function rebuild() {
  const { categories, amounts, counts } = props
  if (
    !categories.length
    || categories.length !== amounts.length
    || amounts.length !== counts.length
  ) {
    option.value = {}
    return
  }

  const maxAmt = Math.max(...amounts, 1)
  const maxCnt = Math.max(...counts, 1)
  const normAmt = amounts.map((a) => (a / maxAmt) * 100)
  const normCnt = counts.map((c) => (c / maxCnt) * 100)
  const { c1, c2 } = resolveColors()

  const fullNames = [...categories]

  option.value = {
    backgroundColor: 'transparent',
    animationDuration: 600,
    animationDurationUpdate: 0,
    tooltip: {
      trigger: 'item',
      confine: true,
      transitionDuration: 0,
      backgroundColor: 'oklch(0.22 0 0)',
      borderColor: 'oklch(1 0 0 / 12%)',
      borderWidth: 1,
      padding: 10,
      textStyle: {
        color: 'oklch(0.985 0 0)',
        fontSize: 12,
      },
      formatter: (p: unknown) => {
        const param = p as { name?: string; value?: number[] }
        const label = param.name ?? ''
        const vals = param.value ?? []
        const lines: string[] = [label]
        fullNames.forEach((cat, i) => {
          if (label === 'Kwota (PLN)') {
            lines.push(`${cat}: ${props.formatValue(amounts[i]!)}`)
          } else if (label === 'Liczba pozycji') {
            lines.push(`${cat}: ${counts[i]!}`)
          } else {
            const n = vals[i]
            if (n !== undefined) lines.push(`${cat}: ${n}`)
          }
        })
        return lines.join('<br/>')
      },
    },
    legend: {
      bottom: 4,
      data: ['Kwota (PLN)', 'Liczba pozycji'],
      textStyle: { color: 'oklch(0.708 0 0)', fontSize: 11 },
      itemGap: 20,
      selectedMode: false,
    },
    radar: {
      center: ['50%', '46%'],
      radius: '58%',
      indicator: categories.map((n) => ({
        name: n.length > 12 ? `${n.slice(0, 10)}…` : n,
        max: 100,
      })),
      shape: 'polygon',
      splitNumber: 5,
      axisName: {
        color: 'oklch(0.708 0 0)',
        fontSize: 11,
        distance: 10,
      },
      splitLine: {
        lineStyle: { color: 'oklch(1 0 0 / 12%)' },
      },
      splitArea: { show: false },
      axisLine: {
        lineStyle: { color: 'oklch(1 0 0 / 12%)' },
      },
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: normAmt,
            name: 'Kwota (PLN)',
            areaStyle: { color: c1, opacity: 0.6 },
            lineStyle: { width: 2, color: c1 },
          },
          {
            value: normCnt,
            name: 'Liczba pozycji',
            areaStyle: { color: c2, opacity: 1 },
            lineStyle: { width: 2, color: c2 },
          },
        ],
        symbol: 'circle',
        symbolSize: 4,
        emphasis: {
          disabled: true,
        },
      },
    ],
  }
}

watch(
  () => [props.categories, props.amounts, props.counts],
  () => rebuild(),
  { deep: true },
)

onMounted(() => {
  rebuild()
})
</script>

<template>
  <VChart class="mx-auto aspect-square h-[250px] w-full max-h-[250px] max-w-[250px]" :option="option" autoresize />
</template>
