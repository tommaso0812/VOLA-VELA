const centroGallipoli = [40.055, 17.975];
const map = L.map('mappa').setView(centroGallipoli, 14);

// Aggiunta del livello grafico della mappa (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Oggetti per tracciare i marcatori sulla mappa
let marcatoriBarche = {};
let marcatoriBoe = {};

// Icona personalizzata per le boe 🚩
const boaIcon = L.divIcon({
  className: 'custom-boa',
  html: '🚩',
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

// Icona personalizzata per le barche ⛵
const barcaIcon = L.divIcon({
  className: 'custom-barca',
  html: '⛵',
  iconSize: [25, 25],
  iconAnchor: [12, 12]
});

// 2. Ricezione e aggiornamento dei dati delle barche dal server
socket.on('aggiornaBarche', (barche) => {
  // Aggiorna o crea i marcatori per ogni barca
  Object.keys(barche).forEach((id) => {
    const b = barche[id];
    
    if (marcatoriBarche[id]) {
      // Aggiorna posizione esistente
      marcatoriBarche[id].setLatLng([b.lat, b.lng]);
    } else {
      // Crea nuovo marcatore per la barca
      marcatoriBarche[id] = L.marker([b.lat, b.lng], { icon: barcaIcon })
        .addTo(map)
        .bindPopup(`<b>${b.nome}</b><br>Velocità: ${b.speed} nodi`);
    }
  });

  // Rimuovi i marcatori delle barche disconnesse
  Object.keys(marcatoriBarche).forEach((id) => {
    if (!barche[id]) {
      map.removeLayer(marcatoriBarche[id]);
      delete marcatoriBarche[id];
    }
  });
});

// 3. Registrazione automatica all'ingresso
socket.emit('registraBarca', { nome: 'Veliero Salentino' });

// 4. Funzione per inviare i comandi di sterzo al server 🧭
function sterza(gradi) {
  socket.emit('sterza', gradi);

