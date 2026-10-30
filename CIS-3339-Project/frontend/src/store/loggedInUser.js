import { defineStore } from 'pinia';
import { ref } from 'vue';
import jwtDecode from 'jwt-decode';
import { loginUser, logoutUser, setAuthHeader } from '../api/api';
// Setup store: state is explicit refs and restored before the router starts.
export const useLoggedInUserStore = defineStore('loggedInUser', () => {
  const name = ref(''),
    role = ref(''),
    isLoggedIn = ref(false);
  function clearSession() {
    logoutUser();
    name.value = '';
    role.value = '';
    isLoggedIn.value = false;
  }
  function apply(token) {
    const decoded = jwtDecode(token);
    if (
      typeof decoded.exp !== 'number' ||
      decoded.exp * 1000 <= Date.now() ||
      !['viewer', 'editor'].includes(decoded.role) ||
      !decoded.orgId
    )
      throw new Error('Invalid saved session');
    name.value = decoded.name || '';
    role.value = decoded.role;
    isLoggedIn.value = true;
    setAuthHeader(token);
  }
  function restoreSession() {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        clearSession();
        return false;
      }
      apply(token);
      return true;
    } catch {
      clearSession();
      return false;
    }
  }
  async function login(username, password) {
    const token = await loginUser(username, password);
    try {
      apply(token);
    } catch (error) {
      clearSession();
      throw error;
    }
  }
  function logout() {
    clearSession();
  }
  return {
    name,
    role,
    isLoggedIn,
    restoreSession,
    login,
    logout,
    clearSession
  };
});
