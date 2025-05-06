<template>
    <div>
      <h1>Zaštićeni Server</h1>
      <p>Ovdje se simulira zaštićeni server s rate limitingom.</p>
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
        if (data.type === "protected") {
          logs.value.push(data.message);
        }
      };
  
      const sendRequest = async () => {
        try {
          const res = await axios.get("http://localhost:3000/protected");
          response.value = res.data;
        } catch (error) {
          response.value = "Previše zahtjeva! Pokušaj kasnije.";
        }
      };
  
      return { response, sendRequest, logs };
    },
  };
  </script>
  