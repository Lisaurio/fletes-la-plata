const Help = {
  render() {
    document.getElementById('section-ayuda').querySelector('.help-section').innerHTML = `
      <div class="help-card">
        <h3><i class="fas fa-mobile-alt"></i> Instalación en Android (Chrome)</h3>
        <div class="help-step">
          <span class="step-num">1</span>
          <span class="step-text">Abrí este archivo en el navegador <strong>Chrome</strong>.</span>
          <span class="step-icon"><i class="fab fa-chrome"></i></span>
        </div>
        <div class="help-step">
          <span class="step-num">2</span>
          <span class="step-text">Tocá el <strong>menú</strong> (tres puntos verticales <i class="fas fa-ellipsis-v"></i>) en la esquina superior derecha.</span>
        </div>
        <div class="help-step">
          <span class="step-num">3</span>
          <span class="step-text">Seleccioná <strong>"Agregar a pantalla principal"</strong> o <strong>"Instalar aplicación"</strong>.</span>
        </div>
        <div class="help-step">
          <span class="step-num">4</span>
          <span class="step-text">Confirmá tocando <strong>"Agregar"</strong>. El icono aparecerá en tu pantalla de inicio.</span>
        </div>
      </div>

      <div class="help-card">
        <h3><i class="fab fa-apple"></i> Instalación en iPhone (Safari)</h3>
        <div class="help-step">
          <span class="step-num">1</span>
          <span class="step-text">Abrí este archivo en el navegador <strong>Safari</strong>.</span>
          <span class="step-icon"><i class="fab fa-safari"></i></span>
        </div>
        <div class="help-step">
          <span class="step-num">2</span>
          <span class="step-text">Tocá el <strong>botón Compartir</strong> (el cuadrado con flecha hacia arriba <i class="fas fa-share"></i>) en la barra inferior.</span>
        </div>
        <div class="help-step">
          <span class="step-num">3</span>
          <span class="step-text">Desplazate hacia abajo y seleccioná <strong>"Agregar a pantalla de inicio"</strong>.</span>
        </div>
        <div class="help-step">
          <span class="step-num">4</span>
          <span class="step-text">Tocá <strong>"Agregar"</strong> en la esquina superior derecha. El icono aparecerá en tu pantalla de inicio.</span>
        </div>
      </div>

      <div class="help-card">
        <h3><i class="fab fa-windows"></i> Instalación en Windows (Chrome o Edge)</h3>
        <div class="help-step">
          <span class="step-num">1</span>
          <span class="step-text">Abrí este archivo en <strong>Google Chrome</strong> o <strong>Microsoft Edge</strong>.</span>
          <span class="step-icon"><i class="fab fa-chrome"></i> <i class="fab fa-edge"></i></span>
        </div>
        <div class="help-step">
          <span class="step-num">2</span>
          <span class="step-text">Hacé clic en el <strong>menú</strong> (tres puntos <i class="fas fa-ellipsis-v"></i>) y seleccioná <strong>"Instalar Fletes La Plata..."</strong> o <strong>"Crear acceso directo"</strong>.</span>
        </div>
        <div class="help-step">
          <span class="step-num">3</span>
          <span class="step-text">Confirmá la instalación. Se creará un acceso directo en el menú inicio y en el escritorio.</span>
        </div>
        <div class="help-step">
          <span class="step-num">4</span>
          <span class="step-text">La aplicación se abrirá en su propia ventana, sin barras de navegación.</span>
        </div>
      </div>

      <div class="help-card">
        <h3><i class="fas fa-info-circle"></i> Acerca de esta aplicación</h3>
        <div style="padding:12px 0">
          <p style="margin-bottom:8px"><strong>Fletes La Plata - Panel de Gestión</strong></p>
          <p style="margin-bottom:8px;color:var(--text-light)">Versión demo.</p>
          <p style="margin-bottom:8px;color:var(--text-light)">Todos los datos se almacenan localmente en el navegador (localStorage).</p>
          <p style="margin-bottom:8px;color:var(--text-light)">No se requiere conexión a internet ni servidor para funcionar.</p>
          <p style="margin-bottom:8px;color:var(--text-light)">Los datos demo se cargan automáticamente al iniciar por primera vez.</p>
          <div style="margin-top:16px;padding:12px;background:var(--bg);border-radius:var(--radius-sm)">
            <p style="font-size:0.9rem;color:var(--text-light)">
              <strong>Migración futura:</strong> La capa de datos (db.js) está diseñada para ser reemplazada por Google Sheets, Google Apps Script, PHP + MySQL u otras tecnologías sin modificar el resto de la aplicación.
            </p>
          </div>
        </div>
      </div>

      <div class="help-card">
        <h3><i class="fas fa-database"></i> Administrar datos</h3>
        <div style="display:flex;gap:10px;flex-wrap:wrap;padding:8px 0">
          <button class="btn btn-danger" onclick="Help.resetData()"><i class="fas fa-trash-restore"></i> Reiniciar datos demo</button>
          <button class="btn btn-secondary" onclick="Help.exportData()"><i class="fas fa-download"></i> Exportar datos</button>
        </div>
        <p style="margin-top:8px;font-size:0.85rem;color:var(--text-light)">El botón "Reiniciar datos demo" borra todos los datos y recarga los datos de ejemplo.</p>
      </div>
    `;
  },

  resetData() {
    if (confirm('¿Estás seguro? Se eliminarán TODOS los datos (vehículos, empleados, clientes, viajes, gastos) y se recargarán los datos demo.')) {
      DB.collections.forEach(c => localStorage.removeItem(`flp-${c}`));
      localStorage.removeItem('flp-initialized');
      DB.init();
      App.showToast('Datos reiniciados correctamente', 'success');
      App.navigate('dashboard');
    }
  },

  exportData() {
    const data = {};
    DB.collections.forEach(c => {
      data[c] = DB.getAll(c);
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fletes-la-plata-backup-${App.getToday()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    App.showToast('Datos exportados correctamente', 'success');
  }
};
