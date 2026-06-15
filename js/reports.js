const Reports = {
  charts: {},

  render() {
    this.renderMonthlyReport();
    this.renderRankings();
  },

  renderMonthlyReport() {
    const trips = DB.getAll('trips');
    const expenses = DB.getAll('expenses');
    const months = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push(key);
    }

    const monthNames = months.map(m => {
      const [y, mo] = m.split('-');
      const date = new Date(parseInt(y), parseInt(mo) - 1, 1);
      return date.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' });
    });

    const billingData = months.map(m => {
      return trips.filter(t => t.fecha.startsWith(m) && t.estado === 'Finalizado')
        .reduce((s, t) => s + (t.precio || 0), 0);
    });

    const expensesData = months.map(m => {
      return expenses.filter(e => e.fecha.startsWith(m))
        .reduce((s, e) => s + (e.monto || 0), 0);
    });

    const profitData = billingData.map((b, i) => b - expensesData[i]);

    this.destroyCharts();

    new Chart(document.getElementById('chartMonthly'), {
      type: 'bar',
      data: {
        labels: monthNames,
        datasets: [
          { label: 'Facturación', data: billingData, backgroundColor: '#223462', borderRadius: 4 },
          { label: 'Gastos', data: expensesData, backgroundColor: '#BF2633', borderRadius: 4 },
          { label: 'Ganancia', data: profitData, backgroundColor: '#27ae60', borderRadius: 4 },
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { usePointStyle: true, padding: 16, font: { family: 'Lato' } } }
        },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { family: 'Lato' } } },
          x: { grid: { display: false }, ticks: { font: { family: 'Lato' } } }
        }
      }
    });

    document.getElementById('monthlyTotals').innerHTML = `
      <div class="stats-grid">
        <div class="stat-item"><span class="stat-label">Total facturado (12 meses)</span><span class="stat-value">${App.formatCurrency(billingData.reduce((s, v) => s + v, 0))}</span></div>
        <div class="stat-item"><span class="stat-label">Total gastos (12 meses)</span><span class="stat-value">${App.formatCurrency(expensesData.reduce((s, v) => s + v, 0))}</span></div>
        <div class="stat-item"><span class="stat-label">Ganancia neta (12 meses)</span><span class="stat-value">${App.formatCurrency(profitData.reduce((s, v) => s + v, 0))}</span></div>
        <div class="stat-item"><span class="stat-label">Margen de ganancia</span><span class="stat-value">${billingData.reduce((s, v) => s + v, 0) > 0 ? ((profitData.reduce((s, v) => s + v, 0) / billingData.reduce((s, v) => s + v, 0)) * 100).toFixed(1) + '%' : 'N/A'}</span></div>
      </div>
    `;
  },

  renderRankings() {
    const trips = DB.getAll('trips');
    const vehicles = DB.getAll('vehicles');
    const employees = DB.getAll('employees');
    const clients = DB.getAll('clients');

    const vehicleRevenue = {};
    vehicles.forEach(v => {
      vehicleRevenue[v.id] = { name: `${v.marca} ${v.modelo} (${v.numeroInterno})`, revenue: 0, count: 0 };
    });
    trips.filter(t => t.estado === 'Finalizado').forEach(t => {
      if (vehicleRevenue[t.vehiculoId]) {
        vehicleRevenue[t.vehiculoId].revenue += t.precio || 0;
        vehicleRevenue[t.vehiculoId].count++;
      }
    });
    const vehicleRanking = Object.values(vehicleRevenue).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    const employeeProductivity = {};
    employees.forEach(e => {
      employeeProductivity[e.id] = { name: `${e.nombre} ${e.apellido}`, revenue: 0, count: 0 };
    });
    trips.filter(t => t.estado === 'Finalizado').forEach(t => {
      if (employeeProductivity[t.choferId]) {
        employeeProductivity[t.choferId].revenue += t.precio || 0;
        employeeProductivity[t.choferId].count++;
      }
    });
    const employeeRanking = Object.values(employeeProductivity).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    const clientRanking = {};
    clients.forEach(c => {
      clientRanking[c.id] = { name: c.nombre, revenue: 0, count: 0 };
    });
    trips.filter(t => t.estado === 'Finalizado').forEach(t => {
      if (clientRanking[t.clienteId]) {
        clientRanking[t.clienteId].revenue += t.precio || 0;
        clientRanking[t.clienteId].count++;
      }
    });
    const clientRankingArr = Object.values(clientRanking).sort((a, b) => b.count - a.count).slice(0, 5);

    document.getElementById('rankings').innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px">
        <div class="chart-card">
          <h3><i class="fas fa-trophy" style="color:var(--warning)"></i> Vehículos más rentables</h3>
          <div style="margin-top:12px">
            ${vehicleRanking.map((v, i) => `
              <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">
                <div style="width:28px;height:28px;border-radius:50%;background:${i === 0 ? 'var(--warning)' : i === 1 ? 'var(--text-light)' : i === 2 ? '#cd7f32' : 'var(--bg)'};color:${i < 3 ? '#fff' : 'var(--text)'};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem">${i + 1}</div>
                <div style="flex:1"><strong>${App.escapeHtml(v.name)}</strong><div style="font-size:0.8rem;color:var(--text-light)">${v.count} viajes</div></div>
                <div style="font-weight:700;color:var(--text)">${App.formatCurrency(v.revenue)}</div>
              </div>
            `).join('')}
            ${vehicleRanking.length === 0 ? '<p style="color:var(--text-light)">Sin datos</p>' : ''}
          </div>
        </div>
        <div class="chart-card">
          <h3><i class="fas fa-star" style="color:var(--secondary)"></i> Empleados más productivos</h3>
          <div style="margin-top:12px">
            ${employeeRanking.map((e, i) => `
              <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">
                <div style="width:28px;height:28px;border-radius:50%;background:${i === 0 ? 'var(--warning)' : i === 1 ? 'var(--text-light)' : i === 2 ? '#cd7f32' : 'var(--bg)'};color:${i < 3 ? '#fff' : 'var(--text)'};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem">${i + 1}</div>
                <div style="flex:1"><strong>${App.escapeHtml(e.name)}</strong><div style="font-size:0.8rem;color:var(--text-light)">${e.count} viajes</div></div>
                <div style="font-weight:700;color:var(--text)">${App.formatCurrency(e.revenue)}</div>
              </div>
            `).join('')}
            ${employeeRanking.length === 0 ? '<p style="color:var(--text-light)">Sin datos</p>' : ''}
          </div>
        </div>
        <div class="chart-card">
          <h3><i class="fas fa-handshake" style="color:var(--success)"></i> Clientes con más viajes</h3>
          <div style="margin-top:12px">
            ${clientRankingArr.map((c, i) => `
              <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">
                <div style="width:28px;height:28px;border-radius:50%;background:${i === 0 ? 'var(--warning)' : i === 1 ? 'var(--text-light)' : i === 2 ? '#cd7f32' : 'var(--bg)'};color:${i < 3 ? '#fff' : 'var(--text)'};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem">${i + 1}</div>
                <div style="flex:1"><strong>${App.escapeHtml(c.name)}</strong><div style="font-size:0.8rem;color:var(--text-light)">${c.count} viajes</div></div>
                <div style="font-weight:700;color:var(--text)">${App.formatCurrency(c.revenue)}</div>
              </div>
            `).join('')}
            ${clientRankingArr.length === 0 ? '<p style="color:var(--text-light)">Sin datos</p>' : ''}
          </div>
        </div>
      </div>
    `;
  },

  destroyCharts() {
    const canvas = document.getElementById('chartMonthly');
    if (canvas) {
      const chart = Chart.getChart(canvas);
      if (chart) chart.destroy();
    }
  }
};
