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

// Registra la barca al momento della connessione
socket.emit('registraBarca', { nome: "Mia Barca", colore: "#e74c3c" });

// Ricezione e aggiornamento delle posizioni delle boe
socket.on('aggiornaBoe', (boe) => {
    for (let nome in boe) {
        if (!markersBoe[nome]) {
            markersBoe[nome] = L.marker(boe[nome]).addTo(map).bindPopup("Boa: " + nome);
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

// Funzione per inviare i comandi di virata al server
function sterza(gradi) {
    socket.emit('sterza', gradi);
}
