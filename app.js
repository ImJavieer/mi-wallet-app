// MEMORIA v6 - Inyectando tus saldos actuales reales
const STORAGE_KEY = 'wallet_v6';

let appData = JSON.parse(localStorage.getItem(STORAGE_KEY));

if (!appData) {
  appData = {
    cuentas: [
      { id: 1, name: 'CASH', type: 'debito', balance: 103916, color: '#3b82f6', letter: '$' },
      { id: 2, name: 'EFECTIVO', type: 'debito', balance: 15000, color: '#a855f7', letter: 'E' },
      { id: 3, name: 'TARJETA DE CRÉDITO', type: 'credito', limit: 1000000, available: 651405, used: 348595, color: '#f59e0b', letter: 'C' },
      { id: 4, name: 'CMR', type: 'credito', limit: 300000, available: 201388, used: 98612, color: '#f59e0b', letter: 'C' },
      { id: 5, name: 'AHORRO', type: 'debito', balance: 40000, color: '#22c55e', letter: 'A' }
    ],
    categorias: [
      { id: 'comida', nombre: 'Comida', tipo: 'gasto' },
      { id: 'ropa', nombre: 'Ropa', tipo: 'gasto' },
      { id: 'supermercado', nombre: 'Supermercado', tipo: 'gasto' },
      { id: 'sueldo', nombre: 'Sueldo', tipo: 'ingreso' },
      { id: 'otro', nombre: 'Otro...', tipo: 'ambos' },
      { id: 'nueva', nombre: '+ Nueva Categoría', tipo: 'ambos' }
    ],
    registros: []
  };
  guardarDatos();
}

function guardarDatos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
}

