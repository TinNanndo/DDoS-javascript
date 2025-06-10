const { spawn } = require('child_process');

// Start the HTTP server
const httpServer = spawn('node', ['unprotected.js']);
httpServer.stdout.on('data', (data) => {
  console.log(`HTTP: ${data}`);
});
httpServer.stderr.on('data', (data) => {
  console.error(`HTTP Error: ${data}`);
});

// Start the HTTPS server
const httpsServer = spawn('node', ['protected.js']);
httpsServer.stdout.on('data', (data) => {
  console.log(`HTTPS: ${data}`);
});
httpsServer.stderr.on('data', (data) => {
  console.error(`HTTPS Error: ${data}`);
});

console.log('Both servers started!');