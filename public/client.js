const map = L.map('mappa').setView([40.055, 17.975], 14);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

const socket = io();

let markersBarche = {};
let markersBoe = {};
let garaIniziata = false;

socket.on('connect', () => {
    console.log("Connesso al server Socket.io! 🔌");
    socket.emit('registraBarca', { nome: "Mia Barca", colore: "#e74c3c" });
});

// Funzione richiamata dal pulsante "Avvia Gara" 🏁
function avviaGara() {
    socket.emit('avviaGara');
}

// Blocco delle boe all'avvio della gara 🔒
socket.on('inizioGara', () => {
    garaIniziata = true;
    console.log("🏁 Gara iniziata! Boe bloccate.");
    
    // Disabilita il pulsante
    const btn = document.getElementById('btn-avvia');
    if (btn) {
        btn.innerText = "🔒 Gara in Corso";
        btn.disabled = true;
    }

    // Disabilita il drag & drop su tutte le boe
    for (let nome in markersBoe) {
        if (markersBoe[nome].dragging) {
            markersBoe[nome].dragging.disable();
        }
    }
});

// Gestione boe con Drag & Drop 📍
socket.on('aggiornaBoe', (boe) => {
    for (let nome in boe) {
        const coords = boe[nome];

        if (!markersBoe[nome]) {
            markersBoe[nome] = L.marker(coords, { draggable: !garaIniziata })
                .addTo(map)
                .bindPopup("Boa: " + nome);

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
            if (garaIniziata && markersBoe[nome].dragging) {
                markersBoe[nome].dragging.disable();
            }
        }
    }
});

// Gestione barche ⛵
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
