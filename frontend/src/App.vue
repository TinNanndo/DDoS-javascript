<template>
  <div id="app">
    <header>
      <nav>
        <router-link to="/unprotected" class="nav-link">
          <span class="icon">🔓</span>
          <span>Nezaštićeni Server</span>
        </router-link>
        <router-link to="/protected" class="nav-link">
          <span class="icon">🔒</span>
          <span>Zaštićeni Server</span>
        </router-link>
      </nav>
    </header>
    <main>
      <router-view />
    </main>
  </div>
</template>

<script>
export default {
  computed: {
    currentYear() {
      return new Date().getFullYear();
    }
  }
};
</script>

<style>
body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 0;
  background-color: #f4f4f4;
  color: #333;
}

#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

header {
  background: linear-gradient(135deg, #422c50, #8a34db);
  color: white;
  border-radius: 1rem;
  margin: 1rem;
  padding: 1rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

nav {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 10px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  margin: 0 auto;
  max-width: 600px;
}

.nav-link {
  color: white;
  text-decoration: none;
  padding: 10px 20px;
  border-radius: 6px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.nav-link.router-link-active {
  background-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
}

.icon {
  font-size: 1.2rem;
}

main {
  flex: 1;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

@media (max-width: 600px) {
  nav {
    flex-direction: column;
    gap: 10px;
  }
  
  .nav-link {
    width: 100%;
    justify-content: center;
  }
}
</style>