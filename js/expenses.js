const Expenses = {
  currentSort: { key: 'fecha', asc: false },
  searchTerm: '',
  filterType: '',

  render() {
    this.renderTable();
    this.renderSummary();
    this.bindEvents();
  },

  getFiltered() {
    let list = DB.getAll('expenses');
    if (this.searchTerm) {
      const s = this.searchTerm.toLowerCase();
      list = list.filter(e =>
        e.descripcion?.toLowerCase().includes(s) ||
        e.tipo?.toLowerCase().includes(s)
      );
    }
    if (this.filterType) {
      list = list.filter(e => e.tipo === this.filterType);
    }
    list.sort((a, b) => {
      let va = a[this.currentSort.key] || '';
      let vb = b[this.currentSort.key] || '';
      if (this.currentSort.key === 'monto') { va = Number(va); vb = Number(vb); }
      if (typeof va === 'string') va = va.toLowerCase();
      if (va < vb) return this.currentSort.asc ? -1 : 1;
      if (va > vb) return this.currentSort.asc ? 1 : -1;
      return 0;
    });
    return list;
  },

  renderTable() {
    const list = this.getFiltered();
    const container = document.getElementById('tableExpenses');
    const sortIcon = (key) => this.currentSort.key === key ? (this.currentSort.asc ? 'fa-sort-up' : 'fa-sort-down') : 'fa-sort';

    if (list.length === 0) {
      container.innerHTML = `<div class="empty-state"><i class="fas fa-wallet"></i><h3>No hay gastos</h3><p>Registrá el primer gasto.</p></div>`;
      return;
    }

    container.innerHTML = `
      <div class="table-container">
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th onclick="Expenses.sort('fecha')">Fecha <i class="fas ${sortIcon('fecha')}"></i></th>
                <th onclick="Expenses.sort('tipo')">Tipo <i class="fas ${sortIcon('tipo')}"></i></th>
                <th onclick="Expenses.sort('descripcion')">Descripción <i class="fas ${sortIcon('descripcion')}"></i></th>
                <th onclick="Expenses.sort('monto')">Monto <i class="fas ${sortIcon('monto')}"></i></th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${list.map(e => `
                <tr>
                  <td>${App.formatDate(e.fecha)}</td>
                  <td><span class="badge badge-${e.tipo === 'Combustible' ? 'en-curso' : e.tipo === 'Peaje' ? 'programado' : e.tipo === 'Reparación' ? 'pendiente' : e.tipo === 'Sueldo' ? 'finalizado' : e.tipo === 'Seguro' ? 'disponible' : 'cancelado'}">${App.escapeHtml(e.tipo)}</span></td>
                  <td>${App.escapeHtml(e.descripcion)}</td>
                  <td><strong>${App.formatCurrency(e.monto)}</strong></td>
                  <td>
                    <div class="table-actions">
                      <button class="btn-table edit" onclick="Expenses.edit('${e.id}')" title="Editar"><i class="fas fa-edit"></i></button>
                      <button class="btn-table delete" onclick="Expenses.confirmDelete('${e.id}')" title="Eliminar"><i class="fas fa-trash"></i></button>
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

  renderSummary() {
    const expenses = DB.getAll('expenses');
    const types = ['Combustible', 'Peaje', 'Reparaci\u00f3n', 'Sueldo', 'Seguro', 'Otro'];
    const icons = { 'Combustible': 'fa-gas-pump', 'Peaje': 'fa-toll-road', 'Reparaci\u00f3n': 'fa-wrench', 'Sueldo': 'fa-money-bill-wave', 'Seguro': 'fa-shield-alt', 'Otro': 'fa-ellipsis-h' };
    const colors = { 'Combustible': 'orange', 'Peaje': 'blue', 'Reparaci\u00f3n': 'red', 'Sueldo': 'green', 'Seguro': 'purple', 'Otro': 'teal' };

    const totals = {};
    types.forEach(t => totals[t] = 0);
    expenses.forEach(e => { if (totals[e.tipo] !== undefined) totals[e.tipo] += e.monto || 0; });
    const totalGeneral = Object.values(totals).reduce((s, v) => s + v, 0);

    let cardsHtml = types.map(t => `
      <div class="card">
        <div class="card-header">
          <span class="card-label">${t}</span>
          <div class="card-icon ${colors[t]}"><i class="fas ${icons[t]}"></i></div>
        </div>
        <div class="card-value">${App.formatCurrency(totals[t])}</div>
        <div class="card-sub">${totalGeneral > 0 ? ((totals[t] / totalGeneral) * 100).toFixed(1) : 0}% del total</div>
      </div>
    `).join('');

    document.getElementById('expensesSummary').innerHTML = cardsHtml;
  },

  bindEvents() {
    document.getElementById('searchExpenses')?.addEventListener('input', (e) => {
      this.searchTerm = e.target.value;
      this.renderTable();
    });
    document.getElementById('filterExpenses')?.addEventListener('change', (e) => {
      this.filterType = e.target.value;
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
          <label>Fecha</label>
          <input type="date" id="g-fecha" value="${d.fecha || App.getToday()}">
        </div>
        <div class="form-group">
          <label>Tipo</label>
          <select id="g-tipo">
            ${['Combustible','Peaje','Reparación','Sueldo','Seguro','Otro'].map(t => `<option value="${t}" ${d.tipo === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label>Descripción</label>
          <input type="text" id="g-descripcion" value="${App.escapeHtml(d.descripcion || '')}">
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label>Monto ($)</label>
          <input type="number" id="g-monto" value="${d.monto || ''}" min="0">
        </div>
      </div>
    `, isEdit ? 'Editar gasto' : 'Nuevo gasto');

    document.querySelector('#modalOverlay .modal-footer').innerHTML = `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="Expenses.save('${d.id || ''}')">${isEdit ? 'Guardar' : 'Crear'}</button>
    `;
  },

  save(id) {
    const data = {
      fecha: document.getElementById('g-fecha').value,
      tipo: document.getElementById('g-tipo').value,
      descripcion: document.getElementById('g-descripcion').value.trim(),
      monto: parseFloat(document.getElementById('g-monto').value) || 0,
    };
    if (!data.descripcion || data.monto <= 0) {
      App.showToast('Completá descripción y monto', 'error');
      return;
    }
    if (id) { DB.update('expenses', id, data); App.showToast('Gasto actualizado', 'success'); }
    else { DB.create('expenses', data); App.showToast('Gasto registrado', 'success'); }
    App.closeModal();
    this.renderTable();
    this.renderSummary();
  },

  edit(id) {
    const e = DB.getById('expenses', id);
    if (e) this.showForm(e);
  },

  confirmDelete(id) {
    if (confirm('¿Eliminar este gasto?')) {
      DB.delete('expenses', id);
      App.showToast('Gasto eliminado', 'success');
      this.renderTable();
      this.renderSummary();
    }
  }
};
