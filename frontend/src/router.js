import { createRouter, createWebHistory } from "vue-router";
import UnprotectedView from "./views/UnprotectedView.vue";
import ProtectedView from "./views/ProtectedView.vue";

const routes = [
  { path: "/unprotected", component: UnprotectedView },
  { path: "/protected", component: ProtectedView },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
