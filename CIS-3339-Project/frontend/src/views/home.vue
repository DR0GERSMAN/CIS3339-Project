<template>
  <main class="p-8 space-y-10">
    <h1 class="font-bold text-3xl text-center">Dashboard</h1>
    <section aria-live="polite">
      <h2 class="text-2xl mb-4">Recent event attendance</h2>
      <p v-if="attendanceLoading" role="status">Loading attendance...</p>
      <div v-else-if="attendanceError" role="alert">
        <p class="text-red-700">{{ attendanceError }}</p>
        <button class="border rounded px-4 py-2" @click="loadAttendance">
          Retry
        </button>
      </div>
      <p v-else-if="!attendance?.length">No events found.</p>
      <template v-else
        ><DataTable
          :rows="attendance"
          :columns="eventColumns"
          @row-click="openEvent" /><AttendanceChart
          :label="labels"
          :chart-data="counts"
      /></template>
    </section>
    <section aria-live="polite">
      <h2 class="text-2xl mb-4">Clients by ZIP code</h2>
      <p v-if="zipLoading" role="status">Loading clients...</p>
      <div v-else-if="zipError" role="alert">
        <p class="text-red-700">{{ zipError }}</p>
        <button class="border rounded px-4 py-2" @click="loadZips">
          Retry
        </button>
      </div>
      <p v-else-if="!zips?.length">No clients found.</p>
      <ZipChart v-else :label="zipLabels" :chart-data="zipCounts" />
    </section>
  </main>
</template>
<script setup>
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getAttendance, getClientsByZipCode } from '../api/api';
import { useApi } from '../composables/useApi';
import { formatDate } from '../utils/formatDate';
import AttendanceChart from '../components/barChart.vue';
import ZipChart from '../components/donutZipChart.vue';
import DataTable from '../components/DataTable.vue';
// Composition API migration: computed replaces computed options; onMounted replaces mounted.
// Each dataset has independent async state, so errors remain visible with empty results.
const {
  data: attendance,
  loading: attendanceLoading,
  error: attendanceError,
  execute: loadAttendance
} = useApi(getAttendance);
const {
  data: zips,
  loading: zipLoading,
  error: zipError,
  execute: loadZips
} = useApi(getClientsByZipCode);
const labels = computed(() =>
  (attendance.value || []).map((e) => `${e.name} (${formatDate(e.date)})`)
);
const counts = computed(() =>
  (attendance.value || []).map((e) => e.attendees.length)
);
const zipLabels = computed(() => (zips.value || []).map((e) => e._id));
const zipCounts = computed(() => (zips.value || []).map((e) => e.count));
const eventColumns = [
  { label: 'Event', key: 'name' },
  { label: 'Date', key: 'date', render: formatDate },
  { label: 'Attendees', key: 'attendees.length' }
];
const router = useRouter();
function openEvent(row) {
  router.push({ name: 'eventdetails', params: { id: row._id } });
}
onMounted(() => {
  loadAttendance();
  loadZips();
});
</script>
