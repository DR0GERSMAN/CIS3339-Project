import { createApp } from 'vue';
import { createPinia } from 'pinia';
import Toast from 'vue-toastification';
import 'vue-toastification/dist/index.css';
import './index.css';
import App from './App.vue';
import router from './router';
import { useLoggedInUserStore } from './store/loggedInUser';
import { setUnauthorizedHandler } from './api/api';
const app = createApp(App);
app.use(createPinia());
app.use(Toast, { position: 'bottom-right' });
// Restore both Pinia and Axios before initial route guards and data requests.
const user = useLoggedInUserStore();
user.restoreSession();
setUnauthorizedHandler(() => {
  user.clearSession();
  router.replace({
    path: '/login',
    query: { redirect: router.currentRoute.value.fullPath }
  });
});
app.use(router);
app.mount('#app');
