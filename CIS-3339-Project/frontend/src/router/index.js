import { createRouter, createWebHistory } from 'vue-router';
import { useLoggedInUserStore } from '../store/loggedInUser';
const auth = { requiresAuth: true };
const editor = { requiresAuth: true, requiresEditor: true };
const routes = [
  { path: '/', component: () => import('../views/home.vue'), meta: auth },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/login.vue')
  },
  {
    path: '/clientform',
    name: 'clientform',
    component: () => import('../views/clientform.vue'),
    meta: editor
  },
  {
    path: '/findclient',
    name: 'findclient',
    component: () => import('../views/findclient.vue'),
    meta: auth
  },
  {
    path: '/clientdetails/:id',
    name: 'clientdetails',
    component: () => import('../views/clientdetails.vue'),
    meta: auth
  },
  {
    path: '/eventform',
    name: 'eventform',
    component: () => import('../views/eventform.vue'),
    meta: editor
  },
  {
    path: '/findevents',
    name: 'findevents',
    component: () => import('../views/findevents.vue'),
    meta: auth
  },
  {
    path: '/eventdetails/:id',
    name: 'eventdetails',
    component: () => import('../views/eventDetails.vue'),
    meta: auth
  },
  {
    path: '/serviceform',
    name: 'serviceform',
    component: () => import('../views/serviceform.vue'),
    meta: editor
  },
  {
    path: '/findservice',
    name: 'findservice',
    component: () => import('../views/findservice.vue'),
    meta: auth
  },
  {
    path: '/servicedetails/:id',
    name: 'servicedetails',
    component: () => import('../views/servicedetails.vue'),
    meta: auth
  },
  { path: '/:pathMatch(.*)*', component: () => import('../views/notfound.vue') }
];
export function routeAccess(to, user) {
  if (to.meta.requiresAuth && !user.isLoggedIn)
    return { path: '/login', query: { redirect: to.fullPath } };
  if (to.meta.requiresEditor && user.role !== 'editor') return { path: '/' };
  return true;
}
const router = createRouter({ history: createWebHistory(), routes });
router.beforeEach((to) => routeAccess(to, useLoggedInUserStore()));
export default router;
