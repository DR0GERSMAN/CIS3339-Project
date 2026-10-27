import { createApp, markRaw } from 'vue';
import router from './router';
import App from './App.vue';
import './index.css';
import Toast from 'vue-toastification';
import 'vue-toastification/dist/index.css';
import { createPinia } from 'pinia';
import { useLoggedInUserStore } from './store/loggedInUser';

const app = createApp(App);
const pinia = createPinia();

pinia.use(({ store }) => {
  store.$router = markRaw(router);
});

app.use(pinia);
app.use(router);

const options = {
  position: 'bottom-right'
};
app.use(Toast, options);

const userStore = useLoggedInUserStore();
userStore.restoreSession();

app.mount('#app');
