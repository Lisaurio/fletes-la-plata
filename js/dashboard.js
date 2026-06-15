const Dashboard = {
  charts: {},

  render() {
    const container = document.getElementById('section-dashboard');
    const vehicles = DB.getAll('vehicles');
    const trips = DB.getAll('trips');
    const employees = DB.getAll('employees');
    const expenses = DB.getAll('expenses');

    const pendientes = trips.filter(t => t.estado === 'Pendiente').length;
    const enCurso = trips.filter(t => t.estado === 'En curso').length;
    const finalizados = trips.filter(t => t.estado === 'Finalizado').length;
    const disponibles = vehicles.filter(v => v.estado === 'Disponible').length;
    const enReparacion = vehicles.filter(v => v.estado === 'En reparación').length;
    const enViaje = vehicles.filter(v => v.estado === 'En viaje').length;

    const today = App.getToday();
    const facturacionHoy = trips
      .filter(t => t.fecha === today && t.estado === 'Finalizado')
      .reduce((s, t) => s + (t.precio || 0), 0);
    const gastosHoy = expenses
      .filter(e => e.fecha === today)
      .reduce((s, e) => s + (e.monto || 0), 0);

    container.querySelector('.cards-grid').innerHTML = `
      <div class="card"><div class="card-header"><span class="card-label">Viajes pendientes</span><div class="card-icon orange"><i class="fas fa-clock"></i></div></div><div class="card-value">${pendientes}</div></div>
      <div class="card"><div class="card-header"><span class="card-label">Viajes en curso</span><div class="card-icon blue"><i class="fas fa-play-circle"></i></div></div><div class="card-value">${enCurso}</div></div>
      <div class="card"><div class="card-header"><span class="card-label">Viajes finalizados</span><div class="card-icon green"><i class="fas fa-check-circle"></i></div></div><div class="card-value">${finalizados}</div></div>
      <div class="card"><div class="card-header"><span class="card-label">Facturación hoy</span><div class="card-icon green"><i class="fas fa-dollar-sign"></i></div></div><div class="card-value">${App.formatCurrency(facturacionHoy)}</div></div>
      <div class="card"><div class="card-header"><span class="card-label">Gastos hoy</span><div class="card-icon red"><i class="fas fa-shopping-cart"></i></div></div><div class="card-value">${App.formatCurrency(gastosHoy)}</div></div>
      <div class="card"><div class="card-header"><span class="card-label">Vehículos disponibles</span><div class="card-icon green"><i class="fas fa-check-square"></i></div></div><div class="card-value">${disponibles}</div></div>
      <div class="card"><div class="card-header"><span class="card-label">Vehículos en reparación</span><div class="card-icon orange"><i class="fas fa-wrench"></i></div></div><div class="card-value">${enReparacion}</div></div>
      <div class="card"><div class="card-header"><span class="card-label">Vehículos en viaje</span><div class="card-icon blue"><i class="fas fa-road"></i></div></div><div class="card-value">${enViaje}</div></div>
    `;

    this.renderCharts(trips, vehicles, expenses);
  },

  renderCharts(trips, vehicles, expenses) {
    this.destroyCharts();

    const statusCounts = {
      'Pendiente': trips.filter(t => t.estado === 'Pendiente').length,
      'Programado': trips.filter(t => t.estado === 'Programado').length,
      'En curso': trips.filter(t => t.estado === 'En curso').length,
      'Finalizado': trips.filter(t => t.estado === 'Finalizado').length,
      'Cancelado': trips.filter(t => t.estado === 'Cancelado').length,
    };

    const vehicleStatus = {
      'Disponible': vehicles.filter(v => v.estado === 'Disponible').length,
      'En viaje': vehicles.filter(v => v.estado === 'En viaje').length,
      'En reparación': vehicles.filter(v => v.estado === 'En reparación').length,
      'Fuera de servicio': vehicles.filter(v => v.estado === 'Fuera de servicio').length,
    };

    const last7Days = [];
    const dailyRev = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      last7Days.push(d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' }));
      dailyRev.push(trips.filter(t => t.fecha === ds && t.estado === 'Finalizado').reduce((s, t) => s + (t.precio || 0), 0));
    }

    const expenseTypes = {};
    expenses.forEach(e => {
      expenseTypes[e.tipo] = (expenseTypes[e.tipo] || 0) + (e.monto || 0);
    });

    const chartOpts = (title) => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, font: { family: 'Lato', size: 12 } } }
      },
      scales: {
        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { family: 'Lato' } } },
        x: { grid: { display: false }, ticks: { font: { family: 'Lato' } } }
      }
    });

    new Chart(document.getElementById('chartTripsStatus'), {
      type: 'bar',
      data: {
        labels: Object.keys(statusCounts),
        datasets: [{ label: 'Viajes', data: Object.values(statusCounts), backgroundColor: ['#f39c12', '#3498db', '#27ae60', '#2ecc71', '#e74c3c'], borderRadius: 4 }]
      },
      options: chartOpts()
    });

    new Chart(document.getElementById('chartVehicleStatus'), {
      type: 'doughnut',
      data: {
        labels: Object.keys(vehicleStatus),
        datasets: [{ data: Object.values(vehicleStatus), backgroundColor: ['#27ae60', '#3498db', '#f39c12', '#e74c3c'], borderWidth: 0 }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { padding: 12, usePointStyle: true, font: { family: 'Lato', size: 12 } } } } }
    });

    new Chart(document.getElementById('chartDailyRevenue'), {
      type: 'line',
      data: {
        labels: last7Days,
        datasets: [{ label: 'Facturación', data: dailyRev, borderColor: '#223462', backgroundColor: 'rgba(34,52,98,0.1)', fill: true, tension: 0.4, pointBackgroundColor: '#223462', pointRadius: 4 }]
      },
      options: { ...chartOpts(), plugins: { legend: { display: false } } }
    });

    new Chart(document.getElementById('chartExpenses'), {
      type: 'bar',
      data: {
        labels: Object.keys(expenseTypes),
        datasets: [{ label: 'Gastos', data: Object.values(expenseTypes), backgroundColor: ['#e74c3c', '#3498db', '#f39c12', '#9b59b6', '#1abc9c', '#95a5a6'], borderRadius: 4 }]
      },
      options: chartOpts()
    });
  },

  destroyCharts() {
    ['chartTripsStatus', 'chartVehicleStatus', 'chartDailyRevenue', 'chartExpenses'].forEach(id => {
      const canvas = document.getElementById(id);
      if (canvas) {
        const chart = Chart.getChart(canvas);
        if (chart) chart.destroy();
      }
    });
  }
};
