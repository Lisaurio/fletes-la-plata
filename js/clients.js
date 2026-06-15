const Clients = {
  currentSort: { key: 'nombre', asc: true },
  searchTerm: '',

  render() {
    this.renderTable();
    this.bindEvents();
  },

  getFiltered() {
    let list = DB.getAll('clients');
    const trips = DB.getAll('trips');
    if (this.searchTerm) {
      const s = this.searchTerm.toLowerCase();
      list = list.filter(c =>
        c.nombre?.toLowerCase().includes(s) ||
        c.empresa?.toLowerCase().includes(s) ||
        c.telefono?.includes(s) ||
        c.direccion?.toLowerCase().includes(s)
      );
    }
    list = list.map(c => {
      const viajesCli = trips.filter(t => t.clienteId === c.id);
      const facturacion = viajesCli.filter(t => t.estado === 'Finalizado').reduce((s, t) => s + (t.precio || 0), 0);
      return { ...c, viajesCount: viajesCli.length, facturacion };
    });
    list.sort((a, b) => {
      let va = (a[this.currentSort.key] || '').toString().toLowerCase();
      let vb = (b[this.currentSort.key] || '').toString().toLowerCase();
      if (typeof a[this.currentSort.key] === 'number') { va = a[this.currentSort.key] || 0; vb = b[this.currentSort.key] || 0; }
      if (va < vb) return this.currentSort.asc ? -1 : 1;
      if (va > vb) return this.currentSort.asc ? 1 : -1;
      return 0;
    });
    return list;
  },

  renderTable() {
    const list = this.getFiltered();
    const container = document.getElementById('tableClients');
    const sortIcon = (key) => this.currentSort.key === key ? (this.currentSort.asc ? 'fa-sort-up' : 'fa-sort-down') : 'fa-sort';

    if (list.length === 0) {
      container.innerHTML = `<div class="empty-state"><i class="fas fa-building"></i><h3>No hay clientes</h3><p>Agregá el primer cliente.</p></div>`;
      return;
    }

    container.innerHTML = `
      <div class="table-container">
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th onclick="Clients.sort('nombre')">Nombre <i class="fas ${sortIcon('nombre')}"></i></th>
                <th onclick="Clients.sort('empresa')">Empresa <i class="fas ${sortIcon('empresa')}"></i></th>
                <th>Teléfono</th>
                <th>Dirección</th>
                <th onclick="Clients.sort('viajesCount')">Viajes <i class="fas ${sortIcon('viajesCount')}"></i></th>
                <th onclick="Clients.sort('facturacion')">Facturación <i class="fas ${sortIcon('facturacion')}"></i></th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${list.map(c => `
                <tr>
                  <td><strong>${App.escapeHtml(c.nombre)}</strong></td>
                  <td>${App.escapeHtml(c.empresa)}</td>
                  <td>${App.escapeHtml(c.telefono)}</td>
                  <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${App.escapeHtml(c.direccion)}">${App.escapeHtml(c.direccion)}</td>
                  <td>${c.viajesCount}</td>
                  <td>${App.formatCurrency(c.facturacion)}</td>
                  <td>
                    <div class="table-actions">
                      <button class="btn-table edit" onclick="Clients.edit('${c.id}')" title="Editar"><i class="fas fa-edit"></i></button>
                      <button class="btn-table delete" onclick="Clients.confirmDelete('${c.id}')" title="Eliminar"><i class="fas fa-trash"></i></button>
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
    document.getElementById('searchClients')?.addEventListener('input', (e) => {
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
    const d = data || {};
    App.showModal(`
      <div class="form-grid">
        <div class="form-group">
          <label>Nombre</label>
          <input type="text" id="c-nombre" value="${App.escapeHtml(d.nombre || '')}">
        </div>
        <div class="form-group">
          <label>Empresa</label>
          <input type="text" id="c-empresa" value="${App.escapeHtml(d.empresa || '')}">
        </div>
        <div class="form-group">
          <label>Teléfono</label>
          <input type="text" id="c-telefono" value="${App.escapeHtml(d.telefono || '')}">
        </div>
        <div class="form-group">
          <label>Dirección</label>
          <input type="text" id="c-direccion" value="${App.escapeHtml(d.direccion || '')}">
        </div>
        <div class="form-group">
          <label>Precio por km</label>
          <input type="number" id="c-precioKm" value="${d.precioPorKm ?? ''}" min="0" placeholder="Usar precio global">
          <span style="font-size:0.75rem;color:var(--text-light)">Si se deja vacío, se usa el precio por km global</span>
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label>Observaciones</label>
          <textarea id="c-observaciones">${App.escapeHtml(d.observaciones || '')}</textarea>
        </div>
      </div>
    `, isEdit ? 'Editar cliente' : 'Nuevo cliente');

    document.querySelector('#modalOverlay .modal-footer').innerHTML = `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="Clients.save('${d.id || ''}')">${isEdit ? 'Guardar' : 'Crear'}</button>
    `;
  },

  save(id) {
    const data = {
      nombre: document.getElementById('c-nombre').value.trim(),
      empresa: document.getElementById('c-empresa').value.trim(),
      telefono: document.getElementById('c-telefono').value.trim(),
      direccion: document.getElementById('c-direccion').value.trim(),
      observaciones: document.getElementById('c-observaciones').value.trim(),
      precioPorKm: document.getElementById('c-precioKm').value ? parseFloat(document.getElementById('c-precioKm').value) : null,
    };
    if (!data.nombre) { App.showToast('El nombre es obligatorio', 'error'); return; }
    if (id) { DB.update('clients', id, data); App.showToast('Cliente actualizado', 'success'); }
    else { DB.create('clients', data); App.showToast('Cliente creado', 'success'); }
    App.closeModal();
    this.renderTable();
  },

  edit(id) {
    const c = DB.getById('clients', id);
    if (c) this.showForm(c);
  },

  confirmDelete(id) {
    const c = DB.getById('clients', id);
    if (!c) return;
    if (confirm(`¿Eliminar a ${c.nombre}?`)) {
      DB.delete('clients', id);
      App.showToast('Cliente eliminado', 'success');
      this.renderTable();
    }
  }
};
