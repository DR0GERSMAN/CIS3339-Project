import { describe, it, expect, vi, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { effectScope, nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import DataTable from '../src/components/DataTable.vue';
import { useApi } from '../src/composables/useApi';
import { useLoggedInUserStore } from '../src/store/loggedInUser';
import api, { normalizeApiError } from '../src/api/api';
import { routeAccess } from '../src/router';
const rows = Array.from({ length: 15 }, (_, i) => ({
  _id: String(i + 1),
  name: 'Row ' + String(i + 1).padStart(2, '0')
}));
afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});
it('shared table sorts three ways, pages 15 rows and resets after a search', async () => {
  const wrapper = mount(DataTable, {
    props: { columns: [{ key: 'name', label: 'Name' }], rows }
  });
  expect(wrapper.text()).toContain('Showing 1-10 of 15');
  await wrapper
    .findAll('button')
    .find((b) => b.text() === 'Next')
    .trigger('click');
  expect(wrapper.text()).toContain('Showing 11-15 of 15');
  await wrapper.find('th button').trigger('click');
  expect(wrapper.find('tbody tr').text()).toBe('Row 01');
  await wrapper.find('th button').trigger('click');
  expect(wrapper.find('tbody tr').text()).toBe('Row 15');
  await wrapper.find('th button').trigger('click');
  expect(wrapper.find('tbody tr').text()).toBe('Row 01');
  await wrapper.setProps({ rows: rows.slice(0, 2) });
  expect(wrapper.text()).toContain('Showing 1-2 of 2');
  expect(wrapper.findAll('tbody tr')).toHaveLength(2);
  await wrapper.setProps({ rows: [] });
  expect(wrapper.text()).toContain('No results');
  expect(wrapper.text()).toContain('Showing 0-0 of 0');
  wrapper.unmount();
});
it('table supports custom renderers and row activation', async () => {
  const w = mount(DataTable, {
    props: {
      columns: [{ key: 'name', label: 'Name', render: (v) => 'Custom ' + v }],
      rows: rows.slice(0, 1)
    }
  });
  await w.find('tbody button').trigger('click');
  expect(w.text()).toContain('Custom Row 01');
  expect(w.emitted('row-click')[0][0]._id).toBe('1');
  w.unmount();
});
it('useApi handles success, failure, retry and out-of-order responses', async () => {
  const scope = effectScope();
  let state;
  const fn = vi
    .fn()
    .mockResolvedValueOnce([1])
    .mockRejectedValueOnce(new Error('Server says no'))
    .mockResolvedValueOnce([2]);
  scope.run(() => (state = useApi(fn)));
  expect(state.data.value).toBeNull();
  const task = state.execute();
  expect(state.loading.value).toBe(true);
  await task;
  expect(state.data.value).toEqual([1]);
  expect(state.loading.value).toBe(false);
  await state.execute();
  expect(state.error.value).toBe('Server says no');
  await state.execute();
  expect(state.data.value).toEqual([2]);
  expect(state.error.value).toBeNull();
  scope.stop();
  const s = effectScope();
  let resolves = [];
  s.run(() => (state = useApi(() => new Promise((r) => resolves.push(r)))));
  const a = state.execute(),
    b = state.execute();
  resolves[1]('new');
  await b;
  resolves[0]('old');
  await a;
  expect(state.data.value).toBe('new');
  s.stop();
});
const jwt = (payload) =>
  btoa('{}') + '.' + btoa(JSON.stringify(payload)) + '.signature';
it('session restoration restores Pinia and Axios; expiry/corruption/logout clear both', () => {
  setActivePinia(createPinia());
  const user = useLoggedInUserStore();
  const token = jwt({
    exp: Math.floor(Date.now() / 1000) + 3600,
    role: 'editor',
    orgId: 'abc',
    name: 'admin'
  });
  localStorage.setItem('authToken', token);
  expect(user.restoreSession()).toBe(true);
  expect(user.role).toBe('editor');
  expect(api.defaults.headers.common.Authorization).toBe('Bearer ' + token);
  user.logout();
  expect(user.isLoggedIn).toBe(false);
  expect(api.defaults.headers.common.Authorization).toBeUndefined();
  expect(localStorage.getItem('authToken')).toBeNull();
  for (const invalid of [
    'bad',
    jwt({ exp: 1, role: 'editor' }),
    jwt({ exp: Math.floor(Date.now() / 1000) + 100, role: 'unknown' })
  ]) {
    localStorage.setItem('authToken', invalid);
    expect(user.restoreSession()).toBe(false);
    expect(user.isLoggedIn).toBe(false);
  }
});
it('route policy denies viewers editor forms and redirects logged-out users', () => {
  const route = {
    meta: { requiresAuth: true, requiresEditor: true },
    fullPath: '/clientform'
  };
  expect(routeAccess(route, { isLoggedIn: true, role: 'viewer' })).toEqual({
    path: '/'
  });
  expect(routeAccess(route, { isLoggedIn: true, role: 'editor' })).toBe(true);
  expect(routeAccess(route, { isLoggedIn: false })).toEqual({
    path: '/login',
    query: { redirect: '/clientform' }
  });
});
it('API error translation preserves backend text and distinguishes network errors', () => {
  expect(
    normalizeApiError({
      response: { status: 400, data: { error: 'Invalid phone' } }
    }).message
  ).toBe('Invalid phone');
  expect(normalizeApiError(new Error('Network Error')).message).toBe(
    'Unable to reach the server'
  );
});
