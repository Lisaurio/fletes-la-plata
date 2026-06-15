const Vehicles = {
  currentSort: { key: 'numeroInterno', asc: true },
  searchTerm: '',

  render() {
    this.renderTable();
    this.bindEvents();
  },

  getFiltered() {
    let list = DB.getAll('vehicles');
    if (this.searchTerm) {
      const s = this.searchTerm.toLowerCase();
      list = list.filter(v =>
        v.numeroInterno?.toLowerCase().includes(s) ||
        v.marca?.toLowerCase().includes(s) ||
        v.modelo?.toLowerCase().includes(s) ||
        v.patente?.toLowerCase().includes(s) ||
        v.tipo?.toLowerCase().includes(s) ||
        v.estado?.toLowerCase().includes(s)
      );
    }
    list.sort((a, b) => {
      let va = (a[this.currentSort.key] || '').toString().toLowerCase();
      let vb = (b[this.currentSort.key] || '').toString().toLowerCase();
      if (this.currentSort.key === 'año' || this.currentSort.key === 'kilometraje') {
        va = Number(a[this.currentSort.key] || 0);
        vb = Number(b[this.currentSort.key] || 0);
      }
      if (va < vb) return this.currentSort.asc ? -1 : 1;
      if (va > vb) return this.currentSort.asc ? 1 : -1;
      return 0;
    });
    return list;
  },

  renderTable() {
    const list = this.getFiltered();
    const container = document.getElementById('tableVehicles');
    const sortIcon = (key) => this.currentSort.key === key ? (this.currentSort.asc ? 'fa-sort-up' : 'fa-sort-down') : 'fa-sort';

    if (list.length === 0) {
      container.innerHTML = `<div class="empty-state"><i class="fas fa-truck"></i><h3>No hay vehículos</h3><p>Agregá el primer vehículo haciendo clic en "Nuevo vehículo".</p></div>`;
      return;
    }

    container.innerHTML = `
      <div class="table-container">
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th onclick="Vehicles.sort('numeroInterno')">N° <i class="fas ${sortIcon('numeroInterno')}"></i></th>
                <th onclick="Vehicles.sort('tipo')">Tipo <i class="fas ${sortIcon('tipo')}"></i></th>
                <th onclick="Vehicles.sort('marca')">Marca <i class="fas ${sortIcon('marca')}"></i></th>
                <th onclick="Vehicles.sort('modelo')">Modelo <i class="fas ${sortIcon('modelo')}"></i></th>
                <th onclick="Vehicles.sort('año')">Año <i class="fas ${sortIcon('año')}"></i></th>
                <th onclick="Vehicles.sort('patente')">Patente <i class="fas ${sortIcon('patente')}"></i></th>
                <th onclick="Vehicles.sort('kilometraje')">KM <i class="fas ${sortIcon('kilometraje')}"></i></th>
                <th onclick="Vehicles.sort('estado')">Estado <i class="fas ${sortIcon('estado')}"></i></th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${list.map(v => `
                <tr>
                  <td><strong>${App.escapeHtml(v.numeroInterno)}</strong></td>
                  <td>${App.escapeHtml(v.tipo)}</td>
                  <td>${App.escapeHtml(v.marca)}</td>
                  <td>${App.escapeHtml(v.modelo)}</td>
                  <td>${v.año}</td>
                  <td>${App.escapeHtml(v.patente)}</td>
                  <td>${v.kilometraje?.toLocaleString()}</td>
                  <td>${App.getBadgeHtml(v.estado)}</td>
                  <td>
                    <div class="table-actions">
                      <button class="btn-table edit" onclick="Vehicles.edit('${v.id}')" title="Editar"><i class="fas fa-edit"></i></button>
                      <button class="btn-table" onclick="Vehicles.showHistory('${v.id}')" title="Historial"><i class="fas fa-history"></i></button>
                      <button class="btn-table delete" onclick="Vehicles.confirmDelete('${v.id}')" title="Eliminar"><i class="fas fa-trash"></i></button>
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

  bindEvents() {
    document.getElementById('searchVehicles')?.addEventListener('input', (e) => {
      this.searchTerm = e.target.value;
      this.renderTable();
    });
  },

  sort(key) {
    if (this.currentSort.key === key) this.currentSort.asc = !this.currentSort.asc;
    else { this.currentSort.key = key; this.currentSort.asc = true; }
    this.renderTable();
  },

  showForm(data = null) {
    const isEdit = !!data;
    const title = isEdit ? 'Editar vehículo' : 'Nuevo vehículo';
    const d = data || {};

    App.showModal(`
      <div class="form-grid">
        <div class="form-group">
          <label>Número interno</label>
          <input type="text" id="v-numero" value="${App.escapeHtml(d.numeroInterno || '')}" placeholder="Ej: 011">
        </div>
        <div class="form-group">
          <label>Tipo</label>
          <select id="v-tipo">
            ${['Camión','Camioneta','Utilitario','Auto'].map(t => `<option value="${t}" ${d.tipo === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Marca</label>
          <input type="text" id="v-marca" value="${App.escapeHtml(d.marca || '')}" placeholder="Ej: Ford">
        </div>
        <div class="form-group">
          <label>Modelo</label>
          <input type="text" id="v-modelo" value="${App.escapeHtml(d.modelo || '')}" placeholder="Ej: Cargo">
        </div>
        <div class="form-group">
          <label>Año</label>
          <input type="number" id="v-año" value="${d.año || ''}" min="1990" max="2030">
        </div>
        <div class="form-group">
          <label>Patente</label>
          <input type="text" id="v-patente" value="${App.escapeHtml(d.patente || '')}" placeholder="Ej: AA123BB" style="text-transform:uppercase">
        </div>
        <div class="form-group">
          <label>Combustible</label>
          <select id="v-combustible">
            ${['Diesel','Nafta','GNC','Eléctrico'].map(t => `<option value="${t}" ${d.combustible === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Kilometraje actual</label>
          <input type="number" id="v-km" value="${d.kilometraje || 0}" min="0">
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label>Estado</label>
          <select id="v-estado">
            ${['Disponible','En viaje','En reparación','Fuera de servicio'].map(t => `<option value="${t}" ${d.estado === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
      </div>
    `, title);

    document.querySelector('#modalOverlay .modal-footer').innerHTML = `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="Vehicles.save('${d.id || ''}')">${isEdit ? 'Guardar cambios' : 'Crear vehículo'}</button>
    `;
  },

  save(id) {
    const data = {
      numeroInterno: document.getElementById('v-numero').value.trim(),
      tipo: document.getElementById('v-tipo').value,
      marca: document.getElementById('v-marca').value.trim(),
      modelo: document.getElementById('v-modelo').value.trim(),
      año: parseInt(document.getElementById('v-año').value) || 0,
      patente: document.getElementById('v-patente').value.trim().toUpperCase(),
      combustible: document.getElementById('v-combustible').value,
      kilometraje: parseInt(document.getElementById('v-km').value) || 0,
      estado: document.getElementById('v-estado').value,
    };

    if (!data.numeroInterno || !data.marca) {
      App.showToast('Completá los campos obligatorios', 'error');
      return;
    }

    if (id) {
      DB.update('vehicles', id, data);
      App.showToast('Vehículo actualizado', 'success');
    } else {
      DB.create('vehicles', data);
      App.showToast('Vehículo creado', 'success');
    }
    App.closeModal();
    this.renderTable();
  },

  edit(id) {
    const v = DB.getById('vehicles', id);
    if (v) this.showForm(v);
  },

  confirmDelete(id) {
    const v = DB.getById('vehicles', id);
    if (!v) return;
    if (confirm(`¿Eliminar el vehículo ${v.numeroInterno} - ${v.marca} ${v.modelo}?`)) {
      DB.delete('vehicles', id);
      App.showToast('Vehículo eliminado', 'success');
      this.renderTable();
    }
  },

  showHistory(id) {
    const v = DB.getById('vehicles', id);
    if (!v) return;

    const fuelLogs = DB.getAll('fuelLogs').filter(f => f.vehicleId === id);
    const repairs = DB.getAll('repairs').filter(r => r.vehicleId === id);
    const trips = DB.getAll('trips').filter(t => t.vehiculoId === id);

    const totalFuel = fuelLogs.reduce((s, f) => s + f.costo, 0);
    const totalRepairs = repairs.reduce((s, r) => s + r.costo, 0);
    const totalFuelLitros = fuelLogs.reduce((s, f) => s + f.litros, 0);
    const kmRecorridos = trips.filter(t => t.estado === 'Finalizado').reduce((s, t) => s + ((t.kmFinal || 0) - (t.kmInicial || 0)), 0);
    const consumoPromedio = kmRecorridos > 0 ? (totalFuelLitros / kmRecorridos * 100).toFixed(1) : 'N/A';
    const costoPorKm = kmRecorridos > 0 ? (totalFuel / kmRecorridos).toFixed(0) : 'N/A';

    App.showModal(`
      <div style="margin-bottom:20px">
        <h4 style="font-size:1.1rem;margin-bottom:8px">${v.marca} ${v.modelo} - ${v.patente}</h4>
        <div class="stats-grid">
          <div class="stat-item"><span class="stat-label">Gasto combustible</span><span class="stat-value">${App.formatCurrency(totalFuel)}</span></div>
          <div class="stat-item"><span class="stat-label">Gasto reparaciones</span><span class="stat-value">${App.formatCurrency(totalRepairs)}</span></div>
          <div class="stat-item"><span class="stat-label">Consumo promedio</span><span class="stat-value">${consumoPromedio} L/100km</span></div>
          <div class="stat-item"><span class="stat-label">Costo por km</span><span class="stat-value">${App.formatCurrency(costoPorKm)}/km</span></div>
        </div>
      </div>
      <div class="tabs">
        <button class="tab active" onclick="Vehicles.switchTab(this,'fuel')">Combustible</button>
        <button class="tab" onclick="Vehicles.switchTab(this,'repairs')">Reparaciones</button>
        <button class="tab" onclick="Vehicles.switchTab(this,'trips')">Viajes</button>
      </div>
      <div id="v-history-content">
        ${fuelLogs.length ? `
        <table>
          <thead><tr><th>Fecha</th><th>Litros</th><th>Costo</th><th>KM</th></tr></thead>
          <tbody>${fuelLogs.map(f => `<tr><td>${App.formatDate(f.fecha)}</td><td>${f.litros}</td><td>${App.formatCurrency(f.costo)}</td><td>${f.kmActual?.toLocaleString()}</td></tr>`).join('')}</tbody>
        </table>
        ` : '<p style="color:var(--text-light);padding:20px">Sin registros de combustible.</p>'}
      </div>
    `, `Historial - ${v.marca} ${v.modelo}`, true);

    window._vh = { fuelLogs, repairs, trips };
  },

  switchTab(el, tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    const data = window._vh || {};
    let html = '';
    if (tab === 'fuel') {
      const f = data.fuelLogs || [];
      html = f.length ? `<table><thead><tr><th>Fecha</th><th>Litros</th><th>Costo</th><th>KM</th></tr></thead><tbody>${f.map(i => `<tr><td>${App.formatDate(i.fecha)}</td><td>${i.litros}</td><td>${App.formatCurrency(i.costo)}</td><td>${i.kmActual?.toLocaleString()}</td></tr>`).join('')}</tbody></table>` : '<p style="color:var(--text-light);padding:20px">Sin registros.</p>';
    } else if (tab === 'repairs') {
      const r = data.repairs || [];
      html = r.length ? `<table><thead><tr><th>Fecha</th><th>Descripción</th><th>Tipo</th><th>Costo</th><th>KM</th></tr></thead><tbody>${r.map(i => `<tr><td>${App.formatDate(i.fecha)}</td><td>${App.escapeHtml(i.descripcion)}</td><td>${App.getBadgeHtml(i.tipo === 'Preventivo' ? 'Disponible' : 'En reparación')}</td><td>${App.formatCurrency(i.costo)}</td><td>${i.kmActual?.toLocaleString()}</td></tr>`).join('')}</tbody></table>` : '<p style="color:var(--text-light);padding:20px">Sin registros.</p>';
    } else {
      const vt = data.trips || [];
      html = vt.length ? `<table><thead><tr><th>Fecha</th><th>Origen</th><th>Destino</th><th>Precio</th><th>Estado</th></tr></thead><tbody>${vt.map(i => `<tr><td>${App.formatDate(i.fecha)}</td><td>${App.escapeHtml(i.origen)}</td><td>${App.escapeHtml(i.destino)}</td><td>${App.formatCurrency(i.precio)}</td><td>${App.getBadgeHtml(i.estado)}</td></tr>`).join('')}</tbody></table>` : '<p style="color:var(--text-light);padding:20px">Sin viajes.</p>';
    }
    document.getElementById('v-history-content').innerHTML = html;
  }
};
