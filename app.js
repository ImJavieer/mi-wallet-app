// 1. BASES MATEMÁTICAS CALCULADAS
let baseCash = 553095;
let baseCreditUsed = 1025810;
let creditLimit = 1500000; 
let baseSavings = 40000;

let cash = 0;
let creditUsed = 0;
let savings = 0;
let myChart;

// 2. TUS DATOS INICIALES (Exactamente como las fotos)
const datosIniciales = [
    { id: 7, type: 'gasto-credito', category: 'otros', amount: 244317, description: 'TODO LO QUE SE DEBÍA PREVIAMENTE' },
    { id: 6, type: 'gasto-credito', category: 'ropa', amount: 39873, description: 'Shein' },
    { id: 5, type: 'gasto-credito', category: 'comida', amount: 64405, description: 'Musuko' },
    { id: 4, type: 'abono-credito', category: 'otros', amount: 348595, description: 'Transferir, retirar (Fuera -> TC)' },
    { id: 3, type: 'retiro-cash', category: 'otros', amount: 104500, description: 'Transferir, retirar (Cash -> Fuera)' },
    { id: 2, type: 'abono-credito', category: 'otros', amount: 374405, description: 'Transferir, retirar (Fuera -> TC)' },
    { id: 1, type: 'ingreso', category: 'otros', amount: 3916, description: 'Transferir, retirar (Fuera -> Cash)' }
];

// Cargamos la memoria. Si es la primera vez (v3), inyecta los datosIniciales.
let records = JSON.parse(localStorage.getItem('wallet_records_v3')) || datosIniciales;

// Elementos UI
const cashEl = document.getElementById('cash-balance');
const creditEl = document.getElementById('credit-balance');
const creditAvailEl = document.getElementById('credit-available');
const savingsEl = document.getElementById('savings-balance');
const recordsList = document.getElementById('records-list');
const headerTitle = document.getElementById('header-title');

// Elementos Estadísticas
const statSaldo = document.getElementById('stat-saldo');
const statGastos = document.getElementById('stat-gastos');
const statFlujo = document.getElementById('stat-flujo');
const statIngresos = document.getElementById('stat-ingresos');

// Navegación
const btnInicio = document.getElementById('nav-inicio');
const btnStats = document.getElementById('nav-estadisticas');
const panelInicio = document.getElementById('inicio-panel');
const panelStats = document.getElementById('estadisticas-panel');

btnInicio.addEventListener('click', () => {
    panelInicio.style.display = 'block';
    panelStats.style.display = 'none';
    btnInicio.classList.add('active');
    btnStats.classList.remove('active');
    headerTitle.innerText = "Panel";
});

btnStats.addEventListener('click', () => {
    panelInicio.style.display = 'none';
    panelStats.style.display = 'block';
    btnStats.classList.add('active');
    btnInicio.classList.remove('active');
    headerTitle.innerText = "Estadísticas";
    updateStatsAndChart();
});

// Modal
const modal = document.getElementById('modal');
const btnAddCard = document.getElementById('open-add-modal');
const btnClose = document.getElementById('close-modal');
const form = document.getElementById('record-form');

btnAddCard.addEventListener('click', () => {
    form.reset();
    delete form.dataset.editId;
    modal.style.display = 'flex';
});

btnClose.addEventListener('click', () => modal.style.display = 'none');

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const type = document.getElementById('type').value;
    const category = document.getElementById('category').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const description = document.getElementById('description').value;

    if (form.dataset.editId) {
        records = records.filter(r => r.id !== parseInt(form.dataset.editId));
    }

    const newRecord = { id: Date.now(), type, category, amount, description };
    records.unshift(newRecord); 

    localStorage.setItem('wallet_records_v3', JSON.stringify(records));
    updateUI();
    modal.style.display = 'none';
});

