const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// 1. Servire i file statici dalla cartella 'public'
app.use(express.static('public'));

// 2. Rotta per la pagina principale
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// 3. Stato iniziale della regata nel Golfo di Gallipoli 🌊
let statoRegata = {
    campo: 'gallipoli',
    vento: { twd: 0, tws: 12 }, // Vento da Nord (0°) a 12 nodi
    tempoLimite: 15,
    boe: { 
        comitato: [40.055, 17.975], // Linea di partenza
        pin: [40.055, 17.965],      // Contro-boa di partenza
        bolina: [40.068, 17.970],   // Boa 1 (Bolina)
        lasco: [40.060, 17.982]     // Boa 2 (Lasco)
    },
    inCorso: false,
    tempoRimanente: 900
};

let barche = {};

// 4. Gestione connessioni Socket.io
io.on('connection', (socket) => {
    socket.on('registraBarca', (dati) => {
        barche[socket.id] = {
            id: socket.id,
            nome: dati.nome || "Barca " + socket.id.substring(0, 3),
            numero: dati.numero || Math.floor(Math.random() * 99) + 1,
            colore: dati.colore || '#e74c3c',
            lat: statoRegata.boe.comitato[0] - 0.001,
            lng: statoRegata.boe.comitato[1],
            hdg: 0,
            speed: 0,
            penalita: false,
            arrivata: false
        };
        // Invia lo stato aggiornato a tutti i client
        io.emit('aggiornaBarche', barche);
        io.emit('aggiornaBoe', statoRegata.boe);
    });

    socket.on('sterza', (gradi) => {
        let b = barche[socket.id];
        if (b && !b.arrivata) {
            b.hdg = (b.hdg + gradi + 360) % 360;
            let twa = Math.abs(b.hdg - statoRegata.vento.twd) % 180;
            if (twa < 45) b.speed = 0; // Angolo morto al vento
            else b.speed = (Math.sin((twa * Math.PI) / 180) * statoRegata.vento.tws * 0.6).toFixed(1);
            
            io.emit('aggiornaBarche', barche);
        }
    });

    socket.on('disconnect', () => {
        delete barche[socket.id];
        io.emit('aggiornaBarche', barche);
    });
});

// 5. Avvio del server
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server VOLA-VELA attivo sulla porta ${PORT}`));
