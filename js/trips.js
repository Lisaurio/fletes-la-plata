const Trips = {
  currentSort: { key: 'fecha', asc: false },
  searchTerm: '',
  filterStatus: '',
  calendarMonth: new Date().getMonth(),
  calendarYear: new Date().getFullYear(),

  render() {
    this.renderTable();
    this.renderCalendar();
    this.bindEvents();
  },

  getFiltered() {
    let list = DB.getAll('trips');
    if (this.searchTerm) {
      const s = this.searchTerm.toLowerCase();
      list = list.filter(t =>
        t.origen?.toLowerCase().includes(s) ||
        t.destino?.toLowerCase().includes(s) ||
        t.localidad?.toLowerCase().includes(s) ||
        t.estado?.toLowerCase().includes(s)
      );
    }
    if (this.filterStatus) {
      list = list.filter(t => t.estado === this.filterStatus);
    }
    list = list.map(t => ({
      ...t,
      clienteNombre: DB.getById('clients', t.clienteId)?.nombre || '—',
      choferNombre: (e => e ? `${e.nombre} ${e.apellido}` : '—')(DB.getById('employees', t.choferId)),
      vehiculoNombre: (v => v ? `${v.marca} ${v.modelo}` : '—')(DB.getById('vehicles', t.vehiculoId)),
    }));
    list.sort((a, b) => {
      let va = a[this.currentSort.key] || '';
      let vb = b[this.currentSort.key] || '';
      if (this.currentSort.key === 'precio') { va = Number(va); vb = Number(vb); }
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return this.currentSort.asc ? -1 : 1;
      if (va > vb) return this.currentSort.asc ? 1 : -1;
      return 0;
    });
    return list;
  },

  renderTable() {
    const list = this.getFiltered();
    const container = document.getElementById('tableTrips');
    const sortIcon = (key) => this.currentSort.key === key ? (this.currentSort.asc ? 'fa-sort-up' : 'fa-sort-down') : 'fa-sort';

    if (list.length === 0) {
      container.innerHTML = `<div class="empty-state"><i class="fas fa-route"></i><h3>No hay viajes</h3><p>Creá el primer viaje o cambiá los filtros.</p></div>`;
      return;
    }

    container.innerHTML = `
      <div class="table-container">
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th onclick="Trips.sort('fecha')">Fecha <i class="fas ${sortIcon('fecha')}"></i></th>
                <th>Hora</th>
                <th>Cliente</th>
                <th onclick="Trips.sort('localidad')">Localidad <i class="fas ${sortIcon('localidad')}"></i></th>
                <th>Origen/Destino</th>
                <th>Vehículo</th>
                <th>Chofer</th>
                <th onclick="Trips.sort('precio')">Precio <i class="fas ${sortIcon('precio')}"></i></th>
                <th onclick="Trips.sort('estado')">Estado <i class="fas ${sortIcon('estado')}"></i></th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${list.map(t => `
                <tr>
                  <td>${App.formatDate(t.fecha)}</td>
                  <td>${t.hora || '—'}</td>
                  <td><strong>${App.escapeHtml(t.clienteNombre)}</strong></td>
                  <td>${App.escapeHtml(t.localidad)}</td>
                  <td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${App.escapeHtml(t.origen)} → ${App.escapeHtml(t.destino)}">
                    ${App.escapeHtml(t.origen)} → ${App.escapeHtml(t.destino)}
                  </td>
                  <td>${App.escapeHtml(t.vehiculoNombre)}</td>
                  <td>${App.escapeHtml(t.choferNombre)}</td>
                  <td>${App.formatCurrency(t.precio)}</td>
                  <td>${App.getBadgeHtml(t.estado)}</td>
                  <td>
                    <div class="table-actions">
                      <button class="btn-table edit" onclick="Trips.edit('${t.id}')" title="Editar"><i class="fas fa-edit"></i></button>
                      <button class="btn-table delete" onclick="Trips.confirmDelete('${t.id}')" title="Eliminar"><i class="fas fa-trash"></i></button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderCalendar() {
    const trips = DB.getAll('trips');
    const month = this.calendarMonth;
    const year = this.calendarYear;
    const today = App.getToday();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const daysInPrev = new Date(year, month, 0).getDate();

    const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

    let days = '';
    for (let i = startDay - 1; i >= 0; i--) {
      const d = daysInPrev - i;
      days += `<div class="calendar-day other-month"><div class="day-number">${d}</div></div>`;
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const dayTrips = trips.filter(t => t.fecha === dateStr);
      const isToday = dateStr === today;
      days += `<div class="calendar-day ${isToday ? 'today' : ''}" onclick="Trips.showDayTrips('${dateStr}')">
        <div class="day-number">${d}</div>
        ${dayTrips.length > 0 ? `<div class="day-count">${dayTrips.length}</div>` : ''}
      </div>`;
    }

    const totalCells = startDay + daysInMonth;
    const remaining = (7 - (totalCells % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      days += `<div class="calendar-day other-month"><div class="day-number">${d}</div></div>`;
    }

    document.getElementById('calendarContainer').innerHTML = `
      <div class="calendar">
        <div class="calendar-header">
          <h3>${monthNames[month]} ${year}</h3>
          <div class="calendar-nav">
            <button onclick="Trips.prevMonth()"><i class="fas fa-chevron-left"></i></button>
            <button onclick="Trips.nextMonth()"><i class="fas fa-chevron-right"></i></button>
          </div>
        </div>
        <div class="calendar-weekdays">
          <div>Dom</div><div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div>
        </div>
        <div class="calendar-days">${days}</div>
      </div>
    `;
  },

  prevMonth() {
    this.calendarMonth--;
    if (this.calendarMonth < 0) { this.calendarMonth = 11; this.calendarYear--; }
    this.renderCalendar();
  },

  nextMonth() {
    this.calendarMonth++;
    if (this.calendarMonth > 11) { this.calendarMonth = 0; this.calendarYear++; }
    this.renderCalendar();
  },

  showDayTrips(dateStr) {
    const trips = DB.getAll('trips').filter(t => t.fecha === dateStr);
    const withNames = trips.map(t => ({
      ...t,
      clienteNombre: DB.getById('clients', t.clienteId)?.nombre || '—',
      choferNombre: (e => e ? `${e.nombre} ${e.apellido}` : '—')(DB.getById('employees', t.choferId)),
    }));

    App.showModal(`
      <h4 style="margin-bottom:16px;font-size:1.1rem">Viajes del ${App.formatDate(dateStr)}</h4>
      ${withNames.length === 0 ? '<p style="color:var(--text-light)">Sin viajes este día.</p>' : `
      <table>
        <thead><tr><th>Hora</th><th>Cliente</th><th>Origen</th><th>Destino</th><th>Precio</th><th>Estado</th></tr></thead>
        <tbody>${withNames.map(t => `<tr><td>${t.hora || '—'}</td><td>${App.escapeHtml(t.clienteNombre)}</td><td>${App.escapeHtml(t.origen)}</td><td>${App.escapeHtml(t.destino)}</td><td>${App.formatCurrency(t.precio)}</td><td>${App.getBadgeHtml(t.estado)}</td></tr>`).join('')}</tbody>
      </table>`}
      <div style="margin-top:12px;display:flex;gap:8px">
        <button class="btn btn-primary btn-sm" onclick="App.closeModal();Trips.showForm(null, '${dateStr}')"><i class="fas fa-plus"></i> Agregar viaje</button>
      </div>
    `, `Agenda del día`, true);
  },

  showDayAgenda() {
    const today = App.getToday();
    this.showDayTrips(today);
  },

  showWeekAgenda() {
    const trips = DB.getAll('trips');
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      weekDates.push(d.toISOString().split('T')[0]);
    }

    let html = '<h4 style="margin-bottom:16px;font-size:1.1rem">Agenda semanal</h4>';
    weekDates.forEach(dateStr => {
      const dayTrips = trips.filter(t => t.fecha === dateStr);
      const dow = new Date(dateStr + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long' });
      html += `<div style="margin-bottom:12px;padding:12px;background:var(--bg);border-radius:var(--radius-sm)">
        <strong style="color:var(--text)">${dow.charAt(0).toUpperCase() + dow.slice(1)} ${App.formatDate(dateStr)}</strong> (${dayTrips.length} viajes)
        ${dayTrips.length > 0 ? `
        <div style="margin-top:8px;font-size:0.9rem">
          ${dayTrips.map(t => {
            const cn = DB.getById('clients', t.clienteId)?.nombre || '—';
            return `<div style="padding:4px 0">${t.hora || '—'} - ${App.escapeHtml(cn)} - ${App.escapeHtml(t.origen)} → ${App.escapeHtml(t.destino)} - ${App.getBadgeHtml(t.estado)}</div>`;
          }).join('')}
        </div>` : '<div style="color:var(--text-light);font-size:0.85rem;margin-top:4px">Sin viajes</div>'}
      </div>`;
    });

    App.showModal(html, 'Agenda semanal', true);
  },

  bindEvents() {
    document.getElementById('searchTrips')?.addEventListener('input', (e) => {
      this.searchTerm = e.target.value;
      this.renderTable();
    });
    document.getElementById('filterTrips')?.addEventListener('change', (e) => {
      this.filterStatus = e.target.value;
      this.renderTable();
    });
    document.getElementById('btnDayAgenda')?.addEventListener('click', () => this.showDayAgenda());
    document.getElementById('btnWeekAgenda')?.addEventListener('click', () => this.showWeekAgenda());
  },

  sort(key) {
    if (this.currentSort.key === key) this.currentSort.asc = !this.currentSort.asc;
    else { this.currentSort.key = key; this.currentSort.asc = true; }
    this.renderTable();
  },

  showForm(data = null, presetDate = '') {
    const isEdit = !!data;
    const d = data || {};
    const clients = DB.getAll('clients');
    const vehicles = DB.getAll('vehicles');
    const employees = DB.getAll('employees');

    App.showModal(`
      <div class="form-grid">
        <div class="form-group">
          <label>Fecha</label>
          <input type="date" id="t-fecha" value="${d.fecha || presetDate || App.getToday()}">
        </div>
        <div class="form-group">
          <label>Hora</label>
          <input type="time" id="t-hora" value="${d.hora || '08:00'}">
        </div>
        <div class="form-group">
          <label>Cliente</label>
          <div style="display:flex;gap:6px">
            <select id="t-cliente" onchange="Trips.onClientChange()" style="flex:1">
              <option value="">Seleccionar...</option>
              ${clients.map(c => `<option value="${c.id}" ${d.clienteId === c.id ? 'selected' : ''}>${c.nombre}${c.empresa ? ' - ' + c.empresa : ''}</option>`).join('')}
            </select>
            <button type="button" class="btn btn-secondary btn-sm" onclick="Trips.quickCreateClient()" title="Crear nuevo cliente"><i class="fas fa-plus"></i></button>
          </div>
        </div>
        <div class="form-group">
          <label>Teléfono</label>
          <div style="display:flex;gap:4px;align-items:center">
            <input type="text" id="t-telefono" value="${App.escapeHtml(d.telefono || '')}" style="flex:1" placeholder="Se completa al seleccionar cliente">
            <span style="font-size:0.75rem;color:var(--text-light);white-space:nowrap" id="t-phone-source"></span>
          </div>
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label>Origen</label>
          <div style="display:flex;gap:6px;align-items:center">
            <input type="text" id="t-origen" value="${App.escapeHtml(d.origen || '')}" placeholder="Dirección de origen del viaje" style="flex:1">
            <button type="button" class="btn btn-sm btn-secondary" id="btn-origen-cliente" style="display:none;white-space:nowrap" onclick="Trips.fillFromClient('origen')" title="Usar dirección del cliente"><i class="fas fa-user"></i> Cliente</button>
          </div>
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label>Destino</label>
          <div style="display:flex;gap:6px;align-items:center">
            <input type="text" id="t-destino" value="${App.escapeHtml(d.destino || '')}" placeholder="Dirección de destino del viaje" style="flex:1">
            <button type="button" class="btn btn-sm btn-secondary" id="btn-destino-cliente" style="display:none;white-space:nowrap" onclick="Trips.fillFromClient('destino')" title="Usar dirección del cliente"><i class="fas fa-user"></i> Cliente</button>
          </div>
        </div>
        <div style="grid-column:1/-1;display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
          <button type="button" class="btn btn-sm ${d._modoOrigen ? 'btn-primary' : 'btn-secondary'}" id="btn-marcar-origen" onclick="Trips.toggleMapMode('origen')">
            <i class="fas fa-circle" style="color:var(--info)"></i> Marcá origen
          </button>
          <button type="button" class="btn btn-sm ${d._modoDestino ? 'btn-primary' : 'btn-secondary'}" id="btn-marcar-destino" onclick="Trips.toggleMapMode('destino')">
            <i class="fas fa-circle" style="color:var(--secondary)"></i> Marcá destino
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="Trips.calculateRoute()"><i class="fas fa-route"></i> Trazar ruta</button>
          <span id="route-status" style="font-size:0.85rem;color:var(--text-light);align-self:center"></span>
        </div>
        <div id="map-container" style="grid-column:1/-1;height:280px;border-radius:var(--radius-sm);border:1px solid var(--border);margin-bottom:8px;overflow:hidden;cursor:crosshair"></div>
        <div id="route-info" style="grid-column:1/-1;display:none;margin-bottom:12px;padding:12px;background:var(--bg);border-radius:var(--radius-sm)">
          <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:center">
            <span><strong>Distancia:</strong> <span id="route-distance">—</span></span>
            <span><strong>Duración estimada:</strong> <span id="route-duration">—</span></span>
            <span><strong>Costo estimado:</strong> <span id="route-cost" style="color:var(--secondary);font-size:1.1rem">—</span></span>
            <button type="button" class="btn btn-primary btn-sm" onclick="Trips.applyRouteCost()"><i class="fas fa-check"></i> Aplicar precio</button>
          </div>
        </div>
        <div class="form-group">
          <label>Forma de pago</label>
          <select id="t-pago">
            ${['Efectivo','Transferencia','Tarjeta','Cheque'].map(p => `<option value="${p}" ${d.formaPago === p ? 'selected' : ''}>${p}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Vehículo</label>
          <select id="t-vehiculo" onchange="Trips.onVehicleChange()">
            <option value="">Seleccionar...</option>
            ${vehicles.map(v => `<option value="${v.id}" ${d.vehiculoId === v.id ? 'selected' : ''}>${v.numeroInterno} - ${v.marca} ${v.modelo}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Chofer</label>
          <div style="display:flex;gap:4px;align-items:center">
            <select id="t-chofer" style="flex:1">
              <option value="">Seleccionar...</option>
              ${employees.map(e => `<option value="${e.id}" ${d.choferId === e.id ? 'selected' : ''}>${e.nombre} ${e.apellido}</option>`).join('')}
            </select>
            <span style="font-size:0.75rem;color:var(--text-light);white-space:nowrap" id="t-driver-source"></span>
          </div>
        </div>
        <div class="form-group">
          <label>Precio ($)</label>
          <input type="number" id="t-precio" value="${d.precio || ''}" min="0">
        </div>
        <div class="form-group">
          <label>Estado</label>
          <select id="t-estado">
            ${['Pendiente','Programado','En curso','Finalizado','Cancelado'].map(s => `<option value="${s}" ${d.estado === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>KM inicial</label>
          <input type="number" id="t-kmInicial" value="${d.kmInicial || ''}" min="0">
        </div>
        <div class="form-group">
          <label>KM final</label>
          <input type="number" id="t-kmFinal" value="${d.kmFinal || ''}" min="0">
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label>Observaciones</label>
          <textarea id="t-observaciones">${App.escapeHtml(d.observaciones || '')}</textarea>
        </div>
      </div>
    `, isEdit ? 'Editar viaje' : 'Nuevo viaje', true);

    document.querySelector('#modalOverlay .modal-footer').innerHTML = `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="Trips.save('${d.id || ''}')">${isEdit ? 'Guardar' : 'Crear viaje'}</button>
    `;

    setTimeout(() => this._initMap(d), 300);
  },

  _initMap(d) {
    if (this._routeMap) {
      this._routeMap.remove();
      this._routeMap = null;
    }
    this._originMarker = null;
    this._destMarker = null;
    this._routeLine = null;
    this._originCoords = null;
    this._destCoords = null;
    this._mapMode = null;

    const map = L.map('map-container', { zoomControl: true, attributionControl: false })
      .setView([-34.921, -57.955], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
    }).addTo(map);

    const self = this;
    map.on('click', function(e) {
      if (self._mapMode === 'origen') {
        self._placeMarker(e.latlng, 'origen');
      } else if (self._mapMode === 'destino') {
        self._placeMarker(e.latlng, 'destino');
      }
    });

    setTimeout(() => map.invalidateSize(), 100);
    this._routeMap = map;
    this._mapMode = null;
  },

  toggleMapMode(target) {
    const btnOrg = document.getElementById('btn-marcar-origen');
    const btnDest = document.getElementById('btn-marcar-destino');
    if (this._mapMode === target) {
      this._mapMode = null;
      btnOrg.className = 'btn btn-sm btn-secondary';
      btnDest.className = 'btn btn-sm btn-secondary';
      document.getElementById('map-container').style.cursor = 'crosshair';
      return;
    }
    this._mapMode = target;
    btnOrg.className = 'btn btn-sm ' + (target === 'origen' ? 'btn-primary' : 'btn-secondary');
    btnDest.className = 'btn btn-sm ' + (target === 'destino' ? 'btn-primary' : 'btn-secondary');
    document.getElementById('map-container').style.cursor = 'crosshair';
  },

  _placeMarker(latlng, target) {
    const self = this;
    if (target === 'origen') {
      if (this._originMarker) this._routeMap.removeLayer(this._originMarker);
      this._originMarker = L.marker([latlng.lat, latlng.lng], { draggable: true }).addTo(this._routeMap);
      this._originMarker.bindPopup('Origen — Arrastrá para ajustar');
      this._originMarker.on('dragend', function() {
        const pos = this.getLatLng();
        self.reverseGeocode(pos.lat, pos.lng, 'origen');
      });
      this._originCoords = { lat: latlng.lat, lng: latlng.lng };
      this.reverseGeocode(latlng.lat, latlng.lng, 'origen');
    } else {
      if (this._destMarker) this._routeMap.removeLayer(this._destMarker);
      this._destMarker = L.marker([latlng.lat, latlng.lng], { draggable: true }).addTo(this._routeMap);
      this._destMarker.bindPopup('Destino — Arrastrá para ajustar');
      this._destMarker.on('dragend', function() {
        const pos = this.getLatLng();
        self.reverseGeocode(pos.lat, pos.lng, 'destino');
      });
      this._destCoords = { lat: latlng.lat, lng: latlng.lng };
      this.reverseGeocode(latlng.lat, latlng.lng, 'destino');
    }

    if (this._routeLine) {
      this._routeMap.removeLayer(this._routeLine);
      this._routeLine = null;
      document.getElementById('route-info').style.display = 'none';
    }

    this._mapMode = null;
    document.getElementById('btn-marcar-origen').className = 'btn btn-sm btn-secondary';
    document.getElementById('btn-marcar-destino').className = 'btn btn-sm btn-secondary';
  },

  onClientChange() {
    const clientId = document.getElementById('t-cliente').value;
    const phoneSource = document.getElementById('t-phone-source');
    const phoneInput = document.getElementById('t-telefono');
    const btnOrigen = document.getElementById('btn-origen-cliente');
    const btnDestino = document.getElementById('btn-destino-cliente');
    if (clientId) {
      const client = DB.getById('clients', clientId);
      if (client && client.telefono) {
        phoneInput.value = client.telefono;
        phoneSource.textContent = 'del cliente';
        phoneSource.style.color = 'var(--success)';
      } else {
        phoneSource.textContent = 'sin teléfono';
        phoneSource.style.color = 'var(--warning)';
      }
      if (client && client.direccion) {
        btnOrigen.style.display = 'inline-flex';
        btnDestino.style.display = 'inline-flex';
      } else {
        btnOrigen.style.display = 'none';
        btnDestino.style.display = 'none';
      }
    } else {
      phoneSource.textContent = '';
      btnOrigen.style.display = 'none';
      btnDestino.style.display = 'none';
    }
  },

  fillFromClient(target) {
    const clientId = document.getElementById('t-cliente').value;
    if (!clientId) return;
    const client = DB.getById('clients', clientId);
    if (client && client.direccion) {
      document.getElementById('t-' + target).value = client.direccion;
    }
  },

  onVehicleChange() {
    const vehicleId = document.getElementById('t-vehiculo').value;
    const driverSource = document.getElementById('t-driver-source');
    const choferSelect = document.getElementById('t-chofer');
    if (vehicleId) {
      const emp = DB.getAll('employees').find(e => e.vehiculoAsignado === vehicleId && e.estado === 'Activo');
      if (emp) {
        choferSelect.value = emp.id;
        driverSource.textContent = 'asignado';
        driverSource.style.color = 'var(--success)';
      } else {
        choferSelect.value = '';
        driverSource.textContent = 'sin chofer fijo';
        driverSource.style.color = 'var(--warning)';
      }
    } else {
      choferSelect.value = '';
      driverSource.textContent = '';
    }
  },

  calculateRoute() {
    if (!this._routeMap) this._initMap({});
    const origen = document.getElementById('t-origen').value.trim();
    const destino = document.getElementById('t-destino').value.trim();
    const statusEl = document.getElementById('route-status');
    const routeInfo = document.getElementById('route-info');

    if (!origen || !destino) {
      App.showToast('Completá origen y destino primero', 'warning');
      return;
    }

    let originCoords = this._originCoords;
    let destCoords = this._destCoords;

    const needsGeocoding = (coords, address) => {
      if (!coords) return true;
      if (!address) return true;
      return false;
    };

    statusEl.textContent = 'Buscando direcciones...';
    statusEl.style.color = 'var(--warning)';

    const tasks = [];
    if (needsGeocoding(originCoords, origen)) {
      tasks.push(this.geocode(origen));
    } else {
      tasks.push(Promise.resolve(originCoords));
    }
    if (needsGeocoding(destCoords, destino)) {
      tasks.push(this.geocode(destino));
    } else {
      tasks.push(Promise.resolve(destCoords));
    }

    Promise.all(tasks).then(([oc, dc]) => {
      if (!oc || !dc) {
        statusEl.textContent = 'No se encontraron una o ambas direcciones. Probá escribir calle y altura, o usá el mapa para marcar.';
        statusEl.style.color = 'var(--danger)';
        return;
      }

      this._originCoords = oc;
      this._destCoords = dc;

      statusEl.textContent = 'Calculando ruta...';

      this.getRoute(oc, dc).then(route => {
        if (!route) {
          statusEl.textContent = 'No se pudo calcular la ruta entre esos puntos';
          statusEl.style.color = 'var(--danger)';
          return;
        }

        this._drawRoute(oc, dc, route);
        routeInfo.style.display = 'block';

        const km = (route.distance / 1000).toFixed(1);
        const minutos = Math.round(route.duration / 60);
        const horas = Math.floor(minutos / 60);

        document.getElementById('route-distance').textContent = km + ' km';
        document.getElementById('route-duration').textContent = horas > 0 ? `${horas}h ${minutos % 60}min` : `${minutos} min`;

        const config = DB.getConfig();
        const clientId = document.getElementById('t-cliente').value;
        let precioKm = config.precioPorKm || 500;
        if (clientId) {
          const client = DB.getById('clients', clientId);
          if (client && client.precioPorKm) precioKm = client.precioPorKm;
        }
        const costo = Math.max(parseFloat(km) * precioKm, config.precioMinimo || 0);
        document.getElementById('route-cost').textContent = App.formatCurrency(costo);
        this._lastRouteCost = costo;
        this._lastRouteKm = parseFloat(km);

        statusEl.textContent = 'Ruta calculada';
        statusEl.style.color = 'var(--success)';
      });
    }).catch(() => {
      statusEl.textContent = 'Error al buscar direcciones';
      statusEl.style.color = 'var(--danger)';
    });
  },

  geocode(address) {
    const tryQuery = (q) => {
      return fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(q) + '&limit=1&countrycodes=ar', {
        headers: { 'User-Agent': 'FletesLaPlata/1.0' }
      }).then(r => r.json());
    };

    return tryQuery(address).then(data => {
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
      return tryQuery(address + ', Buenos Aires, Argentina').then(data2 => {
        if (data2 && data2.length > 0) {
          return { lat: parseFloat(data2[0].lat), lng: parseFloat(data2[0].lon) };
        }
        return null;
      });
    });
  },

  getRoute(origin, dest) {
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`;
    return fetch(url)
      .then(r => r.json())
      .then(data => {
        if (data && data.code === 'Ok' && data.routes && data.routes.length > 0) {
          return data.routes[0];
        }
        return null;
      });
  },

  _drawRoute(originCoords, destCoords, route) {
    if (this._originMarker) { this._routeMap.removeLayer(this._originMarker); this._originMarker = null; }
    if (this._destMarker) { this._routeMap.removeLayer(this._destMarker); this._destMarker = null; }
    if (this._routeLine) { this._routeMap.removeLayer(this._routeLine); this._routeLine = null; }

    const self = this;
    this._originMarker = L.marker([originCoords.lat, originCoords.lng], { draggable: true }).addTo(this._routeMap);
    this._originMarker.bindPopup('Origen — Arrastrá para ajustar');
    this._originMarker.on('dragend', function() {
      const pos = this.getLatLng();
      self._originCoords = { lat: pos.lat, lng: pos.lng };
      self.reverseGeocode(pos.lat, pos.lng, 'origen');
    });

    this._destMarker = L.marker([destCoords.lat, destCoords.lng], { draggable: true }).addTo(this._routeMap);
    this._destMarker.bindPopup('Destino — Arrastrá para ajustar');
    this._destMarker.on('dragend', function() {
      const pos = this.getLatLng();
      self._destCoords = { lat: pos.lat, lng: pos.lng };
      self.reverseGeocode(pos.lat, pos.lng, 'destino');
    });

    if (route && route.geometry && route.geometry.coordinates) {
      const latlngs = route.geometry.coordinates.map(c => [c[1], c[0]]);
      this._routeLine = L.polyline(latlngs, { color: '#BF2633', weight: 4, opacity: 0.8 }).addTo(this._routeMap);
      this._routeMap.fitBounds(latlngs, { padding: [50, 50] });
    } else {
      const all = [originCoords, destCoords].map(c => [c.lat, c.lng]);
      this._routeMap.fitBounds(all, { padding: [50, 50] });
    }
  },

  reverseGeocode(lat, lng, target) {
    const statusEl = document.getElementById('route-status');
    statusEl.textContent = 'Buscando dirección...';
    statusEl.style.color = 'var(--warning)';

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
    fetch(url, { headers: { 'User-Agent': 'FletesLaPlata/1.0' } })
      .then(r => r.json())
      .then(data => {
        if (data && data.display_name) {
          document.getElementById('t-' + target).value = data.display_name.split(',')[0].trim();
          statusEl.textContent = 'Dirección actualizada';
          statusEl.style.color = 'var(--success)';
          if (target === 'origen') {
            this._originCoords = { lat, lng };
          } else {
            this._destCoords = { lat, lng };
          }
          this._debouncedRecalculate();
        } else {
          statusEl.textContent = 'No se pudo obtener la dirección';
          statusEl.style.color = 'var(--danger)';
        }
      })
      .catch(() => {
        statusEl.textContent = 'Error al buscar dirección';
        statusEl.style.color = 'var(--danger)';
      });
  },

  _debouncedRecalculate() {
    if (this._recalcTimer) clearTimeout(this._recalcTimer);
    this._recalcTimer = setTimeout(() => {
      if (this._originCoords && this._destCoords) {
        const statusEl = document.getElementById('route-status');
        statusEl.textContent = 'Recalculando ruta...';
        statusEl.style.color = 'var(--warning)';

        this.getRoute(this._originCoords, this._destCoords).then(route => {
          if (!route) return;
          this._drawRoute(this._originCoords, this._destCoords, route);

          const km = (route.distance / 1000).toFixed(1);
          const minutos = Math.round(route.duration / 60);
          const horas = Math.floor(minutos / 60);
          document.getElementById('route-distance').textContent = km + ' km';
          document.getElementById('route-duration').textContent = horas > 0 ? `${horas}h ${minutos % 60}min` : `${minutos} min`;

          const config = DB.getConfig();
          const clientId = document.getElementById('t-cliente').value;
          let precioKm = config.precioPorKm || 500;
          if (clientId) {
            const client = DB.getById('clients', clientId);
            if (client && client.precioPorKm) precioKm = client.precioPorKm;
          }
          const costo = Math.max(parseFloat(km) * precioKm, config.precioMinimo || 0);
          document.getElementById('route-cost').textContent = App.formatCurrency(costo);
          this._lastRouteCost = costo;
          this._lastRouteKm = parseFloat(km);

          statusEl.textContent = 'Ruta recalculada';
          statusEl.style.color = 'var(--success)';
        });
      }
    }, 800);
  },

  applyRouteCost() {
    if (this._lastRouteCost !== undefined) {
      document.getElementById('t-precio').value = this._lastRouteCost;
    }
    if (this._lastRouteKm !== undefined) {
      const vehicleId = document.getElementById('t-vehiculo').value;
      if (vehicleId) {
        const v = DB.getById('vehicles', vehicleId);
        if (v) {
          document.getElementById('t-kmInicial').value = v.kilometraje || 0;
          document.getElementById('t-kmFinal').value = (v.kilometraje || 0) + Math.round(this._lastRouteKm);
        }
      }
    }
    App.showToast('Precio aplicado', 'success');
  },

  quickCreateClient() {
    this._tripFormData = {
      fecha: document.getElementById('t-fecha')?.value || App.getToday(),
      hora: document.getElementById('t-hora')?.value || '08:00',
      origen: document.getElementById('t-origen')?.value || '',
      destino: document.getElementById('t-destino')?.value || '',
      vehiculoId: document.getElementById('t-vehiculo')?.value || '',
      choferId: document.getElementById('t-chofer')?.value || '',
      precio: document.getElementById('t-precio')?.value || '',
      formaPago: document.getElementById('t-pago')?.value || 'Efectivo',
      estado: document.getElementById('t-estado')?.value || 'Pendiente',
      kmInicial: document.getElementById('t-kmInicial')?.value || '',
      kmFinal: document.getElementById('t-kmFinal')?.value || '',
      observaciones: document.getElementById('t-observaciones')?.value || '',
    };

    App.closeModal();

    App.showModal(`
      <div class="form-grid">
        <div class="form-group">
          <label>Nombre <span style="color:var(--danger)">*</span></label>
          <input type="text" id="qc-nombre" placeholder="Nombre del cliente">
        </div>
        <div class="form-group">
          <label>Empresa</label>
          <input type="text" id="qc-empresa" placeholder="Empresa (opcional)">
        </div>
        <div class="form-group">
          <label>Teléfono <span style="color:var(--danger)">*</span></label>
          <input type="text" id="qc-telefono" placeholder="Teléfono">
        </div>
        <div class="form-group">
          <label>Dirección</label>
          <input type="text" id="qc-direccion" placeholder="Dirección (opcional)">
        </div>
      </div>
    `, 'Nuevo cliente');

    document.querySelector('#modalOverlay .modal-footer').innerHTML = `
      <button class="btn btn-secondary" onclick="Trips.cancelQuickCreate()">Cancelar</button>
      <button class="btn btn-primary" onclick="Trips.saveQuickCreate()">Crear y usar</button>
    `;
  },

  cancelQuickCreate() {
    const prev = this._tripFormData || {};
    App.closeModal();
    this.showForm(Object.keys(prev).length ? prev : null, '');
  },

  saveQuickCreate() {
    const nombre = document.getElementById('qc-nombre').value.trim();
    const telefono = document.getElementById('qc-telefono').value.trim();
    if (!nombre) { App.showToast('El nombre es obligatorio', 'error'); return; }
    if (!telefono) { App.showToast('El teléfono es obligatorio', 'error'); return; }

    const client = DB.create('clients', {
      nombre,
      empresa: document.getElementById('qc-empresa').value.trim(),
      telefono,
      direccion: document.getElementById('qc-direccion').value.trim(),
      observaciones: '',
    });

    App.showToast('Cliente creado', 'success');
    App.closeModal();

    const prev = this._tripFormData || {};
    this.showForm({ clienteId: client.id, ...prev }, '');
  },

  save(id) {
    const destino = document.getElementById('t-destino').value.trim();
    const partes = destino.split(',').map(s => s.trim()).filter(s => s);
    const localidad = partes.length > 1 ? partes[partes.length - 1] : (partes[0] || '');
    const data = {
      fecha: document.getElementById('t-fecha').value,
      hora: document.getElementById('t-hora').value,
      clienteId: document.getElementById('t-cliente').value,
      telefono: document.getElementById('t-telefono').value.trim(),
      origen: document.getElementById('t-origen').value.trim(),
      destino,
      localidad,
      vehiculoId: document.getElementById('t-vehiculo').value,
      choferId: document.getElementById('t-chofer').value,
      precio: parseFloat(document.getElementById('t-precio').value) || 0,
      formaPago: document.getElementById('t-pago').value,
      kmInicial: parseInt(document.getElementById('t-kmInicial').value) || 0,
      kmFinal: parseInt(document.getElementById('t-kmFinal').value) || 0,
      estado: document.getElementById('t-estado').value,
      observaciones: document.getElementById('t-observaciones').value.trim(),
    };
    if (!data.clienteId || !data.origen || !data.destino) {
      App.showToast('Completá cliente, origen y destino', 'error');
      return;
    }
    if (id) { DB.update('trips', id, data); App.showToast('Viaje actualizado', 'success'); }
    else { DB.create('trips', data); App.showToast('Viaje creado', 'success'); }
    App.closeModal();
    this.renderTable();
    this.renderCalendar();
  },

  edit(id) {
    const t = DB.getById('trips', id);
    if (t) this.showForm(t);
  },

  confirmDelete(id) {
    if (confirm('¿Eliminar este viaje?')) {
      DB.delete('trips', id);
      App.showToast('Viaje eliminado', 'success');
      this.renderTable();
      this.renderCalendar();
    }
  }
};
