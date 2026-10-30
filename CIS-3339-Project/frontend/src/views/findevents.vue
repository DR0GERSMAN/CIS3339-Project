<!-- This view displays a list of events. Users can search for events, and click on an event to be redirected to another component to view that event's details -->
<template>
  <main>
    <div>
      <!--Header-->
      <h1
        class="font-bold text-4xl text-red-700 tracking-widest text-center mt-10"
      >
        List of Events
      </h1>
    </div>
    <div class="px-10 pt-20">
      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10"
      >
        <h2 class="text-2xl font-bold">Search Event By</h2>
        <!-- Displays Event Name or Event Date selection -->
        <div class="flex flex-col">
          <select
            aria-label="Search field"
            class="rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            v-model="searchBy"
          >
            <option value="Event Name">Event Name</option>
            <option value="Event Date">Event Date</option>
          </select>
        </div>
        <!--Displays event name search field-->
        <div class="flex flex-col" v-if="searchBy === 'Event Name'">
          <label class="block">
            <input
              type="text"
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              v-model="name"
              v-on:keyup.enter="handleSubmitForm"
              placeholder="Enter event name"
            />
          </label>
        </div>
        <!-- Displays event date search field -->
        <div class="flex flex-col" v-if="searchBy === 'Event Date'">
          <input
            class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            type="date"
            v-model="eventDate"
            v-on:keyup.enter="handleSubmitForm"
          />
        </div>
      </div>
      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10"
      >
        <div></div>
        <div></div>
        <!--Clear Search button-->
        <div class="mt-5 grid-cols-2">
          <button
            class="mr-10 border border-red-700 bg-white text-red-700 rounded"
            @click="loadData"
            type="submit"
          >
            Clear Search
          </button>
          <!--Search Event button-->
          <button
            class="bg-red-700 text-white rounded"
            @click="handleSubmitForm"
            type="submit"
          >
            Search Event
          </button>
        </div>
      </div>
    </div>

    <section class="p-8" aria-live="polite">
      <p v-if="loading" role="status">Loading...</p>
      <div v-else-if="error" role="alert" class="text-red-700">
        <p>{{ error }}</p>
        <button class="border rounded px-4 py-2 mt-3" @click="execute">
          Retry
        </button>
      </div>
      <DataTable
        v-else
        :columns="columns"
        :rows="data || []"
        @row-click="openRow"
      />
    </section>
  </main>
</template>
<script setup>
import { reactive, toRefs, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getEvents, searchEvents } from '../api/api';
import { useApi } from '../composables/useApi';
import { formatDate } from '../utils/formatDate';
import DataTable from '../components/DataTable.vue';
// Reactive form state replaces data(); useApi owns loading, data, errors and retry.
const initial = { searchBy: '', name: '', eventDate: '' };
const state = reactive({ ...initial });
const { searchBy, name, eventDate } = toRefs(state);
const query = ref(null);
const router = useRouter();
const { data, loading, error, execute } = useApi(() =>
  query.value ? searchEvents(query.value) : getEvents()
);
const columns = [
  { label: 'Event name', key: 'name' },
  { label: 'Date', key: 'date', render: formatDate },
  { label: 'Address', key: 'address.line1' }
];
function loadData() {
  Object.assign(state, initial);
  query.value = null;
  execute();
}
function handleSubmitForm() {
  if (state.searchBy === 'Event Name')
    query.value = { searchBy: 'name', name: state.name };
  else if (state.searchBy === 'Event Date')
    query.value = { searchBy: 'date', eventDate: state.eventDate };
  else return;
  execute();
}
function openRow(row) {
  router.push({ name: 'eventdetails', params: { id: row._id } });
}
// onMounted replaces the former mounted/loadData component lifecycle.
onMounted(loadData);
</script>
