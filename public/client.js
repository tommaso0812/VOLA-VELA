// Inizializzazione della mappa sul mare di Gallipoli 🗺️
const map = L.map('mappa').setView([40.055, 17.975], 14);

// Caricamento del layer grafico da OpenStreetMap 🌊
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

// Connessione in tempo reale tramite Socket.io 🔌
const socket = io();

let markersBarche = {};
let markersBoe = {};

// Registrazione barca alla connessione
socket.on('connect', () => {
    console.log("Connesso al server Socket.io con successo!");
    socket.emit('registraBarca', { nome: "Mia Barca", colore: "#e74c3c" });
});

// Ricezione e aggiornamento delle posizioni delle boe (con drag & drop 🖱️)
socket.on('aggiornaBoe', (boe) => {
    for (let nome in boe) {
        if (!markersBoe[nome]) {
            // 1. Creiamo il marker trascinabile (draggable: true)
            markersBoe[nome] = L.marker(boe[nome], { draggable: true })
                .addTo(map)
                .bindPopup("Boa: " + nome);

            // 2. Inviamo le nuove coordinate quando la boa viene rilasciata
            markersBoe[nome].on('dragend', (e) => {
                const nuovaPosizione = e.target.getLatLng();
                
                socket.emit('spostaBoa', {
                    nome: nome,
                    lat: nuovaPosizione.lat,
                    lng: nuovaPosizione.lng
                });
            });
        } else {
            markersBoe[nome].setLatLng(boe[nome]);
        }
    }
});

// Ricezione e aggiornamento delle posizioni delle barche
socket.on('aggiornaBarche', (barche) => {
    for (let id in barche) {
        let b = barche[id];
        if (!markersBarche[id]) {
            markersBarche[id] = L.marker([b.lat, b.lng]).addTo(map).bindPopup(b.nome);
        } else {
            markersBarche[id].setLatLng([b.lat, b.lng]);
        }
    }
});

// Funzione per inviare i comandi di virata al server 🧭
function sterza(gradi) {
    socket.emit('sterza', gradi);
}
