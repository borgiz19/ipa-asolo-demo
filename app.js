(() => {
  'use strict';

  const mapElement = document.getElementById('map');
  if (mapElement) {
    initMap();
  }

  const formElement = document.getElementById('contactForm');
  if (formElement) {
    initContactForm(formElement);
  }

  function initMap() {
    const statusEl = document.getElementById('mapStatus');
    const countEl = document.getElementById('poiCount');
    const listEl = document.getElementById('poiList');
    const filtersEl = document.getElementById('categoryFilters');
    const searchEl = document.getElementById('poiSearch');
    const resetBtn = document.getElementById('resetFilters');
    const fitBtn = document.getElementById('fitBounds');

    if (!statusEl || !countEl || !listEl || !filtersEl || !searchEl || !resetBtn || !fitBtn) {
      return;
    }

    if (typeof window.L === 'undefined') {
      statusEl.textContent = 'Impossibile inizializzare la mappa.';
      return;
    }

    const map = L.map('map', { zoomControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    let allPois = [];
    let activeCategories = new Set();
    let searchTerm = '';
    let allBounds = null;
    let markerIndex = new Map();
    let filterButtons = [];

    const applyFilters = () => {
      const term = searchTerm.trim().toLowerCase();
      const visible = allPois.filter((poi) => {
        const matchesCategory = activeCategories.size > 0 && activeCategories.has(poi.category);
        const haystack = `${poi.name} ${poi.desc || ''}`.toLowerCase();
        const matchesSearch = term.length === 0 || haystack.includes(term);
        return matchesCategory && matchesSearch;
      });
      renderMarkers(visible);
      renderList(visible);
      updateCount(visible.length, allPois.length);
    };

    const renderFilters = (categories) => {
      filtersEl.innerHTML = '';
      filterButtons = categories.map((category) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `filter-btn ${categoryClass(category)} is-active`;
        button.dataset.category = category;
        button.setAttribute('aria-pressed', 'true');
        button.textContent = category;
        button.addEventListener('click', () => {
          if (activeCategories.has(category)) {
            activeCategories.delete(category);
            button.classList.remove('is-active');
            button.setAttribute('aria-pressed', 'false');
          } else {
            activeCategories.add(category);
            button.classList.add('is-active');
            button.setAttribute('aria-pressed', 'true');
          }
          applyFilters();
        });
        filtersEl.appendChild(button);
        return button;
      });
    };

    const renderMarkers = (pois) => {
      markersLayer.clearLayers();
      markerIndex = new Map();
      if (pois.length === 0) {
        return;
      }
      pois.forEach((poi) => {
        const marker = L.marker([poi.lat, poi.lon], { title: poi.name });
        marker.bindPopup(buildPopup(poi), { maxWidth: 260 });
        marker.addTo(markersLayer);
        markerIndex.set(poi.id, marker);
      });
    };

    const renderList = (pois) => {
      listEl.innerHTML = '';
      if (pois.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'empty-state';
        empty.textContent = 'Nessun risultato con i filtri attivi.';
        listEl.appendChild(empty);
        return;
      }
      pois.forEach((poi) => {
        const item = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'poi-item';
        button.setAttribute('aria-label', `Apri ${poi.name}`);
        const title = document.createElement('span');
        title.className = 'poi-title';
        title.textContent = poi.name;
        const meta = document.createElement('span');
        meta.className = `badge ${categoryClass(poi.category)}`;
        meta.textContent = poi.category;
        const desc = document.createElement('span');
        desc.className = 'poi-desc';
        desc.textContent = poi.desc;
        button.appendChild(title);
        button.appendChild(meta);
        button.appendChild(desc);
        button.addEventListener('click', () => {
          const marker = markerIndex.get(poi.id);
          map.setView([poi.lat, poi.lon], 15, { animate: true });
          if (marker) {
            marker.openPopup();
          }
        });
        item.appendChild(button);
        listEl.appendChild(item);
      });
    };

    const updateCount = (visible, total) => {
      countEl.textContent = `Punti visibili: ${visible} / ${total}`;
    };

    const buildPopup = (poi) => {
      const title = escapeHtml(poi.name);
      const category = escapeHtml(poi.category);
      const desc = escapeHtml(poi.desc);
      const link = poi.url ? `<a href="${escapeHtml(poi.url)}" target="_blank" rel="noopener">Apri link</a>` : '';
      return `
        <div class="popup">
          <div class="popup-title">${title}</div>
          <div class="popup-meta">${category}</div>
          <p class="popup-desc">${desc}</p>
          ${link}
        </div>
      `;
    };

    const resetAll = () => {
      activeCategories = new Set(allPois.map((poi) => poi.category));
      filterButtons.forEach((button) => {
        button.classList.add('is-active');
        button.setAttribute('aria-pressed', 'true');
      });
      searchTerm = '';
      searchEl.value = '';
      applyFilters();
    };

    const debounceSearch = debounce((value) => {
      searchTerm = value;
      applyFilters();
    }, 200);

    searchEl.addEventListener('input', (event) => {
      debounceSearch(event.target.value || '');
    });

    resetBtn.addEventListener('click', resetAll);

    fitBtn.addEventListener('click', () => {
      if (allBounds) {
        map.fitBounds(allBounds, { padding: [30, 30] });
      }
    });

    statusEl.textContent = 'Caricamento punti di interesse...';

    fetch('data/pois.sample.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Errore di rete');
        }
        return response.json();
      })
      .then((data) => {
        allPois = Array.isArray(data) ? data : [];
        const categories = Array.from(new Set(allPois.map((poi) => poi.category))).sort();
        activeCategories = new Set(categories);
        renderFilters(categories);
        if (allPois.length > 0) {
          allBounds = L.latLngBounds(allPois.map((poi) => [poi.lat, poi.lon]));
          map.fitBounds(allBounds, { padding: [30, 30] });
        } else {
          map.setView([45.83, 11.86], 11);
        }
        statusEl.textContent = '';
        applyFilters();
        setTimeout(() => map.invalidateSize(), 150);
      })
      .catch(() => {
        statusEl.textContent = 'Impossibile caricare i dati.';
        statusEl.classList.add('is-error');
      });
  }

  function initContactForm(form) {
    const statusEl = document.getElementById('formStatus');
    if (!statusEl) {
      return;
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!form.checkValidity()) {
        statusEl.textContent = 'Compila tutti i campi richiesti.';
        statusEl.classList.add('is-error');
        form.reportValidity();
        return;
      }
      statusEl.textContent = 'Messaggio pronto per invio (demo).';
      statusEl.classList.remove('is-error');
      form.reset();
    });
  }

  function debounce(fn, wait) {
    let timer;
    return (...args) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        fn(...args);
      }, wait);
    };
  }

  function categoryClass(category) {
    return `cat-${String(category).toLowerCase().replace(/\s+/g, '-')}`;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
})();
