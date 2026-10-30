<template>
  <main class="flex flex-col md:flex-row">
    <div id="_container" class="w-full md:w-1/5 md:min-h-screen md:shrink-0">
      <header class="w-full">
        <section class="text-center">
          <img
            class="m-auto w-16 md:w-24"
            src="@/assets/DanPersona.svg"
            alt="Community center logo"
          />
        </section>
        <nav class="mt-4 md:mt-10">
          <ul class="flex flex-wrap gap-4 md:flex-col">
            <li>
              <router-link to="/"> Dashboard </router-link>
            </li>
            <li v-if="!user.isLoggedIn">
              <router-link to="/login"> Login </router-link>
            </li>
            <li
              v-if="user.isLoggedIn"
              @click.prevent="logout"
              style="cursor: pointer"
            >
              Logout
            </li>
            <li v-if="user.role === 'editor'">
              <router-link to="/clientform"> Client Intake Form </router-link>
            </li>
            <li v-if="user.role === 'editor'">
              <router-link to="/eventform"> Create Event </router-link>
            </li>
            <li v-if="user.role === 'editor'">
              <router-link to="/serviceform"> Create Service </router-link>
            </li>
            <li v-if="user.isLoggedIn">
              <router-link to="/findclient"> Find Client </router-link>
            </li>
            <li v-if="user.isLoggedIn">
              <router-link to="/findevents"> Find Event </router-link>
            </li>
            <li v-if="user.isLoggedIn">
              <router-link to="/findservice"> Find Service </router-link>
            </li>
          </ul>
        </nav>
      </header>
    </div>
    <div class="grow min-w-0 w-full md:w-4/5">
      <section
        class="justify-end items-center h-24 flex"
        style="background: linear-gradient(250deg, #c8102e 70%, #efecec 50.6%)"
      >
        <h1 class="mx-4 text-xl md:mr-20 md:text-3xl text-white">{{ orgName }}</h1>
      </section>
      <div>
        <router-view></router-view>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useLoggedInUserStore } from './store/loggedInUser';
import { getOrgName } from './api/api';
import { useToast } from 'vue-toastification';

const toast = useToast();
const user = useLoggedInUserStore();
// Composition API migration: ref replaces data(); onMounted replaces created for loading the organization.
const orgName = ref('Dataplatform');
const router = useRouter();
// Explicit handler replaces the previous Vuex logout code.
function logout() {
  user.logout();
  router.push('/login');
  toast.info('You have been logged out');
}

onMounted(async () => {
  try {
    orgName.value = await getOrgName();
  } catch (error) {
    toast.error(error?.message || 'Unable to load organization name.');
    console.error(error);
  }
});
</script>

<style scoped>
#_container {
  background-color: #c8102e;
  color: white;
  padding: 18px;
}
</style>
