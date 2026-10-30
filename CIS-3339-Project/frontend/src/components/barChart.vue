<template>
  <div class="max-w-3xl mx-auto mt-6">
    <canvas
      ref="canvas"
      role="img"
      aria-label="Event attendance chart"
    ></canvas>
  </div>
</template>
<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);
const props = defineProps({
  label: { type: Array, default: () => [] },
  chartData: { type: Array, default: () => [] }
});
const canvas = ref(null);
let chart;
// Composition lifecycle owns the Chart instance; watchers keep async props current.
onMounted(() => {
  chart = new Chart(canvas.value, {
    type: 'bar',
    data: {
      labels: props.label,
      datasets: [{ data: props.chartData, borderWidth: 1 }]
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: 'Event attendance' },
        legend: { display: false }
      }
    }
  });
});
watch(
  () => [props.label, props.chartData],
  () => {
    if (chart) {
      chart.data.labels = props.label;
      chart.data.datasets[0].data = props.chartData;
      chart.update();
    }
  },
  { deep: true }
);
onBeforeUnmount(() => {
  chart?.destroy();
  chart = null;
});
</script>
