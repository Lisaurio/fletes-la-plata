const Config = {
  render() {
    const cfg = DB.getConfig();
    document.getElementById('configContent').innerHTML = `
      <div style="max-width:600px">
        <div class="card" style="margin-bottom:20px">
          <h3 style="margin-bottom:16px;font-size:1.1rem"><i class="fas fa-dollar-sign" style="color:var(--secondary)"></i> Tarifas</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Precio por km ($)</label>
              <input type="number" id="cfg-precioKm" value="${cfg.precioPorKm || 500}" min="0" step="10">
            </div>
            <div class="form-group">
              <label>Precio mínimo por viaje ($)</label>
              <input type="number" id="cfg-precioMinimo" value="${cfg.precioMinimo || 5000}" min="0" step="100">
            </div>
          </div>
          <div style="margin-top:16px;display:flex;gap:10px">
            <button class="btn btn-primary" onclick="Config.save()"><i class="fas fa-save"></i> Guardar</button>
          </div>
        </div>

        <div class="card">
          <h3 style="margin-bottom:16px;font-size:1.1rem"><i class="fas fa-info-circle" style="color:var(--info)"></i> Cómo funciona el cálculo de precios</h3>
          <div style="color:var(--text-light);font-size:0.9rem;line-height:1.7">
            <p><strong>1.</strong> En el formulario de viaje, ingresá origen y destino y hacé clic en <strong>"Calcular ruta"</strong>.</p>
            <p><strong>2.</strong> El sistema calcula la distancia usando mapas gratuitos (OpenStreetMap).</p>
            <p><strong>3.</strong> El precio estimado se calcula como: <strong>distancia × precio por km</strong>.</p>
            <p><strong>4.</strong> Si el cliente tiene un <strong>precio por km personalizado</strong> (configurado en sus datos), se usa ese en lugar del global.</p>
            <p><strong>5.</strong> Si el cálculo da menos que el <strong>precio mínimo</strong>, se aplica el mínimo.</p>
            <p style="margin-top:8px">El precio calculado se puede modificar manualmente antes de guardar el viaje.</p>
          </div>
        </div>
      </div>
    `;
  },

  save() {
    const km = parseFloat(document.getElementById('cfg-precioKm').value);
    const min = parseFloat(document.getElementById('cfg-precioMinimo').value);
    if (!km || km <= 0) { App.showToast('Ingresá un precio por km válido', 'error'); return; }
    DB.saveConfig({ precioPorKm: km, precioMinimo: min || 0 });
    App.showToast('Configuración guardada', 'success');
  }
};