// 3. LÓGICA DE SALDOS (Ajustado para los nuevos tipos de transferencia)
function recalculateBalances() {
    cash = baseCash;
    creditUsed = baseCreditUsed;
    savings = baseSavings;
    
    records.forEach(r => {
        if (r.type === 'ingreso') {
            cash += r.amount;
        } else if (r.type === 'gasto-debito') {
            cash -= r.amount;
        } else if (r.type === 'gasto-credito') {
            cash -= r.amount; 
            creditUsed += r.amount;
        } else if (r.type === 'abono-credito') {
            creditUsed -= r.amount;
        } else if (r.type === 'retiro-cash') {
            cash -= r.amount;
        }
    });
}

function deleteRecord(id) {
    if(confirm('¿Eliminar este registro? (Se ajustarán tus saldos automáticamente)')) {
        records = records.filter(r => r.id !== id);
        localStorage.setItem('wallet_records_v3', JSON.stringify(records));
        updateUI();
    }
}

function editRecord(id) {
    const record = records.find(r => r.id === id);
    if (!record) return;

    document.getElementById('type').value = record.type;
    document.getElementById('category').value = record.category;
    document.getElementById('amount').value = record.amount;
    document.getElementById('description').value = record.description;
    
    form.dataset.editId = id;
    modal.style.display = 'flex';
}

// 4. RENDERIZADO VISUAL
function updateUI() {
    recalculateBalances();
    
    cashEl.innerText = '$' + cash.toLocaleString('es-CL');
    creditEl.innerText = '$' + creditUsed.toLocaleString('es-CL');
    creditAvailEl.innerText = '$' + (creditLimit - creditUsed).toLocaleString('es-CL');
    savingsEl.innerText = '$' + savings.toLocaleString('es-CL');

    recordsList.innerHTML = '';
    records.forEach(r => {
        const li = document.createElement('li');
        // Define color y signo
        const isExpense = (r.type === 'gasto-debito' || r.type === 'gasto-credito' || r.type === 'retiro-cash');
        li.className = isExpense ? 'gasto' : 'ingreso';
        const sign = isExpense ? '-' : '';

        li.innerHTML = `
            <div class="info">
                <strong>${r.description}</strong> 
                <small>${r.category.toUpperCase()}</small>
            </div>
            <div class="amount-actions">
                <span class="amount">${sign}$${r.amount.toLocaleString('es-CL')}</span>
                <div class="actions">
                    <button onclick="editRecord(${r.id})">✏️</button>
                    <button onclick="deleteRecord(${r.id})">🗑️</button>
                </div>
            </div>
        `;
        recordsList.appendChild(li);
    });

    if(panelStats.style.display === 'block') updateStatsAndChart();
}

function updateStatsAndChart() {
    let totalIngresos = 0;
    let totalGastos = 0;
    const categorias = {};

    records.forEach(r => {
        if (r.type === 'ingreso' || r.type === 'abono-credito') {
            if (r.type === 'ingreso') totalIngresos += r.amount;
        } else if (r.type === 'gasto-debito' || r.type === 'gasto-credito') {
            totalGastos += r.amount;
            categorias[r.category] = (categorias[r.category] || 0) + r.amount;
        }
    });

    let flujo = totalIngresos - totalGastos;

    statSaldo.innerText = '$' + cash.toLocaleString('es-CL');
    statGastos.innerText = '$' + totalGastos.toLocaleString('es-CL');
    statIngresos.innerText = '$' + totalIngresos.toLocaleString('es-CL');
    
    statFlujo.innerText = (flujo < 0 ? '-' : '') + '$' + Math.abs(flujo).toLocaleString('es-CL');
    statFlujo.style.color = flujo < 0 ? '#f44336' : '#fff';

    const ctx = document.getElementById('myChart');
    if(!ctx) return;
    if (myChart) myChart.destroy();

    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categorias).map(c => c.toUpperCase()),
            datasets: [{
                data: Object.values(categorias),
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#E7E9ED'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#888', font: {size: 11} } }
            }
        }
    });
}

updateUI();