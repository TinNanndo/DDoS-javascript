<template>
  <div id="app">
    <nav>
      <router-link to="/unprotected">Nezaštićeni Server</router-link> |
      <router-link to="/protected">Zaštićeni Server</router-link>
    </nav>
    <router-view />
  </div>
</template>

<style>
body {
  font-family: Arial, sans-serif;
  text-align: center;
  background-color: #f4f4f4;
  margin: 0;
  padding: 20px;
}
nav {
  background: #333;
  padding: 10px;
}
nav a {
  color: white;
  text-decoration: none;
  margin: 10px;
}
nav a:hover {
  text-decoration: underline;
}
</style>
