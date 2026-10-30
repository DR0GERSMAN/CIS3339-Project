<!-- This view shows a list of services. Users can search for services and click on a service to be redirected to another component that displays the service's details -->
<template>
  <main>
    <div>
      <!--Header-->
      <h1
        class="font-bold text-4xl text-red-700 tracking-widest text-center mt-10"
      >
        Find Services
      </h1>
    </div>
    <div class="px-10 pt-20">
      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10"
      >
        <h2 class="text-2xl font-bold">Search Service By</h2>
        <!-- Displays Service Name and Description selection -->
        <div class="flex flex-col">
          <select
            aria-label="Search field"
            class="rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            v-model="searchBy"
          >
            <option value="Service Name">Service Name</option>
            <option value="Service Description">Service Description</option>
          </select>
        </div>
        <!--Display service name search field-->
        <div class="flex flex-col" v-if="searchBy === 'Service Name'">
          <label class="block">
            <input
              type="text"
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              v-model="name"
              v-on:keyup.enter="handleSubmitForm"
              placeholder="Enter service name"
            />
          </label>
        </div>
        <!--Display service description search field-->
        <div class="flex flex-col" v-if="searchBy === 'Service Description'">
          <label class="block">
            <input
              type="text"
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              v-model="description"
              v-on:keyup.enter="handleSubmitForm"
              placeholder="Enter service description"
            />
          </label>
        </div>
      </div>
      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10"
      >
        <div></div>
        <div></div>
        <div class="mt-5 grid-cols-2">
          <!--Clear Search button-->
          <button
            class="mr-10 border border-red-700 bg-white text-red-700 rounded"
            @click="loadData"
            type="submit"
          >
            Clear Search
          </button>
          <!--Search Service button-->
          <button
            class="bg-red-700 text-white rounded"
            @click="handleSubmitForm"
            type="submit"
          >
            Search Service
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
import { getServices, searchServices } from '../api/api';
import { useApi } from '../composables/useApi';
import { formatDate } from '../utils/formatDate';
import DataTable from '../components/DataTable.vue';
// Reactive form state replaces data(); useApi owns loading, data, errors and retry.
const initial = { searchBy: '', name: '', description: '' };
const state = reactive({ ...initial });
const { searchBy, name, description } = toRefs(state);
const query = ref(null);
const router = useRouter();
const { data, loading, error, execute } = useApi(() =>
  query.value ? searchServices(query.value) : getServices()
);
const columns = [
  { label: 'Service name', key: 'name' },
  { label: 'Description', key: 'description' },
  { label: 'Status', key: 'status' }
];
function loadData() {
  Object.assign(state, initial);
  query.value = null;
  execute();
}
function handleSubmitForm() {
  if (state.searchBy === 'Service Name')
    query.value = { searchBy: 'name', name: state.name };
  else if (state.searchBy === 'Service Description')
    query.value = { searchBy: 'description', description: state.description };
  else return;
  execute();
}
function openRow(row) {
  router.push({ name: 'servicedetails', params: { id: row._id } });
}
// onMounted replaces the former mounted/loadData component lifecycle.
onMounted(loadData);
</script>
