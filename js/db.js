const DB = {
  collections: ['vehicles', 'employees', 'clients', 'trips', 'expenses', 'fuelLogs', 'repairs'],

  init() {
    const initialized = localStorage.getItem('flp-initialized');
    if (!initialized) {
      this.seed();
      localStorage.setItem('flp-initialized', 'true');
    }
  },

  getCollection(name) {
    try {
      return JSON.parse(localStorage.getItem(`flp-${name}`)) || [];
    } catch {
      return [];
    }
  },

  saveCollection(name, data) {
    localStorage.setItem(`flp-${name}`, JSON.stringify(data));
  },

  getAll(name) {
    return this.getCollection(name);
  },

  getById(name, id) {
    return this.getCollection(name).find(item => item.id === id) || null;
  },

  create(name, data) {
    const col = this.getCollection(name);
    data.id = data.id || App.generateId();
    data.createdAt = data.createdAt || new Date().toISOString();
    data.updatedAt = new Date().toISOString();
    col.push(data);
    this.saveCollection(name, col);
    return data;
  },

  update(name, id, data) {
    const col = this.getCollection(name);
    const idx = col.findIndex(item => item.id === id);
    if (idx === -1) return null;
    data.updatedAt = new Date().toISOString();
    col[idx] = { ...col[idx], ...data };
    this.saveCollection(name, col);
    return col[idx];
  },

  delete(name, id) {
    let col = this.getCollection(name);
    col = col.filter(item => item.id !== id);
    this.saveCollection(name, col);
  },

  getConfig() {
    try {
      return JSON.parse(localStorage.getItem('flp-config')) || { precioPorKm: 500, precioMinimo: 5000 };
    } catch { return { precioPorKm: 500, precioMinimo: 5000 }; }
  },

  saveConfig(data) {
    const cfg = this.getConfig();
    Object.assign(cfg, data);
    localStorage.setItem('flp-config', JSON.stringify(cfg));
    return cfg;
  },

  seed() {
    this.seedVehicles();
    this.seedEmployees();
    this.seedClients();
    this.seedTrips();
    this.seedExpenses();
  },

  seedVehicles() {
    const vehicles = [
      { numeroInterno: '001', tipo: 'Camión', marca: 'Iveco', modelo: 'Daily 70C', año: 2022, patente: 'AA123BB', combustible: 'Diesel', kilometraje: 45230, estado: 'Disponible' },
      { numeroInterno: '002', tipo: 'Camión', marca: 'Ford', modelo: 'Cargo 1119', año: 2021, patente: 'AC456CD', combustible: 'Diesel', kilometraje: 67890, estado: 'En viaje' },
      { numeroInterno: '003', tipo: 'Camioneta', marca: 'Toyota', modelo: 'Hilux 4x4', año: 2023, patente: 'AD789EF', combustible: 'Diesel', kilometraje: 18900, estado: 'Disponible' },
      { numeroInterno: '004', tipo: 'Camión', marca: 'Volkswagen', modelo: 'Delivery 9.150', año: 2020, patente: 'AE012GH', combustible: 'Diesel', kilometraje: 89340, estado: 'En reparación' },
      { numeroInterno: '005', tipo: 'Utilitario', marca: 'Renault', modelo: 'Kangoo ZE', año: 2023, patente: 'AF345IJ', combustible: 'Eléctrico', kilometraje: 5600, estado: 'Disponible' },
      { numeroInterno: '006', tipo: 'Camioneta', marca: 'Ford', modelo: 'Ranger XLS', año: 2022, patente: 'AG678KL', combustible: 'Diesel', kilometraje: 31200, estado: 'Disponible' },
      { numeroInterno: '007', tipo: 'Camión', marca: 'Mercedes Benz', modelo: 'Accelo 915', año: 2021, patente: 'AH901MN', combustible: 'Diesel', kilometraje: 56780, estado: 'En viaje' },
      { numeroInterno: '008', tipo: 'Utilitario', marca: 'Citroën', modelo: 'Berlingo', año: 2022, patente: 'AI234OP', combustible: 'Nafta', kilometraje: 22300, estado: 'Disponible' },
      { numeroInterno: '009', tipo: 'Camión', marca: 'Iveco', modelo: 'Tector 170', año: 2020, patente: 'AJ567QR', combustible: 'Diesel', kilometraje: 102400, estado: 'En reparación' },
      { numeroInterno: '010', tipo: 'Camioneta', marca: 'Volkswagen', modelo: 'Amarok V6', año: 2023, patente: 'AK890ST', combustible: 'Diesel', kilometraje: 14500, estado: 'Disponible' },
    ];
    vehicles.forEach(v => {
      v.id = App.generateId();
      v.createdAt = new Date().toISOString();
      v.updatedAt = new Date().toISOString();
    });
    this.saveCollection('vehicles', vehicles);

    const fuelLogs = [
      { vehicleId: vehicles[0].id, fecha: '2026-05-20', litros: 120, costo: 108000, kmActual: 44800 },
      { vehicleId: vehicles[0].id, fecha: '2026-06-01', litros: 100, costo: 90000, kmActual: 45000 },
      { vehicleId: vehicles[0].id, fecha: '2026-06-10', litros: 80, costo: 72000, kmActual: 45230 },
      { vehicleId: vehicles[1].id, fecha: '2026-05-25', litros: 150, costo: 135000, kmActual: 67500 },
      { vehicleId: vehicles[1].id, fecha: '2026-06-05', litros: 130, costo: 117000, kmActual: 67700 },
      { vehicleId: vehicles[2].id, fecha: '2026-06-08', litros: 60, costo: 54000, kmActual: 18800 },
    ];
    fuelLogs.forEach(f => { f.id = App.generateId(); f.createdAt = new Date().toISOString(); });
    this.saveCollection('fuelLogs', fuelLogs);

    const repairs = [
      { vehicleId: vehicles[3].id, fecha: '2026-06-10', descripcion: 'Cambio de embrague', costo: 85000, kmActual: 89100, tipo: 'Correctivo' },
      { vehicleId: vehicles[3].id, fecha: '2026-06-12', descripcion: 'Reparación de frenos', costo: 32000, kmActual: 89250, tipo: 'Correctivo' },
      { vehicleId: vehicles[8].id, fecha: '2026-05-30', descripcion: 'Service de motor', costo: 120000, kmActual: 101800, tipo: 'Preventivo' },
      { vehicleId: vehicles[8].id, fecha: '2026-06-08', descripcion: 'Cambio de neumáticos', costo: 180000, kmActual: 102200, tipo: 'Correctivo' },
      { vehicleId: vehicles[0].id, fecha: '2026-05-15', descripcion: 'Cambio de aceite y filtros', costo: 25000, kmActual: 44500, tipo: 'Preventivo' },
    ];
    repairs.forEach(r => { r.id = App.generateId(); r.createdAt = new Date().toISOString(); });
    this.saveCollection('repairs', repairs);
  },

  seedEmployees() {
    const vehicles = this.getAll('vehicles');
    const employees = [
      { nombre: 'Carlos', apellido: 'Gutiérrez', dni: '20123456', telefono: '2215000101', vehiculoAsignado: vehicles[0]?.id || '', estado: 'Activo' },
      { nombre: 'Marcelo', apellido: 'Rodríguez', dni: '21234567', telefono: '2215000102', vehiculoAsignado: vehicles[1]?.id || '', estado: 'Activo' },
      { nombre: 'Pablo', apellido: 'Martínez', dni: '22345678', telefono: '2215000103', vehiculoAsignado: vehicles[2]?.id || '', estado: 'Activo' },
      { nombre: 'Diego', apellido: 'Fernández', dni: '23456789', telefono: '2215000104', vehiculoAsignado: vehicles[3]?.id || '', estado: 'Inactivo' },
      { nombre: 'Lucas', apellido: 'López', dni: '24567890', telefono: '2215000105', vehiculoAsignado: vehicles[4]?.id || '', estado: 'Activo' },
      { nombre: 'Fernando', apellido: 'García', dni: '25678901', telefono: '2215000106', vehiculoAsignado: vehicles[5]?.id || '', estado: 'Activo' },
      { nombre: 'Alejandro', apellido: 'Pereyra', dni: '26789012', telefono: '2215000107', vehiculoAsignado: vehicles[6]?.id || '', estado: 'Vacaciones' },
      { nombre: 'Sebastián', apellido: 'Sosa', dni: '27890123', telefono: '2215000108', vehiculoAsignado: vehicles[7]?.id || '', estado: 'Activo' },
      { nombre: 'Gustavo', apellido: 'Álvarez', dni: '28901234', telefono: '2215000109', vehiculoAsignado: vehicles[8]?.id || '', estado: 'Inactivo' },
      { nombre: 'Ezequiel', apellido: 'Díaz', dni: '29012345', telefono: '2215000110', vehiculoAsignado: vehicles[9]?.id || '', estado: 'Activo' },
    ];
    employees.forEach(e => {
      e.id = App.generateId();
      e.createdAt = new Date().toISOString();
      e.updatedAt = new Date().toISOString();
    });
    this.saveCollection('employees', employees);
  },

  seedClients() {
    const clients = [
      { nombre: 'Distribuidora Centro', empresa: 'Distribuidora Centro SRL', telefono: '2216000101', direccion: 'Calle 50 #1234', observaciones: 'Pago a 30 días' },
      { nombre: 'Mueblería El Norte', empresa: 'Mueblería El Norte SA', telefono: '2216000102', direccion: 'Av. 13 #5678', observaciones: 'Entregas semanales' },
      { nombre: 'Ferretería La Plata', empresa: 'Ferretería La Plata', telefono: '2216000103', direccion: 'Calle 7 #890', observaciones: 'Solicita factura A' },
      { nombre: 'Almacén City Bell', empresa: 'Almacén City Bell', telefono: '2216000104', direccion: 'Camino Centenario #1500', observaciones: '' },
      { nombre: 'Carnicería El Gaucho', empresa: 'Carnicería El Gaucho', telefono: '2216000105', direccion: 'Calle 8 #3456', observaciones: 'Urgencias frecuentes' },
      { nombre: 'Panadería San Martín', empresa: 'Panadería San Martín', telefono: '2216000106', direccion: 'Calle 70 #123', observaciones: 'Entregas antes de 8am' },
      { nombre: 'Restaurante El Puerto', empresa: 'Restaurante El Puerto', telefono: '2216000107', direccion: 'Av. 51 #890', observaciones: 'Flete semanal' },
      { nombre: 'Librería Educativa', empresa: 'Librería Educativa SRL', telefono: '2216000108', direccion: 'Calle 49 #2345', observaciones: '' },
      { nombre: 'Indumentaria Sport', empresa: 'Indumentaria Sport SA', telefono: '2216000109', direccion: 'Calle 12 #4567', observaciones: 'Pago contra entrega' },
      { nombre: 'Electro Hogar', empresa: 'Electro Hogar', telefono: '2216000110', direccion: 'Av. 44 #7890', observaciones: 'Electrodomésticos grandes' },
      { nombre: 'Vivero Florecer', empresa: 'Vivero Florecer', telefono: '2216000111', direccion: 'Ruta 36 km 15', observaciones: 'Plantas y macetas' },
      { nombre: 'Taller Mecánico LP', empresa: 'Taller Mecánico LP', telefono: '2216000112', direccion: 'Calle 71 #1111', observaciones: 'Repuestos de vehículos' },
      { nombre: 'Supermercado Todo', empresa: 'Supermercado Todo', telefono: '2216000113', direccion: 'Calle 60 #2222', observaciones: 'Varios viajes por semana' },
      { nombre: 'Farmashop', empresa: 'Farmashop', telefono: '2216000114', direccion: 'Calle 47 #3333', observaciones: 'Urgente 24hs' },
      { nombre: 'Materiales Construcción SRL', empresa: 'Mat. Construcción SRL', telefono: '2216000115', direccion: 'Av. 520 #4444', observaciones: 'Materiales pesados' },
      { nombre: 'Mudanzas Premium', empresa: 'Mudanzas Premium', telefono: '2216000116', direccion: 'Calle 5 #5555', observaciones: 'Derivaciones de mudanzas' },
      { nombre: 'Gomería Ruta 2', empresa: 'Gomería Ruta 2', telefono: '2216000117', direccion: 'Ruta 2 km 50', observaciones: 'Neumáticos al por mayor' },
      { nombre: 'Heladería Artesanal', empresa: 'Heladería Artesanal', telefono: '2216000118', direccion: 'Calle 8 #6666', observaciones: 'Fletes refrigerados' },
      { nombre: 'Depósito Bernal', empresa: 'Depósito Bernal SA', telefono: '2216000119', direccion: 'Bernal, Quilmes', observaciones: 'Entregas zona sur' },
      { nombre: 'PetShop Mascotas', empresa: 'PetShop Mascotas', telefono: '2216000120', direccion: 'Calle 67 #7777', observaciones: 'Alimentos balanceados' },
    ];
    clients.forEach(c => {
      c.id = App.generateId();
      c.createdAt = new Date().toISOString();
      c.updatedAt = new Date().toISOString();
    });
    this.saveCollection('clients', clients);
  },

  seedTrips() {
    const vehicles = this.getAll('vehicles');
    const employees = this.getAll('employees');
    const clients = this.getAll('clients');
    const statuses = ['Pendiente', 'Programado', 'En curso', 'Finalizado', 'Cancelado'];
    const payments = ['Efectivo', 'Transferencia', 'Tarjeta', 'Cheque'];
    const localidades = ['La Plata', 'City Bell', 'Gonnet', 'Tolosa', 'Villa Elisa', 'Berisso', 'Ensenada'];

    const createTrip = (daysAgo, statusIdx, vehicleIdx, employeeIdx, clientIdx) => {
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      const dateStr = d.toISOString().split('T')[0];
      const kmBase = 40000 + Math.floor(Math.random() * 60000);
      const kmTravel = 20 + Math.floor(Math.random() * 150);
      const precio = 8000 + Math.floor(Math.random() * 55000);
      const localidad = localidades[Math.floor(Math.random() * localidades.length)];

      return {
        fecha: dateStr,
        hora: `${8 + Math.floor(Math.random() * 10)}:${Math.random() > 0.5 ? '00' : '30'}`,
        clienteId: clients[clientIdx]?.id || clients[0].id,
        telefono: clients[clientIdx]?.telefono || '',
        origen: `Calle ${Math.floor(Math.random() * 100)} #${Math.floor(Math.random() * 9000 + 1000)}`,
        destino: `Calle ${Math.floor(Math.random() * 100)} #${Math.floor(Math.random() * 9000 + 1000)}`,
        localidad,
        vehiculoId: vehicles[vehicleIdx]?.id || vehicles[0].id,
        choferId: employees[employeeIdx]?.id || employees[0].id,
        precio,
        formaPago: payments[Math.floor(Math.random() * payments.length)],
        kmInicial: kmBase,
        kmFinal: kmBase + kmTravel,
        estado: statuses[statusIdx],
        observaciones: '',
      };
    };

    const trips = [
      createTrip(1, 3, 0, 0, 0),
      createTrip(1, 3, 1, 1, 1),
      createTrip(2, 3, 2, 2, 2),
      createTrip(2, 3, 0, 3, 3),
      createTrip(3, 3, 4, 4, 4),
      createTrip(3, 3, 5, 5, 5),
      createTrip(4, 3, 6, 6, 6),
      createTrip(4, 3, 7, 7, 7),
      createTrip(5, 3, 8, 8, 8),
      createTrip(5, 4, 9, 9, 9),
      createTrip(6, 3, 0, 0, 10),
      createTrip(7, 3, 1, 1, 11),
      createTrip(7, 3, 2, 2, 12),
      createTrip(8, 3, 3, 3, 13),
      createTrip(8, 0, 4, 4, 14),
      createTrip(9, 1, 5, 5, 15),
      createTrip(10, 2, 6, 6, 16),
      createTrip(10, 3, 7, 7, 17),
      createTrip(11, 3, 8, 8, 18),
      createTrip(12, 0, 9, 9, 19),
      createTrip(12, 1, 0, 0, 0),
      createTrip(13, 3, 1, 1, 1),
      createTrip(14, 3, 2, 2, 2),
      createTrip(14, 4, 3, 3, 3),
      createTrip(15, 3, 4, 4, 4),
      createTrip(15, 3, 5, 5, 5),
      createTrip(16, 3, 6, 6, 6),
      createTrip(0, 0, 7, 7, 7),
      createTrip(0, 1, 8, 8, 8),
      createTrip(0, 2, 9, 9, 9),
    ];
    trips.forEach(t => {
      t.id = App.generateId();
      t.createdAt = new Date().toISOString();
      t.updatedAt = new Date().toISOString();
    });
    this.saveCollection('trips', trips);
  },

  seedExpenses() {
    const vehicles = this.getAll('vehicles');
    const expenseTypes = ['Combustible', 'Peaje', 'Reparación', 'Sueldo', 'Seguro', 'Otro'];
    const createExpense = (daysAgo, typeIdx, vehicleIdx, amount) => {
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      const descs = {
        'Combustible': 'Carga de combustible',
        'Peaje': 'Peaje autopista',
        'Reparación': 'Mantenimiento',
        'Sueldo': 'Sueldo chofer',
        'Seguro': 'Seguro mensual',
        'Otro': 'Gasto administrativo',
      };
      return {
        fecha: d.toISOString().split('T')[0],
        tipo: expenseTypes[typeIdx],
        descripcion: descs[expenseTypes[typeIdx]],
        monto: amount,
        vehiculoId: vehicleIdx !== -1 ? vehicles[vehicleIdx]?.id : '',
      };
    };

    const expenses = [
      createExpense(1, 0, 0, 72000),
      createExpense(1, 1, -1, 3500),
      createExpense(2, 0, 1, 85000),
      createExpense(2, 3, -1, 250000),
      createExpense(3, 0, 2, 45000),
      createExpense(3, 2, 3, 32000),
      createExpense(4, 4, -1, 45000),
      createExpense(5, 0, 4, 38000),
      createExpense(5, 1, -1, 2800),
      createExpense(6, 0, 5, 56000),
      createExpense(6, 3, -1, 250000),
      createExpense(7, 5, -1, 15000),
      createExpense(8, 0, 6, 92000),
      createExpense(8, 2, 8, 180000),
      createExpense(9, 4, -1, 45000),
      createExpense(10, 0, 7, 41000),
      createExpense(10, 1, -1, 3200),
      createExpense(11, 0, 9, 63000),
      createExpense(12, 3, -1, 250000),
      createExpense(13, 0, 0, 55000),
      createExpense(14, 5, -1, 12000),
      createExpense(15, 0, 1, 78000),
      createExpense(15, 1, -1, 4100),
      createExpense(16, 4, -1, 45000),
      createExpense(17, 0, 2, 39000),
      createExpense(18, 2, 3, 85000),
      createExpense(19, 3, -1, 250000),
      createExpense(20, 0, 4, 47000),
    ];
    expenses.forEach(e => {
      e.id = App.generateId();
      e.createdAt = new Date().toISOString();
    });
    this.saveCollection('expenses', expenses);
  },
};
