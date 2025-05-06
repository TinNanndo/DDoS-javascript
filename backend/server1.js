const https = require('https');
const fs = require('fs');
const express = require('express');

const app = express();

const options = {
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.cert'),
};

https.createServer(options, app).listen(3443, () => {
  console.log("🔒 HTTPS server radi na https://localhost:3443");
});
