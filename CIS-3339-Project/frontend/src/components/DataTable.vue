<template>
  <div class="overflow-x-auto">
    <table class="min-w-full shadow-md rounded">
      <thead class="bg-gray-100">
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            class="p-3 text-left"
            :aria-sort="
              sortKey === col.key
                ? direction === 1
                  ? 'ascending'
                  : 'descending'
                : 'none'
            "
          >
            <button
              class="font-bold focus:ring-2 focus:ring-red-700"
              @click="sort(col.key)"
            >
              {{ col.label }}
              {{ sortKey === col.key ? (direction === 1 ? '▲' : '▼') : '' }}
            </button>
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-300">
        <tr v-for="row in visible" :key="row._id" class="hover:bg-gray-50">
          <td
            v-for="(col, index) in columns"
            :key="col.key"
            class="p-3 text-left"
          >
            <button
              v-if="index === 0"
              class="underline focus:ring-2 focus:ring-red-700"
              @click="$emit('row-click', row)"
            >
              <RenderCell :col="col" :row="row" />
            </button>
            <RenderCell v-else :col="col" :row="row" />
          </td>
        </tr>
        <tr v-if="!rows.length">
          <td :colspan="columns.length" class="p-5 text-center">No results</td>
        </tr>
      </tbody>
    </table>
    <div class="flex justify-between items-center gap-3 mt-4">
      <span
        >Showing {{ rows.length ? start + 1 : 0 }}-{{
          Math.min(start + pageSize, rows.length)
        }}
        of {{ rows.length }}</span
      >
      <div>
        <button
          class="border rounded px-3 py-1 mr-2 disabled:opacity-40"
          :disabled="page <= 1"
          @click="page--"
        >
          Previous
        </button>
        <span>Page {{ page }} of {{ pages }}</span
        ><button
          class="border rounded px-3 py-1 ml-2 disabled:opacity-40"
          :disabled="page >= pages"
          @click="page++"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>
<script setup>
import { computed, ref, watch, defineComponent, h } from 'vue';
const props = defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, required: true }
});
defineEmits(['row-click']);
// Sort and page derived rows without mutating the server response.
const page = ref(1),
  sortKey = ref(null),
  direction = ref(0),
  pageSize = 10;
const value = (row, key) => key.split('.').reduce((a, k) => a?.[k], row);
function sort(key) {
  if (sortKey.value !== key) {
    sortKey.value = key;
    direction.value = 1;
  } else if (direction.value === 1) direction.value = -1;
  else {
    sortKey.value = null;
    direction.value = 0;
  }
  page.value = 1;
}
const sorted = computed(() => {
  if (!sortKey.value) return props.rows;
  return [...props.rows].sort((a, b) => {
    const x = value(a, sortKey.value),
      y = value(b, sortKey.value);
    const compare =
      typeof x === 'number' && typeof y === 'number'
        ? x - y
        : String(x ?? '').localeCompare(String(y ?? ''), undefined, {
            numeric: true
          });
    return compare * direction.value;
  });
});
const pages = computed(() =>
  Math.max(1, Math.ceil(props.rows.length / pageSize))
);
const start = computed(() => (page.value - 1) * pageSize);
const visible = computed(() =>
  sorted.value.slice(start.value, start.value + pageSize)
);
// A new search dataset resets paging so an old page never displays stale rows.
watch(
  () => props.rows,
  () => {
    page.value = 1;
  }
);
const RenderCell = defineComponent({
  props: ['col', 'row'],
  setup(p) {
    return () =>
      p.col.render
        ? p.col.render(value(p.row, p.col.key), p.row)
        : h('span', String(value(p.row, p.col.key) ?? ''));
  }
});
</script>