function formatearDinero(monto) {
  return "$" + Math.round(monto).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// ---------------- RENDERIZAR CUENTAS CON KEBAB MENU ----------------
function renderCuentas() {
  const contenedor = document.getElementById('cuentas-contenedor');
  contenedor.innerHTML = '';

  appData.cuentas.forEach((cuenta, index) => {
    let htmlValores = '';
    
    if (cuenta.type === 'debito') {
      htmlValores = `<div class="amount">${formatearDinero(cuenta.balance)}</div>`;
    } else {
      htmlValores = `
        <div class="amount">${formatearDinero(cuenta.available)}</div>
        <div class="sub-amount">Utilizado: ${formatearDinero(cuenta.used)}</div>
      `;
    }

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-header">
        <div class="icon" style="background-color: ${cuenta.color}">${cuenta.letter}</div>
        <button class="btn-kebab" onclick="toggleMenu(${cuenta.id}, event)">&#8942;</button>
        
        <div class="menu-flotante" id="menu-${cuenta.id}">
          <button onclick="moverCuenta(${index}, -1)">Mover Atrás</button>
          <button onclick="moverCuenta(${index}, 1)">Mover Adelante</button>
          <button onclick="editarNombreCuenta(${cuenta.id})">Renombrar</button>
          <button onclick="eliminarCuenta(${cuenta.id})">Eliminar</button>
        </div>
      </div>
      <div class="label">${cuenta.name}</div>
      ${htmlValores}
    `;
    contenedor.appendChild(card);
  });

  const btnAdd = document.createElement('button');
  btnAdd.className = 'btn-add-account';
  btnAdd.onclick = abrirModalCuenta;
  btnAdd.innerHTML = `
    <div class="plus-icon">+</div>
    <div class="label">AGREGAR CUENTA</div>
  `;
  contenedor.appendChild(btnAdd);
}

// ---------------- LÓGICA DEL MENÚ DE TRES PUNTITOS ----------------
function toggleMenu(id, event) {
  event.stopPropagation();
  // Cerrar otros menús abiertos
  document.querySelectorAll('.menu-flotante').forEach(menu => {
    if(menu.id !== `menu-${id}`) menu.classList.remove('activo');
  });
  
  const menu = document.getElementById(`menu-${id}`);
  if(menu) menu.classList.toggle('activo');
}

// Cerrar menú si tocas afuera
document.addEventListener('click', function(e) {
  if (!e.target.closest('.btn-kebab') && !e.target.closest('.menu-flotante')) {
    document.querySelectorAll('.menu-flotante').forEach(menu => {
      menu.classList.remove('activo');
    });
  }
});

// ---------------- FUNCIONES DE GESTIÓN DE CUENTAS ----------------
function moverCuenta(index, direccion) {
  const nuevoIndex = index + direccion;
  if (nuevoIndex >= 0 && nuevoIndex < appData.cuentas.length) {
    const temp = appData.cuentas[index];
    appData.cuentas[index] = appData.cuentas[nuevoIndex];
    appData.cuentas[nuevoIndex] = temp;
    guardarDatos();
    renderCuentas();
  }
}

function editarNombreCuenta(id) {
  const cuenta = appData.cuentas.find(c => c.id === id);
  const nuevoNombre = prompt("Ingresa el nuevo nombre para la cuenta:", cuenta.name);
  if (nuevoNombre && nuevoNombre.trim() !== "") {
    cuenta.name = nuevoNombre.toUpperCase();
    guardarDatos();
    renderCuentas();
  }
}

function eliminarCuenta(id) {
  if(confirm("¿Seguro que deseas eliminar esta cuenta? Sus saldos desaparecerán.")) {
    appData.cuentas = appData.cuentas.filter(c => c.id !== id);
    guardarDatos();
    renderCuentas();
  }
}

// ---------------- LÓGICA DE REGISTROS Y DESCRIPCIÓN ----------------
function cargarSelectCuentas() {
  const select = document.getElementById('cuenta-movimiento');
  select.innerHTML = '';
  appData.cuentas.forEach(cuenta => {
    select.innerHTML += `<option value="${cuenta.id}">${cuenta.name}</option>`;
  });
}

function verificarTipo() {
  const tipo = document.getElementById('tipo-movimiento').value;
  const selectCat = document.getElementById('categoria');
  selectCat.innerHTML = '';
  
  appData.categorias.forEach(cat => {
    if (cat.tipo === tipo || cat.tipo === 'ambos') {
      selectCat.innerHTML += `<option value="${cat.id}">${cat.nombre}</option>`;
    }
  });
  verificarCategoria();
}

function verificarCategoria() {
  const categoria = document.getElementById('categoria').value;
  const campoOtro = document.getElementById('campo-otro-desc');
  const labelOtro = document.getElementById('label-otro');
  
  if (categoria === 'otro') {
    campoOtro.classList.remove('hidden');
    labelOtro.innerText = "Descripción del gasto";
  } else if (categoria === 'nueva') {
    campoOtro.classList.remove('hidden');
    labelOtro.innerText = "Nombre de la Nueva Categoría";
  } else {
    campoOtro.classList.add('hidden');
    document.getElementById('descripcion-otro').value = '';
  }
}

function guardarRegistro() {
  const tipo = document.getElementById('tipo-movimiento').value;
  const idCuenta = parseInt(document.getElementById('cuenta-movimiento').value);
  let idCategoria = document.getElementById('categoria').value;
  const descripcionInput = document.getElementById('descripcion-otro').value;
  const monto = parseFloat(document.getElementById('monto').value);

  if (!monto || monto <= 0) return alert('Ingresa un monto válido');

  let nombreMostrado = appData.categorias.find(c => c.id === idCategoria)?.nombre || 'Registro';

  // Manejo de categoría dinámica
  if (idCategoria === 'nueva' && descripcionInput.trim() !== '') {
    const nuevaId = 'cat_' + Date.now();
    appData.categorias.push({ id: nuevaId, nombre: descripcionInput, tipo: tipo });
    idCategoria = nuevaId;
    nombreMostrado = descripcionInput;
  } else if (idCategoria === 'otro' && descripcionInput.trim() !== '') {
    nombreMostrado = `Otro (${descripcionInput})`;
  }

  // Matemática
  const cuenta = appData.cuentas.find(c => c.id === idCuenta);
  
  if (tipo === 'gasto') {
    if (cuenta.type === 'debito') {
      cuenta.balance -= monto;
    } else {
      cuenta.available -= monto;
      cuenta.used += monto;
    }
  } else {
    if (cuenta.type === 'debito') {
      cuenta.balance += monto;
    } else {
      cuenta.available += monto;
      cuenta.used -= monto;
    }
  }

  appData.registros.unshift({
    id: Date.now(),
    tipo: tipo,
    idCuenta: idCuenta,
    nombreCuenta: cuenta.name,
    nombreCategoria: nombreMostrado,
    monto: monto
  });

  guardarDatos();
  cerrarModal();
  renderCuentas();
  renderHistorial();
  if(!document.getElementById('estadisticas-panel').classList.contains('hidden')){
    dibujarGrafico();
  }
}

function renderHistorial() {
  const lista = document.getElementById('lista-historial');
  lista.innerHTML = '';
  
  appData.registros.forEach(reg => {
    const claseMonto = reg.tipo === 'gasto' ? 'monto-gasto' : 'monto-ingreso';
    const signo = reg.tipo === 'gasto' ? '-' : '+';
    
    lista.innerHTML += `
      <li>
        <div>
          <strong>${reg.nombreCategoria}</strong>
          <div style="font-size:12px; color:#a0a0a5">${reg.nombreCuenta}</div>
        </div>
        <div>
          <span class="${claseMonto}">${signo}${formatearDinero(reg.monto)}</span>
          <button class="btn-eliminar-registro" onclick="eliminarRegistro(${reg.id})">🗑️</button>
        </div>
      </li>
    `;
  });
}

function eliminarRegistro(id) {
  if(!confirm("¿Eliminar este registro?")) return;
  
  const reg = appData.registros.find(r => r.id === id);
  const cuenta = appData.cuentas.find(c => c.id === reg.idCuenta);
  
  if(cuenta) {
    if(reg.tipo === 'gasto') {
      if(cuenta.type === 'debito') cuenta.balance += reg.monto;
      else { cuenta.available += reg.monto; cuenta.used -= reg.monto; }
    } else {
      if(cuenta.type === 'debito') cuenta.balance -= reg.monto;
      else { cuenta.available -= reg.monto; cuenta.used += reg.monto; }
    }
  }
  
  appData.registros = appData.registros.filter(r => r.id !== id);
  guardarDatos();
  renderCuentas();
  renderHistorial();
}

// ---------------- PANEL Y MODALES ----------------
function cambiarPanel(panelId) {
  document.getElementById('inicio-panel').classList.add('hidden');
  document.getElementById('estadisticas-panel').classList.add('hidden');
  document.getElementById('btn-inicio').classList.remove('activo');
  document.getElementById('btn-estadisticas').classList.remove('activo');

  document.getElementById(`${panelId}-panel`).classList.remove('hidden');
  document.getElementById(`btn-${panelId}`).classList.add('activo');
  document.getElementById('titulo-panel').innerText = panelId === 'inicio' ? 'Panel' : 'Estadísticas';

  if (panelId === 'estadisticas') dibujarGrafico();
}

function abrirModal() {
  document.getElementById('modal-registro').classList.remove('hidden');
  document.getElementById('monto').value = '';
  document.getElementById('descripcion-otro').value = '';
  cargarSelectCuentas();
  verificarTipo();
}
function cerrarModal() { document.getElementById('modal-registro').classList.add('hidden'); }

// Modal de Nueva Cuenta
function abrirModalCuenta() { document.getElementById('modal-cuenta').classList.remove('hidden'); }
function cerrarModalCuenta() { document.getElementById('modal-cuenta').classList.add('hidden'); }
function toggleCamposCuenta() {
  const tipo = document.getElementById('tipo-cuenta').value;
  if(tipo === 'debito') {
    document.getElementById('campo-saldo').classList.remove('hidden');
    document.getElementById('campo-cupo').classList.add('hidden');
    document.getElementById('campo-utilizado').classList.add('hidden');
  } else {
    document.getElementById('campo-saldo').classList.add('hidden');
    document.getElementById('campo-cupo').classList.remove('hidden');
    document.getElementById('campo-utilizado').classList.remove('hidden');
  }
}
function guardarNuevaCuenta() {
  const nombre = document.getElementById('nombre-cuenta').value;
  const tipo = document.getElementById('tipo-cuenta').value;
  const id = Date.now();
  
  if(!nombre) return alert('Ingresa un nombre');
  
  let nuevaCuenta = { id, name: nombre.toUpperCase(), type: tipo, color: '#3b82f6', letter: nombre.charAt(0).toUpperCase() };
  
  if(tipo === 'debito') {
    nuevaCuenta.balance = parseFloat(document.getElementById('saldo-inicial').value) || 0;
  } else {
    nuevaCuenta.limit = parseFloat(document.getElementById('cupo-total').value) || 0;
    nuevaCuenta.used = parseFloat(document.getElementById('monto-utilizado').value) || 0;
    nuevaCuenta.available = nuevaCuenta.limit - nuevaCuenta.used;
    nuevaCuenta.color = '#f59e0b';
  }
  
  appData.cuentas.push(nuevaCuenta);
  guardarDatos();
  cerrarModalCuenta();
  renderCuentas();
}

// ---------------- ESTADÍSTICAS BÁSICAS ----------------
let chartInstance = null;
function dibujarGrafico() {
  const ctx = document.getElementById('graficoGastos').getContext('2d');
  
  const gastos = appData.registros.filter(r => r.tipo === 'gasto');
  const sumasPorCategoria = {};
  gastos.forEach(g => {
    sumasPorCategoria[g.nombreCategoria] = (sumasPorCategoria[g.nombreCategoria] || 0) + g.monto;
  });

  const labels = Object.keys(sumasPorCategoria);
  const data = Object.values(sumasPorCategoria);

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels.length ? labels : ['Sin datos'],
      datasets: [{
        data: data.length ? data : [1],
        backgroundColor: data.length ? ['#3b82f6', '#a855f7', '#f59e0b', '#22c55e', '#ef4444'] : ['#2a2a2d'],
        borderWidth: 0
      }]
    },
    options: { cutout: '70%', plugins: { legend: { position: 'bottom', labels: { color: '#fff' } } } }
  });
}

// Inicializar app
window.onload = () => {
  renderCuentas();
  renderHistorial();
};