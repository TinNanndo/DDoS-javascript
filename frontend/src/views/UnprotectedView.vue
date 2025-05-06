<template>
    <div>
      <h1>Nezaštićeni Server</h1>
      <p>Ovdje se simulira nezaštićeni server.</p>
      <button @click="sendRequest">Pošalji zahtjev</button>
      <p v-if="response">Odgovor: {{ response }}</p>
      <h3>Promet u stvarnom vremenu:</h3>
      <ul>
        <li v-for="log in logs" :key="log">{{ log }}</li>
      </ul>
    </div>
  </template>
  
  <script>
  import { ref, onMounted } from "vue";
  import axios from "axios";
  
  export default {
    setup() {
      const response = ref("");
      const logs = ref([]);
      const ws = new WebSocket("ws://localhost:8081");
  
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "unprotected") {
          logs.value.push(data.message);
        }
      };
  
      const sendRequest = async () => {
        try {
          const res = await axios.get("http://localhost:3000/unprotected");
          response.value = res.data;
        } catch (error) {
          response.value = "Greška";
        }
      };
  
      return { response, sendRequest, logs };
    },
  };
  </script>
  