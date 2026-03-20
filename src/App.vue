<template>
  <div
    style="
      min-height: 100vh;
      background: #0a0a0a;
      color: #e8e8e8;
      font-family: Georgia, serif;
      padding-bottom: 60px;
    "
  >
    <!-- Nav -->
    <nav style="display: flex; border-bottom: 1px solid #1a1a1a">
      <RouterLink to="/" class="nav-link">Program</RouterLink>
      <RouterLink to="/custom" class="nav-link">Custom</RouterLink>
    </nav>

    <RouterView />
  </div>
</template>

<style scoped>
.nav-link {
  flex: 1;
  padding: 12px 8px;
  background: transparent;
  border-bottom: 2px solid transparent;
  color: #777;
  font-size: 11px;
  letter-spacing: 2px;
  text-transform: uppercase;
  text-align: center;
  text-decoration: none;
  display: block;
  font-family: Georgia, serif;
  transition: color 0.15s;
}

.nav-link:focus-visible {
  outline: 2px solid #e8e8e8;
  outline-offset: -2px;
}

.nav-link.router-link-exact-active {
  background: #111;
  border-bottom-color: #e8e8e8;
  color: #e8e8e8;
}
</style>
