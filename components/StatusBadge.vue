<script setup lang="ts">
import { ORDER_STATUS_META, type OrderStatus } from '~/types/database.types'

const props = defineProps<{ status: OrderStatus }>()
const meta = computed(() => ORDER_STATUS_META[props.status])
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
    :class="meta.badge"
  >
    <span class="w-1.5 h-1.5 rounded-full" :class="meta.dot" />
    {{ meta.label }}
  </span>
</template>
