const express = require("express");
const cors = require("cors");
const WebSocket = require("ws");
const rateLimit = require("express-rate-limit");

const app = express();
app.use(cors());

// WebSocket server za praćenje prometa
const wss = new WebSocket.Server({ port: 8081 });

function broadcast(data) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

app.get('/', (req, res) => {
    res.send('Radi')
});

// Nezaštićeni endpoint (ranjiv na DDoS)
app.get("/unprotected", (req, res) => {
  broadcast({ type: "unprotected", message: "Zahtjev primljen" });
  res.send("Nezaštićeni server: odgovoreno");
});

// Zaštićeni endpoint (ograničenje zahtjeva)
const limiter = rateLimit({
  windowMs: 1000,
  max: 5,
  message: "Previše zahtjeva, pokušajte kasnije."
});

app.get("/protected", limiter, (req, res) => {
  broadcast({ type: "protected", message: "Zahtjev primljen" });
  res.send("Zaštićeni server: odgovoreno");
});

// Pokretanje servera
const PORT = 3000;
app.listen(PORT, () => console.log(`Server radi na http://localhost:${PORT}`));
