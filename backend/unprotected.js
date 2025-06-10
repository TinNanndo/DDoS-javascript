const express = require("express");
const cors = require("cors");
const WebSocket = require("ws");

// Stvaranje Express aplikacije
const app = express();
app.use(cors());
app.use(express.json());

// WebSocket server za praćenje prometa
const wss = new WebSocket.Server({ port: 8081 });

// Brojač zahtjeva
let requestCount = 0;
let lastResetTime = Date.now();
const resetInterval = 5000; // 5 sekundi

function broadcast(data) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// Middleware koji broji i pokazuje trenutno opterećenje servera
app.use((req, res, next) => {
  requestCount++;
  
  // Resetiraj brojač svakih resetInterval milisekundi
  const now = Date.now();
  if (now - lastResetTime > resetInterval) {
    broadcast({ 
      type: "stats", 
      requests: requestCount, 
      timeframe: resetInterval / 1000,
      timestamp: now
    });
    requestCount = 0;
    lastResetTime = now;
  }
  
  next();
});

// Osnovna ruta
app.get('/', (req, res) => {
  res.send('Unprotected server je aktivan');
});

// Nezaštićeni endpoint (ranjiv na DDoS)
app.get("/unprotected", (req, res) => {
  // Simulacija opterećenja servera - malo usporava odgovor
  const startTime = Date.now();
  
  // Simulacija intenzivnog računanja koje troši resurse
  let result = 0;
  for(let i = 0; i < 100000; i++) {
    result += Math.random() * Math.random();
  }
  
  const processingTime = Date.now() - startTime;
  
  broadcast({ 
    type: "unprotected", 
    message: "Zahtjev primljen", 
    processingTime: processingTime,
    timestamp: Date.now()
  });
  
  res.json({
    status: "success",
    message: "Nezaštićeni server: odgovoreno",
    processingTime: processingTime + "ms"
  });
});

// Ruta koja simulira tešku operaciju (vrlo osjetljiva na DDoS)
app.get("/heavy", (req, res) => {
  const startTime = Date.now();
  
  // Simulacija vrlo teške operacije
  let result = 0;
  for(let i = 0; i < 5000000; i++) {
    result += Math.sqrt(Math.random() * i);
  }
  
  const processingTime = Date.now() - startTime;
  
  broadcast({ 
    type: "heavy", 
    message: "Težak zahtjev obrađen", 
    processingTime: processingTime,
    timestamp: Date.now()
  });
  
  res.json({
    status: "success",
    message: "Teška operacija završena",
    processingTime: processingTime + "ms"
  });
});

// Pokretanje servera
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Nezaštićeni server pokrenut na http://localhost:${PORT}`);
  console.log(`- Osnovna ruta: http://localhost:${PORT}/`);
  console.log(`- Nezaštićeni endpoint: http://localhost:${PORT}/unprotected`);
  console.log(`- Teški endpoint: http://localhost:${PORT}/heavy`);
  console.log(`WebSocket server za praćenje na portu 8081`);
});