// Inizializzazione della mappa sul mare di Gallipoli 🗺️
const map = L.map('mappa').setView([40.055, 17.975], 14);

// Layer OpenStreetMap 🌊
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

const socket = io();

let markersBarche = {};
let markersBoe = {};
let garaIniziata = false;

// Connessione iniziale
socket.on('connect', () => {
    console.log("Connesso al server Socket.io con successo! 🔌");
    socket.emit('registraBarca', { nome: "Mia Barca", colore: "#e74c3c" });
});

// Ricezione del timer ⏱️
socket.on('aggiornaTimer', (data) => {
    console.log(`Tempo alla partenza: ${data.tempo}s`);
});

// Evento di avvio della gara: blocco del trascinamento 🔒
socket.on('inizioGara', () => {
    garaIniziata = true;
    console.log("🏁 Gara iniziata! Le boe sono bloccate.");
    
    // Disabilita il drag & drop su tutti i marker delle boe
    for (let nome in markersBoe) {
        if (markersBoe[nome].dragging) {
            markersBoe[nome].dragging.disable();
        }
    }
});

// Gestione delle boe (Drag & Drop solo in preparazione) 📍
socket.on('aggiornaBoe', (boe) => {
    for (let nome in boe) {
        const coords = boe[nome];

        if (!markersBoe[nome]) {
            // Crea il marcatore trascinabile solo prima dell'inizio
            markersBoe[nome] = L.marker(coords, { draggable: !garaIniziata })
                .addTo(map)
                .bindPopup("Boa: " + nome);

            // Invia la nuova posizione al rilascio del mouse
            markersBoe[nome].on('dragend', (e) => {
                if (!garaIniziata) {
                    const nuovaPosizione = e.target.getLatLng();
                    socket.emit('spostaBoa', {
                        nome: nome,
                        lat: nuovaPosizione.lat,
                        lng: nuovaPosizione.lng
                    });
                }
            });
        } else {
            markersBoe[nome].setLatLng(coords);
            
            // Mantiene sincronizzato lo stato di trascinamento
            if (garaIniziata) {
                markersBoe[nome].dragging.disable();
            } else {
                markersBoe[nome].dragging.enable();
            }
        }
    }
});

// Aggiornamento barche ⛵
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

function sterza(gradi) {
    socket.emit('sterza', gradi);
}
