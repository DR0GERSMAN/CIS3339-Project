import { defineStore } from 'pinia';
import { useToast } from 'vue-toastification';
import jwtDecode from 'jwt-decode';
import { loginUser, logoutUser, isTokenExpired } from '../api/api';

const toast = useToast();

export const useLoggedInUserStore = defineStore({
  id: 'loggedInUser',
  state: () => ({
    name: '',
    role: '',
    isLoggedIn: false
  }),
  actions: {
    restoreSession() {
      const token = localStorage.getItem('authToken');
      if (!token || isTokenExpired(token)) {
        logoutUser();
        this.name = '';
        this.role = '';
        this.isLoggedIn = false;
        return false;
      }

      try {
        const decodedToken = jwtDecode(token);
        this.name = decodedToken.name || '';
        this.role = decodedToken.role || '';
        this.isLoggedIn = true;
        return true;
      } catch {
        logoutUser();
        this.name = '';
        this.role = '';
        this.isLoggedIn = false;
        return false;
      }
    },
    async login(username, password) {
      try {
        const token = await loginUser(username, password);
        const decodedToken = jwtDecode(token);
        this.$patch({
          isLoggedIn: true,
          role: decodedToken.role || '',
          name: decodedToken.name || ''
        });
        this.$router.push('/');
        toast.success('Login successful!');
      } catch (error) {
        toast.error(error?.message || 'Login failed.');
      }
    },
    logout() {
      logoutUser();
      this.$patch({
        name: '',
        role: '',
        isLoggedIn: false
      });
      this.$router.push('/login');
      toast.info('You have been logged out!');
    }
  }
});
