const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// Posizioni iniziali delle boe nel mare di Gallipoli 📍
let boe = {
    "Partenza": [40.055, 17.970],
    "Bolina": [40.062, 17.975],
    "Poppa": [40.050, 17.980]
};

let barche = {};
let statoGara = 'preparazione'; // 'preparazione' oppure 'inGara'

io.on('connection', (socket) => {
    console.log(`Nuova connessione: ${socket.id} 🔌`);

    // Invia lo stato attuale al nuovo client
    socket.emit('aggiornaBoe', boe);
    if (statoGara === 'inGara') {
        socket.emit('inizioGara');
    }

    // Registrazione barca
    socket.on('registraBarca', (data) => {
        barche[socket.id] = {
            nome: data.nome || "Barca " + socket.id.substring(0, 4),
            lat: 40.054 + (Math.random() - 0.5) * 0.002,
            lng: 17.969 + (Math.random() - 0.5) * 0.002,
            colore: data.colore || "#e74c3c"
        };
        io.emit('aggiornaBarche', barche);
    });

    // Spostamento boa (valido solo in fase di preparazione) 📍
    socket.on('spostaBoa', (data) => {
        if (statoGara === 'preparazione' && boe[data.nome]) {
            boe[data.nome] = [data.lat, data.lng];
            io.emit('aggiornaBoe', boe);
        }
    });

    // Comando manuale di avvio gara 🏁
    socket.on('avviaGara', () => {
        statoGara = 'inGara';
        io.emit('inizioGara');
        console.log("🏁 Gara avviata manualmente! Posizioni delle boe bloccate.");
    });

    // Disconnessione
    socket.on('disconnect', () => {
        delete barche[socket.id];
        io.emit('aggiornaBarche', barche);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server avviato sulla porta ${PORT} 🚀`);
});
