// ======================================================
// SEARCH.JS
// Gestisce la ricerca luoghi tramite Photon
// e l'aggiunta di marker partendo da un risultato.
// ======================================================

// Marker temporaneo usato quando si seleziona un risultato
let tempSearchMarker = null;

// ======================================================
// INIZIALIZZAZIONE RICERCA
// map -> istanza Leaflet
// folders -> cartelle disponibili
// addMarkerToBackend -> funzione POST marker
// loadMarkers -> ricarica markers dalla API
// ======================================================
export function initSearch(map, folders, addMarkerToBackend, loadMarkers) {
  const searchInput = document.getElementById("search-input");
  const searchResults = document.getElementById("search-results");
  let searchTimeout; // usato per il debounce della ricerca

  // ======================================================
  // EVENTO INPUT RICERCA
  // ======================================================
  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    const query = searchInput.value.trim();

    // Evita richieste se query troppo corta
    if (query.length < 3) {
      searchResults.innerHTML = "";
      searchResults.style.display = "none";
      return;
    }

    // Debounce 300ms per ridurre richieste
    searchTimeout = setTimeout(async () => {
      console.log("🔎 Searching:", query);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        const results = data.features || [];

        // Genera HTML risultati
        searchResults.innerHTML = results.map(place => {
          const lat = place.geometry.coordinates[1];
          const lon = place.geometry.coordinates[0];
          const street = place.properties.street || "";
          const housenumber = place.properties.housenumber || "";
          const city = place.properties.city || "";
          const country = place.properties.country || "";
          const name = place.properties.name || "Luogo";

          return `
            <div class="search-item" data-lat="${lat}" data-lon="${lon}">
              <strong>${name}</strong><br>
              ${street} ${housenumber} ${city}
              <small>${country}</small>
            </div>
          `;
        }).join("");

        // Mostra pannello risultati
        searchResults.style.display = "block";
      } catch(err) {
        console.error("❌ Search error:", err);
      }
    }, 300);
  });

  // ======================================================
  // CLICK SU RISULTATO DI RICERCA
  // ======================================================
  searchResults.addEventListener("click", (e) => {
    const item = e.target.closest(".search-item");
    if (!item) return;

    const lat = parseFloat(item.dataset.lat);
    const lon = parseFloat(item.dataset.lon);

    // --------------------------------------------------
    // 1- Zoom sulla posizione trovata
    // --------------------------------------------------
    map.setView([lat, lon], 17);

    // --------------------------------------------------
    // 2- Marker temporaneo (solo indicativo)
    // --------------------------------------------------
    if (tempSearchMarker) map.removeLayer(tempSearchMarker);
    tempSearchMarker = L.marker([lat, lon])
      .addTo(map)
      .bindPopup("📍 Posizione selezionata")
      .openPopup();

    // --------------------------------------------------
    // 3- Apertura modal per salvare marker
    // --------------------------------------------------
    const modal = document.getElementById("marker-modal");
    const nameInput = document.getElementById("marker-name-input");
    const descInput = document.getElementById("marker-desc-input");
    const folderSelect = document.getElementById("marker-folder-select");
    const saveBtn = document.getElementById("marker-save-btn");
    const cancelBtn = document.getElementById("marker-cancel-btn");
    modal.classList.add("show");

    // Precompila nome dal risultato
    nameInput.value = item.querySelector("strong").textContent || "";
    descInput.value = "";

    // Popola select cartelle
    folderSelect.innerHTML =
      `<option value="">Nessuna cartella</option>` +
      folders.map(f => `<option value="${f.id}">${f.name}</option>`).join('');

    // --------------------------------------------------
    // Reset listeners per evitare duplicazioni
    // --------------------------------------------------
    saveBtn.replaceWith(saveBtn.cloneNode(true));
    cancelBtn.replaceWith(cancelBtn.cloneNode(true));
    const newSaveBtn = document.getElementById("marker-save-btn");
    const newCancelBtn = document.getElementById("marker-cancel-btn");

    // --------------------------------------------------
    // SALVATAGGIO MARKER
    // --------------------------------------------------
    newSaveBtn.addEventListener("click", async () => {
      const name = nameInput.value.trim();
      if (!name) return alert("Inserisci un nome per il marker!");
      const desc = descInput.value.trim();
      const folderId = folderSelect.value || null;

      try {
        // Rimuove marker temporaneo
        if (tempSearchMarker) {
          map.removeLayer(tempSearchMarker);
          tempSearchMarker = null;
        }

        // Salva su backend
        await addMarkerToBackend(name, desc, lon, lat, folderId);

        // Ricarica markers dalla API
        await loadMarkers(map, folders);

        // Chiude modal
        modal.classList.remove("show");
      } catch(err) {
        console.error(err);
        alert("Errore durante il salvataggio del marker");
      }
    });

    // --------------------------------------------------
    // ANNULLA CREAZIONE MARKER
    // --------------------------------------------------
    newCancelBtn.addEventListener("click", () => {
      modal.classList.remove("show");
      if (tempSearchMarker) {
        map.removeLayer(tempSearchMarker);
        tempSearchMarker = null;
      }
    });

    // --------------------------------------------------
    // Pulizia UI ricerca
    // --------------------------------------------------
    searchResults.innerHTML = "";
    searchResults.style.display = "none";
    searchInput.value = "";
  });
}