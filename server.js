const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

let statoRegata = {
    campo: 'livorno',
    vento: { twd: 0, tws: 12 },
    tempoLimite: 15,
    boe: { comitato: [43.535, 10.300], pin: [43.535, 10.290], bolina: [43.545, 10.295], lasco: [43.540, 10.305] },
    inCorso: false,
    tempoRimanente: 900
};

let barche = {};

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
        io.emit('aggiornaBarche', barche);
    });

    socket.on('sterza', (gradi) => {
        let b = barche[socket.id];
        if (b && !b.arrivata) {
            b.hdg = (b.hdg + gradi + 360) % 360;
            let twa = Math.abs(b.hdg - statoRegata.vento.twd) % 180;
            if (twa < 45) b.speed = 0;
            else b.speed = (Math.sin((twa * Math.PI) / 180) * statoRegata.vento.tws * 0.6).toFixed(1);
            io.emit('aggiornaBarche', barche);
        }
    });

    socket.on('disconnect', () => {
        delete barche[socket.id];
        io.emit('aggiornaBarche', barche);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server attivo sulla porta ${PORT}`));
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// Servire la pagina principale
app.get('/', (req, res) => {
  res.send('<h1>Simulatore VOLA-VELA attivo! ⛵</h1>');
});

// Impostazione porta per Render
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server attivo sulla porta ${PORT}`);
});
