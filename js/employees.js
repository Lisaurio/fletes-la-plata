const Employees = {
  currentSort: { key: 'apellido', asc: true },
  searchTerm: '',

  render() {
    this.renderTable();
    this.bindEvents();
  },

  getFiltered() {
    let list = DB.getAll('employees');
    const trips = DB.getAll('trips');
    if (this.searchTerm) {
      const s = this.searchTerm.toLowerCase();
      list = list.filter(e =>
        e.nombre?.toLowerCase().includes(s) ||
        e.apellido?.toLowerCase().includes(s) ||
        e.dni?.includes(s) ||
        e.telefono?.includes(s) ||
        e.estado?.toLowerCase().includes(s)
      );
    }
    list = list.map(e => {
      const viajesEmp = trips.filter(t => t.choferId === e.id);
      const finalizados = viajesEmp.filter(t => t.estado === 'Finalizado');
      const totalHoras = finalizados.length * 4;
      const totalGenerado = finalizados.reduce((s, t) => s + (t.precio || 0), 0);
      return { ...e, viajesCount: viajesEmp.length, totalHoras, totalGenerado };
    });
    list.sort((a, b) => {
      let va = (a[this.currentSort.key] || '');
      let vb = (b[this.currentSort.key] || '');
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (typeof va === 'number') { if (va < vb) return this.currentSort.asc ? -1 : 1; if (va > vb) return this.currentSort.asc ? 1 : -1; return 0; }
      if (va < vb) return this.currentSort.asc ? -1 : 1;
      if (va > vb) return this.currentSort.asc ? 1 : -1;
      return 0;
    });
    return list;
  },

  renderTable() {
    const list = this.getFiltered();
    const container = document.getElementById('tableEmployees');
    const sortIcon = (key) => this.currentSort.key === key ? (this.currentSort.asc ? 'fa-sort-up' : 'fa-sort-down') : 'fa-sort';

    if (list.length === 0) {
      container.innerHTML = `<div class="empty-state"><i class="fas fa-users"></i><h3>No hay empleados</h3><p>Agregá el primer empleado.</p></div>`;
      return;
    }

    container.innerHTML = `
      <div class="table-container">
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th onclick="Employees.sort('apellido')">Apellido <i class="fas ${sortIcon('apellido')}"></i></th>
                <th onclick="Employees.sort('nombre')">Nombre <i class="fas ${sortIcon('nombre')}"></i></th>
                <th onclick="Employees.sort('dni')">DNI <i class="fas ${sortIcon('dni')}"></i></th>
                <th>Teléfono</th>
                <th>Vehículo</th>
                <th onclick="Employees.sort('viajesCount')">Viajes <i class="fas ${sortIcon('viajesCount')}"></i></th>
                <th onclick="Employees.sort('totalHoras')">Horas <i class="fas ${sortIcon('totalHoras')}"></i></th>
                <th onclick="Employees.sort('totalGenerado')">Generado <i class="fas ${sortIcon('totalGenerado')}"></i></th>
                <th onclick="Employees.sort('estado')">Estado <i class="fas ${sortIcon('estado')}"></i></th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${list.map(e => {
                const v = e.vehiculoAsignado ? DB.getById('vehicles', e.vehiculoAsignado) : null;
                return `<tr>
                  <td><strong>${App.escapeHtml(e.apellido)}</strong></td>
                  <td>${App.escapeHtml(e.nombre)}</td>
                  <td>${App.escapeHtml(e.dni)}</td>
                  <td>${App.escapeHtml(e.telefono)}</td>
                  <td>${v ? `${v.marca} ${v.modelo}` : '<span style="color:var(--text-light)">—</span>'}</td>
                  <td>${e.viajesCount}</td>
                  <td>${e.totalHoras}h</td>
                  <td>${App.formatCurrency(e.totalGenerado)}</td>
                  <td>${App.getBadgeHtml(e.estado)}</td>
                  <td>
                    <div class="table-actions">
                      <button class="btn-table edit" onclick="Employees.edit('${e.id}')" title="Editar"><i class="fas fa-edit"></i></button>
                      <button class="btn-table delete" onclick="Employees.confirmDelete('${e.id}')" title="Eliminar"><i class="fas fa-trash"></i></button>
                    </div>
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  bindEvents() {
    document.getElementById('searchEmployees')?.addEventListener('input', (e) => {
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
    const vehicles = DB.getAll('vehicles');

    App.showModal(`
      <div class="form-grid">
        <div class="form-group">
          <label>Nombre</label>
          <input type="text" id="e-nombre" value="${App.escapeHtml(d.nombre || '')}">
        </div>
        <div class="form-group">
          <label>Apellido</label>
          <input type="text" id="e-apellido" value="${App.escapeHtml(d.apellido || '')}">
        </div>
        <div class="form-group">
          <label>DNI</label>
          <input type="text" id="e-dni" value="${App.escapeHtml(d.dni || '')}">
        </div>
        <div class="form-group">
          <label>Teléfono</label>
          <input type="text" id="e-telefono" value="${App.escapeHtml(d.telefono || '')}">
        </div>
        <div class="form-group">
          <label>Vehículo asignado</label>
          <select id="e-vehiculo">
            <option value="">Sin vehículo</option>
            ${vehicles.map(v => `<option value="${v.id}" ${d.vehiculoAsignado === v.id ? 'selected' : ''}>${v.numeroInterno} - ${v.marca} ${v.modelo}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Estado</label>
          <select id="e-estado">
            ${['Activo','Inactivo','Vacaciones'].map(t => `<option value="${t}" ${d.estado === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
      </div>
    `, isEdit ? 'Editar empleado' : 'Nuevo empleado');

    document.querySelector('#modalOverlay .modal-footer').innerHTML = `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="Employees.save('${d.id || ''}')">${isEdit ? 'Guardar' : 'Crear'}</button>
    `;
  },

  save(id) {
    const data = {
      nombre: document.getElementById('e-nombre').value.trim(),
      apellido: document.getElementById('e-apellido').value.trim(),
      dni: document.getElementById('e-dni').value.trim(),
      telefono: document.getElementById('e-telefono').value.trim(),
      vehiculoAsignado: document.getElementById('e-vehiculo').value,
      estado: document.getElementById('e-estado').value,
    };
    if (!data.nombre || !data.apellido) {
      App.showToast('Completá nombre y apellido', 'error');
      return;
    }
    if (id) { DB.update('employees', id, data); App.showToast('Empleado actualizado', 'success'); }
    else { DB.create('employees', data); App.showToast('Empleado creado', 'success'); }
    App.closeModal();
    this.renderTable();
  },

  edit(id) {
    const e = DB.getById('employees', id);
    if (e) this.showForm(e);
  },

  confirmDelete(id) {
    const e = DB.getById('employees', id);
    if (!e) return;
    if (confirm(`¿Eliminar a ${e.nombre} ${e.apellido}?`)) {
      DB.delete('employees', id);
      App.showToast('Empleado eliminado', 'success');
      this.renderTable();
    }
  }
};
