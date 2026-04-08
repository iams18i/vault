<script setup lang="ts">
import { onKeyStroke } from '@vueuse/core'

import DatePickerField from '~/components/DatePickerField.vue'
import Kbd from '@/components/ui/kbd/Kbd.vue'
import KbdGroup from '@/components/ui/kbd/KbdGroup.vue'
import {
  VAT_OPTIONS,
  type VatSelectValue,
  previewNetVatFromGross,
  previewVatGross,
} from '~/constants/vat-pl'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  /** Target month as YYYY-MM */
  month: string
}>()

const emit = defineEmits<{
  saved: []
}>()

const api = useApiFetch()

const addFormErrors = ref<string[]>([])
const showAppleShortcut = ref(true)
const formVatSelect = ref<VatSelectValue>('23')
const amountBasis = ref<'net' | 'gross'>('net')

const form = reactive({
  invoiceNumber: '',
  vendor: '',
  description: '',
  netAmount: '',
  vatAmount: '',
  grossAmount: '',
  issueDate: '',
  dueDate: '',
  status: 'pending' as 'pending' | 'paid' | 'overdue',
  notes: '',
})

onMounted(() => {
  showAppleShortcut.value = /Mac|iPhone|iPod|iPad/i.test(navigator.userAgent)
})

onKeyStroke(
  (e) => e.key === 'Enter' && (e.metaKey || e.ctrlKey),
  (e) => {
    if (!open.value) return
    e.preventDefault()
    void submitAdd()
  },
)

