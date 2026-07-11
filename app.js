// 1. ESTRUCTURAS DE DATOS Y MEMORIA (Versión 5)
// Para forzar la actualización de la estructura, cambiamos la llave.
const STORAGE_KEY = 'wallet_v5';

let appData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
    accounts: [
        { id: 1, name: 'CASH', type: 'debito', balance: 103916, initialBalance: 103916, iconClass: 'blue', iconText: '$' },
        { id: 2, name: 'AHORRO', type: 'debito', balance: 40000, initialBalance: 40000, iconClass: 'green', iconText: 'A' },
        { id: 3, name: 'TARJETA DE CRÉDITO', type: 'credito', limit: 1000000, used: 348595, initialUsed: 348595, iconClass: 'orange', iconText: 'C' }
    ],
    categories: {
        gasto: ['comida', 'ropa', 'ocio', 'compras diarias', 'supermercado', 'membresías', 'otros'],
        ingreso: ['sueldo', 'venta', 'otros']
    },
    records: []
};

let myChart;

// 2. ELEMENTOS UI
const balancesContainer = document.getElementById('balances-container');
const recordsList = document.getElementById('records-list');
const headerTitle = document.getElementById('header-title');

// Estadísticas
const statSaldo = document.getElementById('stat-saldo');
const statGastos = document.getElementById('stat-gastos');
const statFlujo = document.getElementById('stat-flujo');
const statIngresos = document.getElementById('stat-ingresos');

// Navegación
const btnInicio = document.getElementById('nav-inicio');
const btnStats = document.getElementById('nav-estadisticas');
const panelInicio = document.getElementById('inicio-panel');
const panelStats = document.getElementById('estadisticas-panel');

// Modales
const recordModal = document.getElementById('modal');
const accountModal = document.getElementById('account-modal');
const btnAddRecord = document.getElementById('open-add-modal');
const btnAddAccount = document.getElementById('open-add-account-modal');
const btnCloseRecord = document.getElementById('close-modal');
const btnCloseAccount = document.getElementById('close-account-modal');

// Formularios
const recordForm = document.getElementById('record-form');
const accountForm = document.getElementById('account-form');

// Inputs Formulario Registro
const typeSelect = document.getElementById('type');
const accountSelect = document.getElementById('account-select');
const categorySelect = document.getElementById('category');
const newCategoryInput = document.getElementById('new-category-input');

// 3. NAVEGACIÓN
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

// 4. LÓGICA DE MODALES
btnAddRecord.addEventListener('click', () => {
    recordForm.reset();
    delete recordForm.dataset.editId;
    updateRecordFormOptions();
    recordModal.style.display = 'flex';
});
btnCloseRecord.addEventListener('click', () => recordModal.style.display = 'none');

btnAddAccount.addEventListener('click', () => {
    accountForm.reset();
    document.getElementById('debito-fields').style.display = 'block';
    document.getElementById('credito-fields').style.display = 'none';
    accountModal.style.display = 'flex';
});
btnCloseAccount.addEventListener('click', () => accountModal.style.display = 'none');

// Comportamiento del formulario de Nueva Cuenta (mostrar campos según tipo)
document.getElementById('acc-type').addEventListener('change', function() {
    if(this.value === 'debito') {
        document.getElementById('debito-fields').style.display = 'block';
        document.getElementById('credito-fields').style.display = 'none';
    } else {
        document.getElementById('debito-fields').style.display = 'none';
        document.getElementById('credito-fields').style.display = 'block';
    }
});

// Comportamiento del formulario de Registro (mostrar categorías y campo nuevo)
typeSelect.addEventListener('change', updateRecordFormOptions);
categorySelect.addEventListener('change', function() {
    if(this.value === 'nueva') {
        newCategoryInput.style.display = 'block';
        newCategoryInput.required = true;
    } else {
        newCategoryInput.style.display = 'none';
        newCategoryInput.required = false;
        newCategoryInput.value = '';
    }
});

