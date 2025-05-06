# DDoS Simulacija i Zaštita

## Sadržaj
1. [Uvod](#uvod)
2. [Arhitektura sustava](#arhitektura-sustava)
3. [Komponente projekta](#komponente-projekta)
4. [Demonstracija](#demonstracija)
5. [Kod i implementacija](#kod-i-implementacija)
6. [Zaključak](#zaključak)

## Uvod

Ovaj projekt demonstrira kako DDoS napadi funkcioniraju i načine zaštite od njih. Projekt simulira:
- Nezaštićeni server podložan DDoS napadima
- Zaštićeni server s implementiranim rate limiting mehanizmom
- Alat za simulaciju DDoS napada
- Frontend sučelje za praćenje oba servera u stvarnom vremenu

## Arhitektura sustava

```
┌─────────────┐                ┌──────────────────┐
│             │                │                  │
│   Frontend  │◄───WebSocket───►    WebSocket     │
│   (Vue.js)  │                │     Server       │
│             │                │                  │
└──────┬──────┘                └──────────┬───────┘
       │                                  │
       │                                  │
       │                                  │
       │                          ┌───────▼───────┐
       │                          │               │
       │                          │  Express API  │
       └────────────HTTP─────────►│               │
                                  └───────┬───────┘
                                          │
                                          │
                                  ┌───────▼───────┐
                                  │               │
                                  │  Flood Tool   │
                                  │               │
                                  └───────────────┘
```

Sustav se sastoji od:
1. **Backend** (Express.js): 
   - Nezaštićeni endpoint (/unprotected)
   - Zaštićeni endpoint s rate limitingom (/protected)
   - WebSocket server za slanje real-time podataka

2. **Frontend** (Vue.js):
   - Stranica za nezaštićeni server
   - Stranica za zaštićeni server
   - WebSocket klijent za primanje real-time ažuriranja

3. **Simulacija napada**:
   - Flood.js - alat za slanje velikog broja zahtjeva

## Komponente projekta

### Backend (server.js)

Backend implementira dva endpointa:
- `/unprotected` - nema nikakvu zaštitu od prekomjernih zahtjeva
- `/protected` - implementira rate limiting (max 5 zahtjeva po sekundi)

WebSocket server emitira događaje o prometu na oba endpointa.

### Frontend (Vue.js)

Frontend ima dvije glavne stranice:
- `UnprotectedView.vue` - prikazuje stanje nezaštićenog servera
- `ProtectedView.vue` - prikazuje stanje zaštićenog servera

Obje stranice koriste WebSocket za primanje real-time informacija o prometu.

### Alat za DDoS napad (flood.js)

Jednostavan Node.js skripta koja šalje veliki broj zahtjeva na određeni endpoint.

## Demonstracija

### Korak 1: Pokretanje sustava

```bash
# Terminal 1 - pokretanje backend servera
cd backend
npm install
node server.js

# Terminal 2 - pokretanje frontend aplikacije
cd frontend
npm install
npm run serve

# Terminal 3 - za pokretanje simulacije napada
cd backend
node flood.js
```

### Korak 2: Simulacija napada na nezaštićeni server

1. Otvorite `flood.js` i postavite `TARGET_URL` na `"http://localhost:3000/unprotected"`
2. Pokrenite `node flood.js`
3. Pratite rezultate u korisničkom sučelju - nezaštićeni server će pokušati odgovoriti na sve zahtjeve

### Korak 3: Simulacija napada na zaštićeni server

1. Otvorite `flood.js` i postavite `TARGET_URL` na `"http://localhost:3000/protected"`
2. Pokrenite `node flood.js`
3. Pratite rezultate u korisničkom sučelju - zaštićeni server će odbiti većinu zahtjeva

## Kod i implementacija

### Express server i rate limiting

```javascript
// Rate limiting implementacija
const limiter = rateLimit({
  windowMs: 1000,    // 1 sekunda
  max: 5,            // maksimalno 5 zahtjeva po IP adresi
  message: "Previše zahtjeva, pokušajte kasnije."
});

app.get("/protected", limiter, (req, res) => {
  broadcast({ type: "protected", message: "Zahtjev primljen" });
  res.send("Zaštićeni server: odgovoreno");
});
```

### WebSocket implementacija

```javascript
// Server strana
const wss = new WebSocket.Server({ port: 8081 });

function broadcast(data) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// Klijent strana (Vue.js)
const ws = new WebSocket("ws://localhost:8081");

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === "protected") {
    logs.value.push(data.message);
  }
};
```

### DDoS simulacija

```javascript
const REQUESTS_PER_SECOND = 500;

setInterval(() => {
  for (let i = 0; i < REQUESTS_PER_SECOND; i++) {
    sendRequest();
  }
}, 1000);
```

## Zaključak

Ovaj projekt demonstrira:

1. **Ranjivost nezaštićenih servera** - kako čak i relativno malen broj zahtjeva može preopteretiti server
2. **Učinkovitost rate limitinga** - kako jednostavna zaštita može spriječiti preopterećenje servera
3. **Real-time monitoring prometa** - važnost praćenja prometa za detekciju mogućih napada

Naučili smo da je zaštita od DDoS napada ključna za održavanje stabilnosti web servisa, te da čak i jednostavne metode zaštite mogu značajno poboljšati otpornost servera na napade.

## Daljnje mogućnosti unapređenja

- Implementacija IP blacklisting mehanizma
- Dodavanje CAPTCHA zaštite
- Implementacija load balancera za distribuciju prometa
- Dodavanje naprednije analitike za prepoznavanje legitimnog od zlonamjernog prometa
