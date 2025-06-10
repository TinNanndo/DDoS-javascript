<template>
  <div class="protected-view">
    <h1>Zaštićeni Server</h1>
    <p class="description">
      Ovaj server koristi rate limiting i druge mjere zaštite protiv DDoS napada.
      Dopušteno je maksimalno 5 zahtjeva u sekundi po IP adresi.
    </p>

    <div class="actions">
    <button @click="sendRequest" class="primary-button">Pošalji jedan zahtjev</button>
    <button @click="sendHeavyRequest" class="heavy-button">Pošalji težak zahtjev</button>
    <button @click="startStressTest" :disabled="isStressTesting" class="stress-button">
      {{ isStressTesting ? 'Testiranje u tijeku...' : 'Pokreni stress test' }}
    </button>
    <button @click="stopStressTest" :disabled="!isStressTesting" class="stop-button">
      Zaustavi test
    </button>
  </div>

    <div class="stats-container">
      <div class="stats-box">
        <h3>Statistika</h3>
        <div class="stat-item">
          <span>Uspješni zahtjevi:</span>
          <span class="stat-value success">{{ successCount }}</span>
        </div>
        <div class="stat-item">
          <span>Blokirani zahtjevi:</span>
          <span class="stat-value blocked">{{ blockedCount }}</span>
        </div>
        <div class="stat-item">
          <span>Postotak uspješnosti:</span>
          <span class="stat-value">{{ successRate }}%</span>
        </div>
      </div>

      <div class="response-box" v-if="lastResponse">
        <h3>Zadnji odgovor:</h3>
        <pre>{{ JSON.stringify(lastResponse, null, 2) }}</pre>
        <div class="processing-time" v-if="lastResponse.processingTime">
          Vrijeme obrade: <span>{{ lastResponse.processingTime }}</span>
        </div>
      </div>
    </div>

    <div class="logs-container">
      <h3>Aktivnost servera u stvarnom vremenu:</h3>
      <div class="logs">
        <div 
          v-for="(log, index) in logs" 
          :key="index" 
          :class="['log-item', log.type]"
        >
          <div class="time">{{ formatTime(log.timestamp) }}</div>
          <div class="message">
            <span class="type-badge" :class="log.type">{{ log.type }}</span>
            {{ log.message }} 
            <span v-if="log.processingTime">({{ log.processingTime }}ms)</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, onUnmounted } from "vue";
import axios from "axios";