function updateRecordFormOptions() {
    // 1. Cargar Cuentas
    accountSelect.innerHTML = '';
    appData.accounts.forEach(acc => {
        const option = document.createElement('option');
        option.value = acc.id;
        option.innerText = acc.name;
        accountSelect.appendChild(option);
    });

    // 2. Cargar Categorías según tipo (gasto/ingreso)
    categorySelect.innerHTML = '';
    const currentType = typeSelect.value;
    const cats = appData.categories[currentType];
    
    cats.forEach(c => {
        const option = document.createElement('option');
        option.value = c;
        option.innerText = c.charAt(0).toUpperCase() + c.slice(1);
        categorySelect.appendChild(option);
    });

    // Opción para nueva categoría
    const newCatOption = document.createElement('option');
    newCatOption.value = 'nueva';
    newCatOption.innerText = '+ Nueva Categoría...';
    newCatOption.style.fontWeight = 'bold';
    categorySelect.appendChild(newCatOption);

    newCategoryInput.style.display = 'none';
    newCategoryInput.required = false;
}

// 5. GUARDAR DATOS
function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    updateUI();
}

// Crear Cuenta
accountForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('acc-name').value.toUpperCase();
    const type = document.getElementById('acc-type').value;
    const colors = ['blue', 'green', 'orange', 'purple'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const letter = name.charAt(0);

    const newAccount = {
        id: Date.now(),
        name: name,
        type: type,
        iconClass: randomColor,
        iconText: letter
    };

    if(type === 'debito') {
        const bal = parseFloat(document.getElementById('acc-balance').value) || 0;
        newAccount.balance = bal;
        newAccount.initialBalance = bal;
    } else {
        const limit = parseFloat(document.getElementById('acc-limit').value) || 0;
        const used = parseFloat(document.getElementById('acc-used').value) || 0;
        newAccount.limit = limit;
        newAccount.used = used;
        newAccount.initialUsed = used;
    }

    appData.accounts.push(newAccount);
    saveData();
    accountModal.style.display = 'none';
});

// Guardar Registro
recordForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const type = typeSelect.value;
    const accountId = parseInt(accountSelect.value);
    let category = categorySelect.value;
    const amount = parseFloat(document.getElementById('amount').value);
    const description = document.getElementById('description').value;

    // Si es nueva categoría, guardarla en appData
    if(category === 'nueva') {
        category = newCategoryInput.value.toLowerCase().trim();
        if(category && !appData.categories[type].includes(category)) {
            appData.categories[type].push(category);
        }
    }

    // Si editamos, borramos el viejo para recalcular
    if (recordForm.dataset.editId) {
        appData.records = appData.records.filter(r => r.id !== parseInt(recordForm.dataset.editId));
    }

    const newRecord = { id: Date.now(), type, accountId, category, amount, description, date: new Date().toISOString() };
    appData.records.unshift(newRecord); 

    saveData();
    recordModal.style.display = 'none';
});

function deleteRecord(id) {
    if(confirm('¿Eliminar este registro?')) {
        appData.records = appData.records.filter(r => r.id !== id);
        saveData();
    }
}

function deleteAccount(id) {
    // Verificar si hay registros asociados
    const hasRecords = appData.records.some(r => r.accountId === id);
    if(hasRecords) {
        alert("No puedes eliminar una cuenta que tiene transacciones asociadas. Elimina los registros primero.");
        return;
    }
    
    if(confirm('¿Estás seguro de eliminar esta cuenta?')) {
        appData.accounts = appData.accounts.filter(a => a.id !== id);
        saveData();
    }
}

function editRecord(id) {
    const record = appData.records.find(r => r.id === id);
    if (!record) return;

    typeSelect.value = record.type;
    updateRecordFormOptions();
    
    accountSelect.value = record.accountId;
    categorySelect.value = record.category;
    document.getElementById('amount').value = record.amount;
    document.getElementById('description').value = record.description;
    
    recordForm.dataset.editId = id;
    recordModal.style.display = 'flex';
}

