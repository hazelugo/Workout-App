<template>
  <div
    style="
      min-height: 100vh;
      background: oklch(8% 0.012 45);
      color: #e8e8e8;
      font-family: Georgia, serif;
      padding-bottom: 60px;
    "
  >
    <!-- Nav -->
    <nav style="display: flex; border-bottom: 1px solid oklch(15% 0.008 45)">
      <RouterLink to="/" class="nav-link">Program</RouterLink>
      <RouterLink to="/custom" class="nav-link">Custom</RouterLink>
    </nav>

    <RouterView />
  </div>
</template>

<style>
button,
input,
select,
textarea {
  font-family: Georgia, serif;
}
</style>

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
  background: oklch(11.5% 0.008 45);
  border-bottom-color: #e8e8e8;
  color: #e8e8e8;
}
</style>
