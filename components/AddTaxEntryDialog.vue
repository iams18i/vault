<script setup lang="ts">
import { onKeyStroke } from '@vueuse/core'

import DatePickerField from '~/components/DatePickerField.vue'
import Kbd from '@/components/ui/kbd/Kbd.vue'
import KbdGroup from '@/components/ui/kbd/KbdGroup.vue'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  year: number
  /** Pre-fill month (1–12); defaults to current calendar month when dialog opens */
  initialMonth?: number
}>()

const emit = defineEmits<{
  saved: []
}>()

const api = useApiFetch()

const addFormErrors = ref<string[]>([])
const showAppleShortcut = ref(true)

const form = reactive({
  name: '',
  month: 1,
  amountDue: '',
  amountPaid: '0',
  dueDate: '',
  status: 'pending' as 'pending' | 'paid' | 'partial',
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

function resetAddForm() {
  form.name = ''
  form.month =
    props.initialMonth !== undefined
      ? props.initialMonth
      : new Date().getMonth() + 1
  form.amountDue = ''
  form.amountPaid = '0'
  form.dueDate = ''
  form.status = 'pending'
  form.notes = ''
  addFormErrors.value = []
}

function collectAddFormErrors(): string[] {
  const errs: string[] = []
  if (!form.name.trim()) errs.push('Podaj nazwę.')
  const due = String(form.amountDue).trim()
  if (!due) errs.push('Podaj kwotę należną.')
  else {
    const n = Number(due.replace(',', '.'))
    if (!Number.isFinite(n)) errs.push('Należne musi być liczbą.')
  }
  const m = Number(form.month)
  if (!Number.isInteger(m) || m < 1 || m > 12)
    errs.push('Miesiąc musi być liczbą od 1 do 12.')
  return errs
}

async function submitAdd() {
  const errs = collectAddFormErrors()
  addFormErrors.value = errs
  if (errs.length) return
  try {
    await api('/api/tax-entries', {
      method: 'POST',
      body: {
        name: form.name.trim(),
        year: props.year,
        month: form.month,
        amountDue: form.amountDue,
        amountPaid: form.amountPaid || '0',
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
          <DialogTitle>Nowy wpis</DialogTitle>
          <DialogDescription>
            Pozycja zostanie zapisana dla roku {{ year }}.
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
            <div class="grid gap-2 sm:col-span-2">
              <Label for="tax-add-name">Nazwa</Label>
              <Input
                id="tax-add-name"
                v-model="form.name"
                placeholder="np. ZUS, PIT"
              />
            </div>
            <div class="grid gap-2">
              <Label for="tax-add-month">Miesiąc (1–12)</Label>
              <Input
                id="tax-add-month"
                v-model.number="form.month"
                type="number"
                min="1"
                max="12"
              />
            </div>
            <div class="grid gap-2">
              <Label for="tax-add-due">Należne</Label>
              <Input
                id="tax-add-due"
                v-model="form.amountDue"
                type="number"
                step="0.01"
              />
            </div>
            <div class="grid gap-2">
              <Label for="tax-add-paid">Zapłacone</Label>
              <Input
                id="tax-add-paid"
                v-model="form.amountPaid"
                type="number"
                step="0.01"
              />
            </div>
            <div class="grid min-w-0 gap-2 sm:col-span-2">
              <Label for="tax-add-date">Termin</Label>
              <DatePickerField
                id="tax-add-date"
                v-model="form.dueDate"
                trigger-class="w-full"
              />
            </div>
            <div class="grid gap-2 sm:col-span-2">
              <Label>Status</Label>
              <Select v-model="form.status">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Oczekuje</SelectItem>
                  <SelectItem value="partial">Częściowo</SelectItem>
                  <SelectItem value="paid">Zapłacone</SelectItem>
                </SelectContent>
              </Select>
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
