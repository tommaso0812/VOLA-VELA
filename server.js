const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// Boe del campo di regata e linea di partenza 📍
let boe = {
    "Partenza Sinistra": [40.054, 17.970],
    "Partenza Destra": [40.056, 17.970],
    "Bolina": [40.065, 17.975],
    "Arrivo": [40.055, 17.970]
};

// Match Race: Due barche fisse con slot assegnabili ai giocatori ⛵
let barche = {
    "barca1": { nome: "Barca 1 (Blu)", lat: 40.053, lng: 17.969, heading: 0, speed: 0, socketId: null, colore: "#3498db" },
    "barca2": { nome: "Barca 2 (Rosso)", lat: 40.057, lng: 17.969, heading: 0, speed: 0, socketId: null, colore: "#e74c3c" }
};

let statoGara = 'preparazione';

// Fisica e aggiornamento continuo della posizione delle barche in movimento 🌊
setInterval(() => {
    for (let id in barche) {
        let b = barche[id];
        if (b.speed !== 0) {
            let rad = (b.heading - 90) * (Math.PI / 180);
            b.lat += Math.sin(rad) * 0.0001 * b.speed;
            b.lng += Math.cos(rad) * 0.0001 * b.speed;
        }
    }
    io.emit('aggiornaBarche', barche);
}, 50);

io.on('connection', (socket) => {
    console.log(`Connesso: ${socket.id} 🔌`);

    // Assegnazione automatica dello slot barca
    let assignedBoat = null;
    if (!barche["barca1"].socketId) {
        barche["barca1"].socketId = socket.id;
        assignedBoat = "barca1";
    } else if (!barche["barca2"].socketId) {
        barche["barca2"].socketId = socket.id;
        assignedBoat = "barca2";
    }

    // Invia lo stato iniziale al client
    socket.emit('initMatchRace', { assignedBoat, boe, barche });
    io.emit('aggiornaBoe', boe);
    io.emit('aggiornaBarche', barche);

    // Gestione dei comandi da tastiera ricevuti ⌨️
    socket.on('comandoTastiera', (data) => {
        let boatKey = null;
        if (barche["barca1"].socketId === socket.id) boatKey = "barca1";
        if (barche["barca2"].socketId === socket.id) boatKey = "barca2";

        if (boatKey && statoGara === 'inGara') {
            let b = barche[boatKey];
            if (data.azione === 'sinistra') b.heading -= 15;
            if (data.azione === 'destra') b.heading += 15;
            if (data.azione === 'avanti') b.speed = Math.min(b.speed + 1, 4);
            if (data.azione === 'indietro') b.speed = Math.max(b.speed - 1, -2);
            if (data.azione === 'stop') b.speed = 0;
        }
    });

    // Spostamento boe in preparazione 📍
    socket.on('spostaBoa', (data) => {
        if (statoGara === 'preparazione' && boe[data.nome]) {
            boe[data.nome] = [data.lat, data.lng];
            io.emit('aggiornaBoe', boe);
        }
    });

    // Avvio manuale della gara 🏁
    socket.on('avviaGara', () => {
        statoGara = 'inGara';
        io.emit('inizioGara');
        console.log("🏁 Match Race avviato!");
    });

    socket.on('disconnect', () => {
        if (barche["barca1"].socketId === socket.id) barche["barca1"].socketId = null;
        if (barche["barca2"].socketId === socket.id) barche["barca2"].socketId = null;
        io.emit('aggiornaBarche', barche);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server avviato su porta ${PORT} 🚀`));