// 6. MATEMÁTICAS Y RENDERIZADO
function recalculateBalances() {
    // Resetear a los balances iniciales de creación
    appData.accounts.forEach(acc => {
        if(acc.type === 'debito') acc.balance = acc.initialBalance;
        if(acc.type === 'credito') acc.used = acc.initialUsed;
    });

    // Aplicar transacciones
    // Nota: Como la lista está en orden inverso (unshift), iteramos desde el final
    // o simplemente sumamos todo. Como la suma es conmutativa, el orden de aplicación aquí da igual para saldos finales.
    appData.records.forEach(r => {
        const acc = appData.accounts.find(a => a.id === r.accountId);
        if(!acc) return; // Si la cuenta se borró, ignoramos

        if(acc.type === 'debito') {
            if(r.type === 'ingreso') acc.balance += r.amount;
            if(r.type === 'gasto') acc.balance -= r.amount;
        } else if (acc.type === 'credito') {
            // En tarjeta de crédito, un gasto aumenta lo usado, un ingreso (pago) lo disminuye
            if(r.type === 'gasto') acc.used += r.amount;
            if(r.type === 'ingreso') acc.used -= r.amount;
        }
    });
}

function updateUI() {
    recalculateBalances();
    
    // Renderizar Cuentas
    balancesContainer.innerHTML = '';
    appData.accounts.forEach(acc => {
        const div = document.createElement('div');
        div.className = `card ${acc.name.toLowerCase()}`;
        
        let balanceHtml = '';
        if(acc.type === 'debito') {
            balanceHtml = `<h3 style="color: ${acc.balance < 0 ? '#f44336' : '#fff'}">$${acc.balance.toLocaleString('es-CL')}</h3>`;
        } else {
            const avail = acc.limit - acc.used;
            balanceHtml = `
                <h3 style="color: ${avail < 0 ? '#f44336' : '#fff'}">$${avail.toLocaleString('es-CL')}</h3>
                <small>Utilizado: $${acc.used.toLocaleString('es-CL')}</small>
            `;
        }

        div.innerHTML = `
            <button class="delete-account-btn" onclick="deleteAccount(${acc.id})">🗑️</button>
            <div class="icon-bg ${acc.iconClass}"><span>${acc.iconText}</span></div>
            <div class="card-text">
                <span>${acc.name}</span>
                ${balanceHtml}
            </div>
        `;
        balancesContainer.appendChild(div);
    });
    
    // Volver a añadir el botón de nueva cuenta al final
    const addAccBtn = document.createElement('div');
    addAccBtn.className = 'card add-action';
    addAccBtn.id = 'open-add-account-modal';
    addAccBtn.innerHTML = `
        <div class="icon-bg blue add-icon"><span>+</span></div>
        <div class="card-text"><span style="color: #aaa;">AGREGAR CUENTA</span></div>
    `;
    addAccBtn.addEventListener('click', () => {
        accountForm.reset();
        document.getElementById('debito-fields').style.display = 'block';
        document.getElementById('credito-fields').style.display = 'none';
        accountModal.style.display = 'flex';
    });
    balancesContainer.appendChild(addAccBtn);

    // Renderizar Registros
    recordsList.innerHTML = '';
    appData.records.forEach(r => {
        const li = document.createElement('li');
        li.className = r.type === 'gasto' ? 'gasto' : 'ingreso';
        const sign = r.type === 'gasto' ? '-' : '';
        const acc = appData.accounts.find(a => a.id === r.accountId);
        const accName = acc ? acc.name : 'Cuenta Eliminada';

        li.innerHTML = `
            <div class="info">
                <strong>${r.description}</strong> 
                <small>${r.category.toUpperCase()} • ${accName}</small>
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
    const categoriasGastos = {};
    let patrimonioNeto = 0;

    // Calcular patrimonio sumando debitos y restando deudas de crédito
    appData.accounts.forEach(acc => {
        if(acc.type === 'debito') patrimonioNeto += acc.balance;
        if(acc.type === 'credito') patrimonioNeto -= acc.used;
    });

    appData.records.forEach(r => {
        if (r.type === 'ingreso') {
            totalIngresos += r.amount;
        } else if (r.type === 'gasto') {
            totalGastos += r.amount;
            categoriasGastos[r.category] = (categoriasGastos[r.category] || 0) + r.amount;
        }
    });

    let flujo = totalIngresos - totalGastos;

    statSaldo.innerText = '$' + patrimonioNeto.toLocaleString('es-CL');
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
            labels: Object.keys(categoriasGastos).map(c => c.toUpperCase()),
            datasets: [{
                data: Object.values(categoriasGastos),
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

// Iniciar aplicación
updateUI();