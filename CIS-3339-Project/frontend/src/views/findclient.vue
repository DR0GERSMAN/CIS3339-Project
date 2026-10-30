<!-- This view displays a list of clients. The user can search for clients, and click on a client to redirect to another component to view that client's information -->
<template>
  <main>
    <div>
      <!--Header-->
      <h1
        class="font-bold text-4xl text-red-700 tracking-widest text-center mt-10"
      >
        Find Client
      </h1>
    </div>
    <div class="px-10 pt-20">
      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10"
      >
        <!--Search Client By selection-->
        <h2 class="text-2xl font-bold">Search Client By</h2>
        <!-- Displays Client Name search field -->
        <div class="flex flex-col">
          <select
            aria-label="Search field"
            class="rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            v-model="searchBy"
          >
            <option value="Client Name">Client Name</option>
            <option value="Client Number">Client Number</option>
          </select>
        </div>
        <!--Input box for searching by Client First Name-->
        <div class="flex flex-col" v-if="searchBy === 'Client Name'">
          <label class="block">
            <input
              type="text"
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              v-model="firstName"
              v-on:keyup.enter="handleSubmitForm"
              placeholder="Enter first name"
            />
          </label>
        </div>
        <!--Input box for searching by Client Last Name-->
        <div class="flex flex-col" v-if="searchBy === 'Client Name'">
          <label class="block">
            <input
              type="text"
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              v-model="lastName"
              v-on:keyup.enter="handleSubmitForm"
              placeholder="Enter last name"
            />
          </label>
        </div>
        <!-- Displays Client Number search field -->
        <div class="flex flex-col" v-if="searchBy === 'Client Number'">
          <input
            class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            type="text"
            v-model="phoneNumber"
            v-on:keyup.enter="handleSubmitForm"
            placeholder="Enter Client Phone Number"
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
          <!--Search Client button-->
          <button
            class="bg-red-700 text-white rounded"
            @click="handleSubmitForm"
            type="submit"
          >
            Search Client
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
import { getClients, searchClients } from '../api/api';
import { useApi } from '../composables/useApi';
import { formatDate } from '../utils/formatDate';
import DataTable from '../components/DataTable.vue';
// Reactive form state replaces data(); useApi owns loading, data, errors and retry.
const initial = { searchBy: '', firstName: '', lastName: '', phoneNumber: '' };
const state = reactive({ ...initial });
const { searchBy, firstName, lastName, phoneNumber } = toRefs(state);
const query = ref(null);
const router = useRouter();
const { data, loading, error, execute } = useApi(() =>
  query.value ? searchClients(query.value) : getClients()
);
const columns = [
  { label: 'First name', key: 'firstName' },
  { label: 'Last name', key: 'lastName' },
  { label: 'Phone', key: 'phoneNumber.primary' }
];
function loadData() {
  Object.assign(state, initial);
  query.value = null;
  execute();
}
function handleSubmitForm() {
  if (state.searchBy === 'Client Name')
    query.value = {
      searchBy: 'name',
      firstName: state.firstName,
      lastName: state.lastName
    };
  else if (state.searchBy === 'Client Number')
    query.value = { searchBy: 'number', phoneNumber: state.phoneNumber };
  else return;
  execute();
}
function openRow(row) {
  router.push({ name: 'clientdetails', params: { id: row._id } });
}
// onMounted replaces the former mounted/loadData component lifecycle.
onMounted(loadData);
</script>
