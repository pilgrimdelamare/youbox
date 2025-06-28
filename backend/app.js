const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs-extra');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(cors());
app.use(bodyParser.json());

// Permetti alle route di notificare via socket
app.set('io', io);

// Rotte intonazione
const intonationRoutes = require('./routes/intonation');
app.use('/api', intonationRoutes);

// (altre rotte e middleware per dashboard/monitor...)
// Esempio: app.use('/api/contestants', contestantsRoutes);
// ...

// Static serve per frontend (dashboard, monitor, voting, ecc.)
app.use(express.static(path.join(__dirname, '../frontend/dashboard/build')));
// Aggiungi eventuali altri frontend...

// Avvio server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  fs.ensureDirSync(path.join(__dirname, '../data/recordings'));
  fs.ensureDirSync(path.join(__dirname, '../data/results'));
  console.log(`YouBox backend listening on port ${PORT}`);
});

module.exports = app;