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
let statoGara = 'preparazione'; // Stato: 'preparazione' oppure 'inGara'
let tempoRimanente = 30; // Conto alla rovescia iniziale in secondi ⏱️

// Timer automatico server-side ⌛
const timerInterval = setInterval(() => {
    if (statoGara === 'preparazione') {
        tempoRimanente--;
        io.emit('aggiornaTimer', { tempo: tempoRimanente, stato: statoGara });

        if (tempoRimanente <= 0) {
            statoGara = 'inGara';
            io.emit('inizioGara');
            console.log("🏁 Gara iniziata! Posizione delle boe bloccata.");
            clearInterval(timerInterval);
        }
    }
}, 1000);

io.on('connection', (socket) => {
    console.log(`Nuova connessione: ${socket.id} 🔌`);

    // Inviamo lo stato attuale del campo di gara al nuovo client
    socket.emit('aggiornaBoe', boe);
    socket.emit('aggiornaTimer', { tempo: tempoRimanente, stato: statoGara });
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

    // Ricezione nuova posizione della boa (attiva solo in preparazione) 🖱️
    socket.on('spostaBoa', (data) => {
        if (statoGara === 'preparazione' && boe[data.nome]) {
            boe[data.nome] = [data.lat, data.lng];
            io.emit('aggiornaBoe', boe); // Notifica tutti i client
        }
    });

    // Gestione della disconnessione
    socket.on('disconnect', () => {
        delete barche[socket.id];
        io.emit('aggiornaBarche', barche);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server avviato sulla porta ${PORT} 🚀`);
});
