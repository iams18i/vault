<script setup lang="ts">
import DatePickerField from '~/components/DatePickerField.vue'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  /** Target month as YYYY-MM */
  month: string
}>()

const emit = defineEmits<{
  saved: []
}>()

const api = useApiFetch()

const form = reactive({
  name: '',
  amount: '',
  category: '',
  expenseDate: '',
  notes: '',
})

function resetAddForm() {
  form.name = ''
  form.amount = ''
  form.category = ''
  form.expenseDate = ''
  form.notes = ''
}

watch(open, (v) => {
  if (v) resetAddForm()
})

async function submit() {
  if (!form.name || !form.amount) return
  await api('/api/monthly-expenses', {
    method: 'POST',
    body: {
      month: props.month,
      name: form.name,
      amount: form.amount,
      category: form.category || null,
      expenseDate: form.expenseDate || null,
      notes: form.notes || null,
    },
  })
  resetAddForm()
  open.value = false
  emit('saved')
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-lg">
      <form @submit.prevent="submit">
        <DialogHeader>
          <DialogTitle>Nowy wydatek</DialogTitle>
          <DialogDescription>
            Wpis zostanie dodany do miesiąca: {{ month }}.
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-2">
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="grid gap-2 sm:col-span-2">
              <Label for="exp-add-name">Nazwa</Label>
              <Input id="exp-add-name" v-model="form.name" />
            </div>
            <div class="grid gap-2">
              <Label for="exp-add-amount">Kwota</Label>
              <Input
                id="exp-add-amount"
                v-model="form.amount"
                type="number"
                step="0.01"
              />
            </div>
            <div class="grid gap-2">
              <Label>Kategoria</Label>
              <CategoryCombobox v-model="form.category" />
            </div>
            <div class="grid gap-2 sm:col-span-2">
              <Label for="exp-add-date">Data</Label>
              <DatePickerField
                id="exp-add-date"
                v-model="form.expenseDate"
                placeholder="Brak daty"
              />
            </div>
            <div class="grid gap-2 sm:col-span-2">
              <Label for="exp-add-notes">Notatki</Label>
              <Input id="exp-add-notes" v-model="form.notes" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" @click="open = false">
            Anuluj
          </Button>
          <Button type="submit">Dodaj</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
