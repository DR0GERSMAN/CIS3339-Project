<template>
  <main class="p-10">
    <h1 class="text-3xl font-bold text-center">Welcome</h1>
    <form class="max-w-sm mx-auto mt-8 space-y-5" @submit.prevent="submit">
      <label class="block"
        >Username<input
          v-model="username"
          autocomplete="username"
          required
          class="block w-full rounded border-gray-300"
      /></label>
      <label class="block"
        >Password<input
          v-model="password"
          type="password"
          autocomplete="current-password"
          required
          class="block w-full rounded border-gray-300"
      /></label>
      <p v-if="error" role="alert" class="text-red-700">{{ error }}</p>
      <button
        class="bg-red-700 text-white rounded px-5 py-2 disabled:opacity-50"
        :disabled="loading"
      >
        {{ loading ? 'Signing in...' : 'Login' }}
      </button>
    </form>
  </main>
</template>
<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useLoggedInUserStore } from '../store/loggedInUser';
// Refs replace data(); setup bindings are available directly in the template.
const username = ref(''),
  password = ref(''),
  error = ref(''),
  loading = ref(false);
const store = useLoggedInUserStore();
const route = useRoute(),
  router = useRouter();
async function submit() {
  loading.value = true;
  error.value = '';
  try {
    await store.login(username.value, password.value);
    const dest = route.query.redirect;
    await router.push(
      typeof dest === 'string' && dest.startsWith('/') && !dest.startsWith('//')
        ? dest
        : '/'
    );
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}
</script>