export default {
  setup() {
    const lastResponse = ref(null);
    const logs = ref([]);
    const successCount = ref(0);
    const blockedCount = ref(0);
    const isStressTesting = ref(false);
    let stressTestInterval = null;
    let ws = null;

    const successRate = computed(() => {
      const total = successCount.value + blockedCount.value;
      if (total === 0) return 0;
      return Math.round((successCount.value / total) * 100);
    });

    const formatTime = (timestamp) => {
      const date = new Date(timestamp);
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}.${date.getMilliseconds().toString().padStart(3, '0')}`;
    };

    const connectWebSocket = () => {
      ws = new WebSocket("ws://localhost:8082");
      
      ws.onopen = () => {
        addLog({
          type: "system",
          message: "WebSocket povezan s protected serverom",
          timestamp: Date.now()
        });
      };

      ws.onclose = () => {
        addLog({
          type: "system",
          message: "WebSocket veza zatvorena",
          timestamp: Date.now()
        });
      };

      ws.onerror = (error) => {
        console.error("WebSocket greška:", error);
        addLog({
          type: "error",
          message: "WebSocket greška",
          timestamp: Date.now()
        });
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        addLog(data);
        
        if (data.type === "blocked") {
          blockedCount.value++;
        }
        
        if (data.type === "stats") {
          // Ažuriranje statistike ako server šalje skupne podatke
        }
      };
    };

    const addLog = (log) => {
      logs.value.unshift(log);
      if (logs.value.length > 100) {
        logs.value.pop();
      }
    };

    // Ažurirana funkcija za slanje zahtjeva
    const sendRequest = async () => {
      try {
        const startTime = Date.now();
        
        console.log("Šaljem zahtjev na zaštićeni server...");
        
        // Korištenje proxy postavki iz vite.config.js
        const res = await axios.get("/api/protected", {
          timeout: 5000
        });
        
        const endTime = Date.now();
        lastResponse.value = res.data;
        successCount.value++;
        
        addLog({
          type: "success",
          message: `Zahtjev uspješno obrađen (${endTime - startTime}ms)`,
          timestamp: Date.now()
        });
      } catch (error) {
        console.error("Detalji greške:", error);
        
        // Poboljšano praćenje grešaka
        if (error.code) {
          console.error("Error code:", error.code);
        }
        
        if (error.response) {
          console.error("Error response:", error.response.status, error.response.data);
        }
        
        if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
          lastResponse.value = { 
            status: "error", 
            message: "Server nije dostupan ili nije pokrenut"
          };
          
          addLog({
            type: "error",
            message: "Server nije dostupan - provjerite je li pokrenut",
            timestamp: Date.now()
          });
        } else if (error.response?.status === 429) {
          blockedCount.value++;
          lastResponse.value = error.response.data;
          
          addLog({
            type: "blocked",
            message: "Zahtjev blokiran: previše zahtjeva",
            timestamp: Date.now()
          });
        } else {
          lastResponse.value = error.response?.data || { 
            status: "error", 
            message: `Greška pri slanju zahtjeva: ${error.message}`
          };
          
          addLog({
            type: "error",
            message: `Greška: ${error.message}`,
            timestamp: Date.now()
          });
        }
      }
    };

    // Dodajemo funkciju za slanje zahtjeva na "heavy" endpoint
    const sendHeavyRequest = async () => {
      try {
        const startTime = Date.now();
        
        console.log("Šaljem zahtjev na zaštićeni heavy endpoint...");
        
        const res = await axios.get("/api/heavy-protected", {
          timeout: 10000  // Dulji timeout za težak zahtjev
        });
        
        const endTime = Date.now();
        lastResponse.value = res.data;
        successCount.value++;
        
        addLog({
          type: "success",
          message: `Heavy zahtjev uspješno obrađen (${endTime - startTime}ms)`,
          timestamp: Date.now()
        });
      } catch (error) {
        // Slična obrada greške kao u sendRequest
        console.error("Detalji greške za heavy zahtjev:", error);
        
        if (error.response?.status === 429) {
          blockedCount.value++;
          lastResponse.value = error.response.data;
          
          addLog({
            type: "blocked",
            message: "Heavy zahtjev blokiran: previše zahtjeva",
            timestamp: Date.now()
          });
        } else {
          lastResponse.value = error.response?.data || { 
            status: "error", 
            message: `Greška pri slanju heavy zahtjeva: ${error.message}`
          };
          
          addLog({
            type: "error",
            message: `Greška s heavy zahtjevom: ${error.message}`,
            timestamp: Date.now()
          });
        }
      }
    };

    const startStressTest = () => {
      isStressTesting.value = true;
      stressTestInterval = setInterval(() => {
        sendRequest();
      }, 100); // Šalje zahtjev svakih 100ms (10 zahtjeva po sekundi)
    };

    const stopStressTest = () => {
      isStressTesting.value = false;
      clearInterval(stressTestInterval);
    };

    onMounted(() => {
      connectWebSocket();
      
      // Inicijalno dodajemo informativnu poruku
      addLog({
        type: "system",
        message: "Spremno za testiranje zaštićenog servera",
        timestamp: Date.now()
      });
    });

    onUnmounted(() => {
      if (ws) ws.close();
      if (stressTestInterval) clearInterval(stressTestInterval);
    });

    return { 
      lastResponse, 
      logs, 
      sendRequest,
      sendHeavyRequest,
      startStressTest, 
      stopStressTest, 
      isStressTesting,
      successCount,
      blockedCount,
      successRate,
      formatTime
    };
  }
};
</script>

<style scoped>
.protected-view {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.description {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 20px;
}

.actions {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

button {
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
}

.primary-button {
  background-color: #4caf50;
  color: white;
}

.heavy-button {
  background-color: #9c27b0;
  color: white;
}

.stress-button {
  background-color: #ff9800;
  color: white;
}

.stop-button {
  background-color: #f44336;
  color: white;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.stats-container {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.stats-box, .response-box {
  flex: 1;
  padding: 15px;
  border-radius: 5px;
  background-color: #f5f5f5;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.stat-value {
  font-weight: bold;
}

.stat-value.success {
  color: #4caf50;
}

.stat-value.blocked {
  color: #f44336;
}

.processing-time {
  margin-top: 10px;
  font-style: italic;
}

.processing-time span {
  font-weight: bold;
}

pre {
  background-color: #f0f0f0;
  padding: 10px;
  border-radius: 5px;
  overflow: auto;
  max-height: 200px;
}

.logs-container {
  margin-top: 20px;
}

.logs {
  height: 300px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 10px;
  background-color: #fafafa;
}

.log-item {
  padding: 8px;
  margin-bottom: 8px;
  border-left: 4px solid #ddd;
  background-color: white;
  display: flex;
  border-radius: 3px;
}

.log-item .time {
  min-width: 110px;
  color: #666;
  font-family: monospace;
}

.log-item .message {
  flex: 1;
}

.type-badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.8em;
  margin-right: 8px;
  color: white;
  font-weight: bold;
}

.log-item.protected, .type-badge.protected {
  background-color: #4caf50;
}

.log-item.blocked, .type-badge.blocked {
  background-color: #f44336;
}

.log-item.stats, .type-badge.stats {
  background-color: #2196f3;
}

.log-item.heavy-protected, .type-badge.heavy-protected {
  background-color: #9c27b0;
}

.log-item.system, .type-badge.system {
  background-color: #607d8b;
}

.log-item.error, .type-badge.error {
  background-color: #d32f2f;
}

.log-item.success, .type-badge.success {
  background-color: #388e3c;
}
</style>