function parseMoney(s: string): number | null {
  const t = String(s).trim().replace(',', '.')
  if (!t) return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

function recalcFromNet() {
  const n = parseMoney(form.netAmount)
  if (n == null || n < 0) {
    form.vatAmount = ''
    form.grossAmount = ''
    return
  }
  const { vat, gross } = previewVatGross(n, formVatSelect.value)
  form.vatAmount = vat.toFixed(2)
  form.grossAmount = gross.toFixed(2)
}

function recalcFromGross() {
  const g = parseMoney(form.grossAmount)
  if (g == null || g < 0) {
    form.netAmount = ''
    form.vatAmount = ''
    return
  }
  const { net, vat } = previewNetVatFromGross(g, formVatSelect.value)
  form.netAmount = net.toFixed(2)
  form.vatAmount = vat.toFixed(2)
}

watch([() => form.netAmount, formVatSelect], () => {
  if (amountBasis.value === 'net') recalcFromNet()
})

watch([() => form.grossAmount, formVatSelect], () => {
  if (amountBasis.value === 'gross') recalcFromGross()
})

watch(amountBasis, (b) => {
  if (b === 'net') recalcFromNet()
  else recalcFromGross()
})

function resetAddForm() {
  form.invoiceNumber = ''
  form.vendor = ''
  form.description = ''
  form.netAmount = ''
  form.vatAmount = ''
  form.grossAmount = ''
  form.issueDate = ''
  form.dueDate = ''
  form.status = 'pending'
  form.notes = ''
  formVatSelect.value = '23'
  amountBasis.value = 'net'
  addFormErrors.value = []
}

function applyFinalDerive() {
  if (amountBasis.value === 'net') recalcFromNet()
  else recalcFromGross()
}

function collectAddFormErrors(): string[] {
  applyFinalDerive()
  const errs: string[] = []
  const gross = parseMoney(form.grossAmount)
  if (gross == null || gross <= 0)
    errs.push(
      'Podaj dodatnią kwotę (netto lub brutto — reszta przeliczy się).',
    )
  const net = parseMoney(form.netAmount)
  const vat = parseMoney(form.vatAmount)
  if (net != null && net < 0) errs.push('Netto nie może być ujemne.')
  if (vat != null && vat < 0) errs.push('VAT nie może być ujemny.')
  return errs
}

async function submitAdd() {
  const errs = collectAddFormErrors()
  addFormErrors.value = errs
  if (errs.length) return
  applyFinalDerive()
  try {
    await api('/api/invoices', {
      method: 'POST',
      body: {
        month: props.month,
        grossAmount: form.grossAmount,
        netAmount: form.netAmount || '0',
        vatAmount: form.vatAmount || '0',
        invoiceNumber: form.invoiceNumber.trim() || null,
        vendor: form.vendor.trim() || null,
        description: form.description.trim() || null,
        issueDate: form.issueDate || null,
        dueDate: form.dueDate || null,
        status: form.status,
        notes: form.notes.trim() || null,
      },
    })
    resetAddForm()
    open.value = false
    emit('saved')
  } catch (e: unknown) {
    const fe = e as { data?: { message?: string; statusMessage?: string } }
    const msg = fe.data?.message ?? fe.data?.statusMessage
    addFormErrors.value = [
      typeof msg === 'string' && msg.trim()
        ? msg
        : 'Nie udało się zapisać. Spróbuj ponownie.',
    ]
  }
}

watch(open, (v) => {
  if (v) {
    addFormErrors.value = []
    resetAddForm()
  }
})
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-lg">
      <form @submit.prevent="submitAdd">
        <DialogHeader>
          <DialogTitle>Nowa faktura</DialogTitle>
          <DialogDescription>
            Kwoty w miesiącu {{ month }}. Netto albo brutto — reszta zależy od
            stawki VAT.
          </DialogDescription>
        </DialogHeader>
        <div
          v-if="addFormErrors.length"
          class="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
          aria-live="polite"
        >
          <ul class="list-inside list-disc space-y-1">
            <li v-for="(msg, i) in addFormErrors" :key="i">{{ msg }}</li>
          </ul>
        </div>
        <div class="grid gap-4 py-2">
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="grid gap-2">
              <Label for="inv-add-vendor">Kontrahent</Label>
              <Input id="inv-add-vendor" v-model="form.vendor" />
            </div>
            <div class="grid gap-2">
              <Label for="inv-add-nr">Nr faktury</Label>
              <Input id="inv-add-nr" v-model="form.invoiceNumber" />
            </div>
            <div class="grid gap-2 sm:col-span-2">
              <Label>Kwota — podstawa</Label>
              <div class="flex flex-wrap gap-2">
                <Button
                  type="button"
                  :variant="amountBasis === 'net' ? 'default' : 'outline'"
                  size="sm"
                  @click="amountBasis = 'net'"
                >
                  Netto
                </Button>
                <Button
                  type="button"
                  :variant="amountBasis === 'gross' ? 'default' : 'outline'"
                  size="sm"
                  @click="amountBasis = 'gross'"
                >
                  Brutto
                </Button>
              </div>
            </div>
            <div class="grid gap-2">
              <Label for="inv-add-vat-rate">Stawka VAT</Label>
              <Select v-model="formVatSelect">
                <SelectTrigger id="inv-add-vat-rate">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="o in VAT_OPTIONS"
                    :key="o.value"
                    :value="o.value"
                  >
                    {{ o.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="grid gap-2">
              <Label for="inv-add-net">Netto (PLN)</Label>
              <Input
                id="inv-add-net"
                v-model="form.netAmount"
                type="text"
                inputmode="decimal"
                :readonly="amountBasis === 'gross'"
                :class="
                  amountBasis === 'gross'
                    ? 'bg-muted/50 text-muted-foreground'
                    : ''
                "
              />
            </div>
            <div class="grid gap-2">
              <Label for="inv-add-vat">VAT (PLN)</Label>
              <Input
                id="inv-add-vat"
                v-model="form.vatAmount"
                type="text"
                inputmode="decimal"
                readonly
                class="bg-muted/50 text-muted-foreground"
              />
            </div>
            <div class="grid gap-2">
              <Label for="inv-add-gross">Brutto (PLN)</Label>
              <Input
                id="inv-add-gross"
                v-model="form.grossAmount"
                type="text"
                inputmode="decimal"
                :readonly="amountBasis === 'net'"
                :class="
                  amountBasis === 'net'
                    ? 'bg-muted/50 text-muted-foreground'
                    : ''
                "
              />
            </div>
            <div class="grid min-w-0 gap-2">
              <Label for="inv-add-issue">Data wystawienia</Label>
              <DatePickerField
                id="inv-add-issue"
                v-model="form.issueDate"
                trigger-class="w-full"
              />
            </div>
            <div class="grid min-w-0 gap-2">
              <Label for="inv-add-due">Termin płatności</Label>
              <DatePickerField
                id="inv-add-due"
                v-model="form.dueDate"
                trigger-class="w-full"
              />
            </div>
            <div class="grid gap-2 sm:col-span-2">
              <Label for="inv-add-desc">Opis</Label>
              <Input id="inv-add-desc" v-model="form.description" />
            </div>
            <div class="grid gap-2">
              <Label>Status</Label>
              <Select v-model="form.status">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Oczekuje</SelectItem>
                  <SelectItem value="paid">Opłacona</SelectItem>
                  <SelectItem value="overdue">Po terminie</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="grid gap-2 sm:col-span-2">
              <Label for="inv-add-notes">Notatki</Label>
              <Input id="inv-add-notes" v-model="form.notes" />
            </div>
          </div>
        </div>
        <DialogFooter class="mt-6 gap-2 pt-2">
          <Button type="button" variant="outline" @click="open = false">
            Anuluj
          </Button>
          <Button type="submit" aria-keyshortcuts="Meta+Enter Control+Enter">
            <span class="inline-flex items-center justify-center gap-2">
              Dodaj
              <KbdGroup
                class="pointer-events-none hidden sm:inline-flex"
                aria-hidden="true"
              >
                <template v-if="showAppleShortcut">
                  <Kbd>⌘</Kbd>
                  <span class="text-inherit text-xs font-medium">+</span>
                  <Kbd>Enter</Kbd>
                </template>
                <template v-else>
                  <Kbd>Ctrl</Kbd>
                  <span class="text-inherit text-xs font-medium">+</span>
                  <Kbd>Enter</Kbd>
                </template>
              </KbdGroup>
            </span>
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
