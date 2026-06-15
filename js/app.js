const App = {
  currentSection: 'dashboard',
  currentTheme: localStorage.getItem('flp-theme') || 'light',

  init() {
    document.documentElement.setAttribute('data-theme', this.currentTheme);
    this.renderSidebar();
    this.bindEvents();
    this.route();
    window.addEventListener('hashchange', () => this.route());
  },

  renderSidebar() {
    const nav = document.getElementById('sidebarNav');
    const items = [
      { id: 'dashboard', icon: 'fa-home', label: 'Inicio' },
      { id: 'vehiculos', icon: 'fa-truck', label: 'Vehículos' },
      { id: 'empleados', icon: 'fa-users', label: 'Empleados' },
      { id: 'clientes', icon: 'fa-building', label: 'Clientes' },
      { id: 'viajes', icon: 'fa-route', label: 'Viajes' },
      { id: 'gastos', icon: 'fa-wallet', label: 'Gastos' },
      { id: 'reportes', icon: 'fa-chart-bar', label: 'Reportes' },
      { id: 'config', icon: 'fa-cog', label: 'Configuración' },
      { id: 'ayuda', icon: 'fa-question-circle', label: 'Ayuda' },
    ];
    nav.innerHTML = items.map(item => `
      <a class="nav-item" data-section="${item.id}" href="#${item.id}">
        <i class="fas ${item.icon}"></i>
        <span>${item.label}</span>
      </a>
    `).join('');

    const themeIcon = this.currentTheme === 'dark' ? 'fa-sun' : 'fa-moon';
    const themeLabel = this.currentTheme === 'dark' ? 'Modo claro' : 'Modo oscuro';
    document.getElementById('themeToggle').innerHTML = `
      <i class="fas ${themeIcon}"></i>
      <span>${themeLabel}</span>
    `;
  },

  bindEvents() {
    document.addEventListener('click', (e) => {
      const toggle = e.target.closest('#menuToggle');
      if (toggle) { this.toggleSidebar(); return; }

      const overlay = e.target.closest('#sidebarOverlay');
      if (overlay) { this.closeSidebar(); return; }

      const themeBtn = e.target.closest('#themeToggle');
      if (themeBtn) { this.toggleTheme(); return; }

      const notifBtn = e.target.closest('#notifBell');
      if (notifBtn && !e.target.closest('.notif-dropdown')) { this.toggleNotifications(); return; }

      if (!e.target.closest('.notif-container')) {
        document.getElementById('notifDropdown').classList.remove('show');
      }

      const modalClose = e.target.closest('.modal-close, .modal-overlay');
      if (modalClose && !e.target.closest('.modal')) {
        this.closeModal();
      }
    });
  },

  route() {
    const hash = window.location.hash.slice(1) || 'dashboard';
    this.navigate(hash);
  },

  navigate(section) {
    if (!section) section = 'dashboard';
    this.currentSection = section;

    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const target = document.getElementById(`section-${section}`);
    if (target) target.classList.add('active');

    const navItem = document.querySelector(`.nav-item[data-section="${section}"]`);
    if (navItem) navItem.classList.add('active');

    const titles = {
      dashboard: 'Inicio',
      vehiculos: 'Vehículos',
      empleados: 'Empleados',
      clientes: 'Clientes',
      viajes: 'Viajes',
      gastos: 'Gastos',
      reportes: 'Reportes',
      config: 'Configuración',
      ayuda: 'Ayuda',
    };
    document.getElementById('headerTitle').textContent = titles[section] || 'Dashboard';

    this.closeSidebar();
    this.updateNotifBadge();

    switch (section) {
      case 'dashboard': Dashboard.render(); break;
      case 'vehiculos': Vehicles.render(); break;
      case 'empleados': Employees.render(); break;
      case 'clientes': Clients.render(); break;
      case 'viajes': Trips.render(); break;
      case 'gastos': Expenses.render(); break;
      case 'reportes': Reports.render(); break;
      case 'config': Config.render(); break;
      case 'ayuda': Help.render(); break;
    }
  },

  toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('active');
  },

  closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('active');
  },

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', this.currentTheme);
    localStorage.setItem('flp-theme', this.currentTheme);
    const icon = this.currentTheme === 'dark' ? 'fa-sun' : 'fa-moon';
    const label = this.currentTheme === 'dark' ? 'Modo claro' : 'Modo oscuro';
    document.getElementById('themeToggle').innerHTML = `
      <i class="fas ${icon}"></i>
      <span>${label}</span>
    `;
  },

  showModal(html, title = '', large = false) {
    const overlay = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');
    const header = document.getElementById('modalTitle');

    header.textContent = title;
    content.innerHTML = html;
    overlay.classList.add('active');

    if (large) overlay.querySelector('.modal')?.classList.add('modal-lg');

    overlay.querySelector('.modal')?.scrollTo(0, 0);
  },

  closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const icons = { success: 'fa-check-circle', error: 'fa-times-circle', info: 'fa-info-circle', warning: 'fa-exclamation-triangle' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <i class="fas ${icons[type] || icons.info}"></i>
      <span>${message}</span>
      <button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  formatCurrency(amount) {
    return '$' + Number(amount).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  },

  formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  },

  formatDateShort(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
  },

  getToday() {
    return new Date().toISOString().split('T')[0];
  },

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  },

  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  getBadgeHtml(state, type = 'estado') {
    const map = {
      pendiente: 'pendiente', programado: 'programado', 'en curso': 'en-curso',
      finalizado: 'finalizado', cancelado: 'cancelado',
      disponible: 'disponible', 'en reparaci\u00f3n': 'en-reparacion', 'fuera de servicio': 'fuera-servicio',
      activo: 'activo', inactivo: 'inactivo', vacaciones: 'vacaciones'
    };
    const cls = map[state?.toLowerCase()] || 'pendiente';
    return `<span class="badge badge-${cls}">${this.escapeHtml(state)}</span>`;
  },

  getVehicleStatusColor(state) {
    const map = { Disponible: 'green', 'En reparación': 'orange', 'Fuera de servicio': 'red', 'En viaje': 'blue' };
    return map[state] || 'gray';
  },

  toggleNotifications() {
    const dd = document.getElementById('notifDropdown');
    dd.classList.toggle('show');
    if (dd.classList.contains('show')) this.renderNotifications(dd);
  },

  renderNotifications(dd) {
    const today = this.getToday();
    const trips = DB.getAll('trips');
    const vehicles = DB.getAll('vehicles');

    const notifs = [];

    const hoy = trips.filter(t => t.fecha === today && t.estado !== 'Cancelado');
    if (hoy.length) notifs.push({ icon: 'fa-calendar-day', text: `${hoy.length} viaje${hoy.length > 1 ? 's' : ''} para hoy`, type: 'info' });

    const pendientes = trips.filter(t => t.estado === 'Pendiente');
    if (pendientes.length) notifs.push({ icon: 'fa-clock', text: `${pendientes.length} viaje${pendientes.length > 1 ? 's' : ''} pendiente${pendientes.length > 1 ? 's' : ''}`, type: 'warning' });

    const enViaje = vehicles.filter(v => v.estado === 'En viaje');
    if (enViaje.length) notifs.push({ icon: 'fa-road', text: `${enViaje.length} vehículo${enViaje.length > 1 ? 's' : ''} en viaje`, type: 'info' });

    const enRep = vehicles.filter(v => v.estado === 'En reparación');
    if (enRep.length) notifs.push({ icon: 'fa-wrench', text: `${enRep.length} vehículo${enRep.length > 1 ? 's' : ''} en reparación`, type: 'warning' });

    const vencidos = trips.filter(t => t.fecha < today && t.estado !== 'Finalizado' && t.estado !== 'Cancelado');
    if (vencidos.length) notifs.push({ icon: 'fa-exclamation-triangle', text: `${vencidos.length} viaje${vencidos.length > 1 ? 's' : ''} vencido${vencidos.length > 1 ? 's' : ''} sin finalizar`, type: 'error' });

    if (!notifs.length) {
      dd.innerHTML = '<div class="notif-empty">No hay notificaciones</div>';
    } else {
      dd.innerHTML = notifs.map(n => `
        <div class="notif-item ${n.type}">
          <i class="fas ${n.icon}"></i>
          <span>${n.text}</span>
        </div>
      `).join('');
    }
  },

  updateNotifBadge() {
    const today = this.getToday();
    const trips = DB.getAll('trips');
    const badge = document.getElementById('notifBadge');
    const count = trips.filter(t => t.fecha === today && t.estado !== 'Cancelado').length +
                  trips.filter(t => t.fecha < today && t.estado !== 'Finalizado' && t.estado !== 'Cancelado').length;
    if (count > 0) { badge.textContent = count; badge.style.display = 'flex'; }
    else { badge.style.display = 'none'; }
  }
};
