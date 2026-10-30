import { ref, onScopeDispose } from 'vue';
// One state machine for async requests; only the latest execution may update state.
export function useApi(apiCall) {
  const data = ref(null),
    loading = ref(false),
    error = ref(null);
  let version = 0;
  onScopeDispose(() => {
    version++;
  });
  async function execute(...args) {
    const current = ++version;
    loading.value = true;
    error.value = null;
    data.value = null;
    try {
      const result = await apiCall(...args);
      if (current === version) data.value = result;
      return result;
    } catch (e) {
      if (current === version) error.value = e.message;
      return null;
    } finally {
      if (current === version) loading.value = false;
    }
  }
  return { data, loading, error, execute };
}
