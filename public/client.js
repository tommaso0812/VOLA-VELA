const map = L.map('mappa').setView([40.055, 17.975], 14);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

const socket = io();

let markersBarche = {};
let markersBoe = {};
let myBoatKey = null;
let garaIniziata = false;

// Assegnazione del ruolo barca all'ingresso ⛵
socket.on('initMatchRace', (data) => {
    myBoatKey = data.assignedBoat;
    
    const banner = document.createElement('div');
    banner.style.position = 'absolute';
    banner.style.bottom = '20px';
    banner.style.left = '20px';
    banner.style.zIndex = '1000';
    banner.style.background = 'white';
    banner.style.padding = '12px';
    banner.style.borderRadius = '8px';
    banner.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
    banner.style.fontWeight = 'bold';

    if (myBoatKey) {
        banner.innerHTML = `Stai guidando: <span style="color: ${myBoatKey === 'barca1' ? '#3498db' : '#e74c3c'}">${myBoatKey.toUpperCase()}</span><br><small>Usa ⬅️ ➡️ per sterzare, ⬆️ ⬇️ per velocità, Spazio per fermarti</small>`;
    } else {
        banner.innerHTML = `Modalità Spettatore 👁️ (Slot barche occupati)`;
    }
    document.body.appendChild(banner);
});

// Ascolto dei tasti freccia per muovere la barca ⌨️
window.addEventListener('keydown', (e) => {
    if (!garaIniziata || !myBoatKey) return;

    if (e.key === 'ArrowLeft') {
        socket.emit('comandoTastiera', { azione: 'sinistra' });
        e.preventDefault();
    } else if (e.key === 'ArrowRight') {
        socket.emit('comandoTastiera', { azione: 'destra' });
        e.preventDefault();
    } else if (e.key === 'ArrowUp') {
        socket.emit('comandoTastiera', { azione: 'avanti' });
        e.preventDefault();
    } else if (e.key === 'ArrowDown') {
        socket.emit('comandoTastiera', { azione: 'indietro' });
        e.preventDefault();
    } else if (e.code === 'Space') {
        socket.emit('comandoTastiera', { azione: 'stop' });
        e.preventDefault();
    }
});

function avviaGara() {
    socket.emit('avviaGara');
}

socket.on('inizioGara', () => {
    garaIniziata = true;
    const btn = document.getElementById('btn-avvia');
    if (btn) {
        btn.innerText = "🔒 Match Race in Corso";
        btn.disabled = true;
    }
    for (let nome in markersBoe) {
        if (markersBoe[nome].dragging) {
            markersBoe[nome].dragging.disable();
        }
    }
});

// Gestione boe trascinabili in preparazione 📍
socket.on('aggiornaBoe', (boe) => {
    for (let nome in boe) {
        const coords = boe[nome];
        if (!markersBoe[nome]) {
            markersBoe[nome] = L.marker(coords, { draggable: !garaIniziata })
                .addTo(map)
                .bindPopup("Boa: " + nome);

            markersBoe[nome].on('dragend', (e) => {
                if (!garaIniziata) {
                    const p = e.target.getLatLng();
                    socket.emit('spostaBoa', { nome: nome, lat: p.lat, lng: p.lng });
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

// Sincronizzazione barche sulla mappa ⛵
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
