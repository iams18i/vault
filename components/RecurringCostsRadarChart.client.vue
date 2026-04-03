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

/** Fallbacks = current `.dark` chart tokens from `assets/css/main.css` */
const FALLBACK = {
  chart1: 'oklch(0.6959 0.1491 162.4796)',
  chart2: 'oklch(0.3717 0.0392 257.287)',
  popover: 'oklch(0.1663 0.0262 269.3709)',
  foreground: 'oklch(0.9683 0.0069 247.8956)',
  border: 'oklch(0.2795 0.0368 260.031)',
  mutedFg: 'oklch(0.7107 0.0351 256.7878)',
} as const

function themeVar(name: string, fallback: string) {
  if (typeof document === 'undefined') return fallback
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

function resolveChartTheme() {
  return {
    c1: themeVar('--chart-1', FALLBACK.chart1),
    c2: themeVar('--chart-2', FALLBACK.chart2),
    tooltipBg: themeVar('--popover', FALLBACK.popover),
    tooltipFg: themeVar('--popover-foreground', FALLBACK.foreground),
    tooltipBorder: themeVar('--border', FALLBACK.border),
    legendFg: themeVar('--muted-foreground', FALLBACK.mutedFg),
    axisFg: themeVar('--muted-foreground', FALLBACK.mutedFg),
    line: themeVar('--border', FALLBACK.border),
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
  const t = resolveChartTheme()

  const fullNames = [...categories]

  option.value = {
    backgroundColor: 'transparent',
    animationDuration: 600,
    animationDurationUpdate: 0,
    tooltip: {
      trigger: 'item',
      confine: true,
      transitionDuration: 0,
      backgroundColor: t.tooltipBg,
      borderColor: t.tooltipBorder,
      borderWidth: 1,
      padding: 10,
      textStyle: {
        color: t.tooltipFg,
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
      textStyle: { color: t.legendFg, fontSize: 11 },
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
        color: t.axisFg,
        fontSize: 11,
        distance: 10,
      },
      splitLine: {
        lineStyle: { color: t.line },
      },
      splitArea: { show: false },
      axisLine: {
        lineStyle: { color: t.line },
      },
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: normAmt,
            name: 'Kwota (PLN)',
            areaStyle: { color: t.c1, opacity: 0.6 },
            lineStyle: { width: 2, color: t.c1 },
          },
          {
            value: normCnt,
            name: 'Liczba pozycji',
            areaStyle: { color: t.c2, opacity: 1 },
            lineStyle: { width: 2, color: t.c2 },
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
