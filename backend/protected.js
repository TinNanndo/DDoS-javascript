const https = require('https');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const WebSocket = require("ws");

// Stvaranje Express aplikacije
const app = express();

// Ispravljena CORS konfiguracija
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Dopustite frontende
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Preflight zahtjevi za CORS
app.options('*', cors());

app.use(express.json());
app.use(helmet()); // Dodatna sigurnost za HTTP headere

// WebSocket server za praćenje prometa
const wss = new WebSocket.Server({ port: 8082 });

// Brojači zahtjeva i statistike
let requestCount = 0;
let blockedCount = 0;
let lastResetTime = Date.now();
const resetInterval = 5000; // 5 sekundi

function broadcast(data) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// Rate limiter - ograničava broj zahtjeva po IP adresi
const limiter = rateLimit({
  windowMs: 1000, // 1 sekunda
  max: 5, // maksimalno 5 zahtjeva po sekundi
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    blockedCount++;
    broadcast({ 
      type: "blocked", 
      ip: req.ip,
      timestamp: Date.now()
    });
    res.status(429).json({
      status: "error",
      message: "Previše zahtjeva. Molimo pokušajte ponovno kasnije."
    });
  }
});

// Globalni rate limiter za sve rute
app.use(limiter);

// Middleware koji broji i pokazuje trenutno opterećenje servera
app.use((req, res, next) => {
  requestCount++;
  
  // Resetiraj brojač svakih resetInterval milisekundi
  const now = Date.now();
  if (now - lastResetTime > resetInterval) {
    broadcast({ 
      type: "stats", 
      requests: requestCount,
      blocked: blockedCount,
      timeframe: resetInterval / 1000,
      timestamp: now
    });
    requestCount = 0;
    blockedCount = 0;
    lastResetTime = now;
  }
  
  next();
});

// Osnovna ruta
app.get('/', (req, res) => {
  res.send('Protected server je aktivan');
});

// Zaštićeni endpoint (s rate limit-om)
app.get("/protected", (req, res) => {
  const startTime = Date.now();
  
  // Simulacija intenzivnog računanja koje troši resurse
  let result = 0;
  for(let i = 0; i < 100000; i++) {
    result += Math.random() * Math.random();
  }
  
  const processingTime = Date.now() - startTime;
  
  broadcast({ 
    type: "protected", 
    message: "Zahtjev primljen", 
    processingTime: processingTime,
    timestamp: Date.now()
  });
  
  res.json({
    status: "success",
    message: "Zaštićeni server: odgovoreno",
    processingTime: processingTime + "ms"
  });
});

// Zaštićena verzija heavy endpoint-a
app.get("/heavy", (req, res) => {
  const startTime = Date.now();
  
  // Simulacija teške operacije
  let result = 0;
  for(let i = 0; i < 1000000; i++) {
    result += Math.sqrt(Math.random() * i);
  }
  
  const processingTime = Date.now() - startTime;
  
  broadcast({ 
    type: "heavy-protected", 
    message: "Težak zahtjev obrađen", 
    processingTime: processingTime,
    timestamp: Date.now()
  });
  
  res.json({
    status: "success",
    message: "Zaštićena teška operacija završena",
    processingTime: processingTime + "ms"
  });
});

// HTTPS konfiguracija
let options;
try {
  options = {
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert'),
  };
  console.log("Certifikati uspješno učitani!");
} catch (error) {
  console.error("Greška pri učitavanju certifikata:", error.message);
  process.exit(1); // Zaustavite server ako certifikati nisu dostupni
}

// Pokretanje HTTPS servera
const PORT = 3443;
https.createServer(options, app).listen(PORT, () => {
  console.log(`Zaštićeni HTTPS server pokrenut na https://localhost:${PORT}`);
  console.log(`- Osnovna ruta: https://localhost:${PORT}/`);
  console.log(`- Zaštićeni endpoint: https://localhost:${PORT}/protected`);
  console.log(`- Zaštićeni teški endpoint: https://localhost:${PORT}/heavy`);
  console.log(`WebSocket server za praćenje na portu 8082`);
});