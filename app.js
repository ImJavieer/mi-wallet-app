const btnAddAccount = document.getElementById('btn-add-account');
const btnAddTrend = document.getElementById('btn-add-trend');
const modal = document.getElementById('transaction-modal');
const btnCloseModal = document.getElementById('btn-close-modal');
const transactionForm = document.getElementById('transaction-form');
const editIndexInput = document.getElementById('edit-index');
const modalTitle = document.getElementById('modal-title');

const mainBalanceEl = document.getElementById('main-balance');
const trendBalanceEl = document.getElementById('trend-balance');
const savingsBalanceEl = document.getElementById('savings-balance');
const creditBalanceEl = document.getElementById('credit-balance');
const creditAvailableEl = document.getElementById('credit-available');
const transactionsListEl = document.getElementById('transactions-list');

// Estado Inicial de la memoria
let currentCash = parseFloat(localStorage.getItem('miWallet_RealCash'));
if (isNaN(currentCash)) currentCash = 208413;

let currentSavings = parseFloat(localStorage.getItem('miWallet_RealSavings'));
if (isNaN(currentSavings)) currentSavings = 40000;

let creditDebt = parseFloat(localStorage.getItem('miWallet_RealCredit')) || 0;
let transactionsHistory = JSON.parse(localStorage.getItem('miWallet_RealHistory')) || [];
const creditLimit = 1000000; 

let myChart = null; // Variable para el gráfico

function formatMoney(amount) {
    return '$' + amount.toLocaleString('es-CL');
}

function openModal(isEdit = false) {
    modal.classList.add('active');
    if (!isEdit) {
        modalTitle.textContent = "Nuevo Registro";
        editIndexInput.value = "-1";
        transactionForm.reset();
    }
}

function closeModal() {
    modal.classList.remove('active');
    transactionForm.reset();
}

function saveToLocalStorage() {
    localStorage.setItem('miWallet_RealCash', currentCash);
    localStorage.setItem('miWallet_RealSavings', currentSavings);
    localStorage.setItem('miWallet_RealCredit', creditDebt);
    localStorage.setItem('miWallet_RealHistory', JSON.stringify(transactionsHistory));
}

function renderChart() {
    const ctx = document.getElementById('balanceChart').getContext('2d');
    if (myChart) myChart.destroy(); // Borra el gráfico viejo para redibujar

    // Calcula el balance histórico hacia atrás para dibujarlo de izquierda a derecha
    let tempBalance = currentCash;
    let historicalBalances = [tempBalance];
    let labels = ['Hoy'];

    for (let i = 0; i < transactionsHistory.length; i++) {
        let tx = transactionsHistory[i];
        if (tx.type === 'gasto_debito' || tx.type === 'gasto_credito' || tx.type === 'traspaso_ahorro') {
            tempBalance += tx.amount;
        } else if (tx.type === 'ingreso') {
            tempBalance -= tx.amount;
        }
        historicalBalances.push(tempBalance);
        labels.push(tx.date || 'Antiguo');
    }

    // Invertimos para que el tiempo vaya de izquierda a derecha
    historicalBalances.reverse();
    labels.reverse();

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'CASH',
                data: historicalBalances,
                borderColor: '#007aff',
                backgroundColor: 'rgba(0, 122, 255, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3,
                pointRadius: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { display: false },
                y: { ticks: { color: '#8e8e93', callback: value => '$' + value.toLocaleString('es-CL') } }
            }
        }
    });
}

function updateUI() {
    mainBalanceEl.textContent = formatMoney(currentCash);
    trendBalanceEl.textContent = formatMoney(currentCash);
    savingsBalanceEl.textContent = formatMoney(currentSavings);
    creditBalanceEl.textContent = formatMoney(creditDebt);
    
    const availableCredit = creditLimit - creditDebt;
    creditAvailableEl.textContent = 'Disp: ' + formatMoney(availableCredit);
    
    transactionsListEl.innerHTML = '';
    transactionsHistory.forEach((tx, index) => {
        const txElement = crearElementoTransaccion(tx, index);
        transactionsListEl.appendChild(txElement);
    });

    renderChart();
}

function crearElementoTransaccion(tx, index) {
    let isExpense = true;
    let iconSymbol = '-';
    let iconClass = '';
    let typeLabel = '';

    if (tx.type === 'gasto_debito') {
        typeLabel = 'Débito'; iconClass = 'expense';
    } else if (tx.type === 'gasto_credito') {
        typeLabel = 'Crédito'; iconClass = 'credit'; 
    } else if (tx.type === 'traspaso_ahorro') {
        typeLabel = 'Ahorro'; iconClass = 'transfer';
    } else if (tx.type === 'ingreso') {
        typeLabel = 'Ingreso'; iconClass = 'income'; isExpense = false; iconSymbol = '+';
    }

    let amountText = isExpense ? `-$${tx.amount.toLocaleString('es-CL')}` : `+$${tx.amount.toLocaleString('es-CL')}`;
    let amountClass = isExpense ? 'negative' : 'positive';
    if (tx.type === 'traspaso_ahorro') amountClass = 'negative';

    const newTx = document.createElement('div');
    newTx.className = 'transaction-item';
    
    newTx.innerHTML = `
        <div class="tx-info">
            <div class="tx-icon ${iconClass}">${iconSymbol}</div>
            <div class="tx-details">
                <h4>${tx.category}</h4>
                <p>${tx.desc} • ${typeLabel}</p>
            </div>
        </div>
        <div class="tx-actions">
            <div class="tx-amount ${amountClass}">${amountText}</div>
            <div class="action-buttons">
                <button class="edit-btn" title="Editar">✏️</button>
                <button class="delete-btn" title="Eliminar">🗑️</button>
            </div>
        </div>
    `;

    newTx.querySelector('.delete-btn').addEventListener('click', () => borrarTransaccion(index));
    newTx.querySelector('.edit-btn').addEventListener('click', () => prepararEdicion(index));

    return newTx;
}

// -----------------------------------------
// LÓGICA DE EDICIÓN Y BORRADO
// -----------------------------------------

function revertirMatematica(tx) {
    if (tx.type === 'gasto_debito') currentCash += tx.amount;
    else if (tx.type === 'gasto_credito') { currentCash += tx.amount; creditDebt -= tx.amount; }
    else if (tx.type === 'ingreso') currentCash -= tx.amount;
    else if (tx.type === 'traspaso_ahorro') { currentCash += tx.amount; currentSavings -= tx.amount; }
}

function aplicarMatematica(type, amount) {
    if (type === 'gasto_debito') currentCash -= amount;
    else if (type === 'gasto_credito') { currentCash -= amount; creditDebt += amount; }
    else if (type === 'ingreso') currentCash += amount;
    else if (type === 'traspaso_ahorro') { currentCash -= amount; currentSavings += amount; }
}

function borrarTransaccion(index) {
    if (!confirm("¿Eliminar registro?")) return;
    revertirMatematica(transactionsHistory[index]);
    transactionsHistory.splice(index, 1);
    saveToLocalStorage();
    updateUI();
}

function prepararEdicion(index) {
    const tx = transactionsHistory[index];
    document.getElementById('type-select').value = tx.type;
    document.getElementById('category-select').value = tx.category;
    document.getElementById('amount-input').value = tx.amount;
    document.getElementById('desc-input').value = tx.desc;
    
    editIndexInput.value = index;
    modalTitle.textContent = "Editar Registro";
    openModal(true);
}

transactionForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const type = document.getElementById('type-select').value;
    const category = document.getElementById('category-select').value;
    const amount = parseFloat(document.getElementById('amount-input').value);
    const desc = document.getElementById('desc-input').value;
    const editIndex = parseInt(editIndexInput.value);

    if (isNaN(amount) || amount <= 0) return alert("Monto inválido.");

    // Si estamos editando, primero deshacemos el error matemático viejo
    if (editIndex !== -1) {
        revertirMatematica(transactionsHistory[editIndex]);
    }

    // Aplicamos el nuevo valor correcto
    aplicarMatematica(type, amount);

    const txData = {
        type: type,
        category: category,
        amount: amount,
        desc: desc,
        date: new Date().toLocaleDateString('es-CL') // Fecha actual para el gráfico
    };

    // Actualizamos el registro viejo o creamos uno nuevo
    if (editIndex !== -1) {
        transactionsHistory[editIndex] = txData;
    } else {
        transactionsHistory.unshift(txData);
    }

    saveToLocalStorage();
    updateUI();
    closeModal();
});

btnAddAccount.addEventListener('click', () => openModal(false));
btnAddTrend.addEventListener('click', () => openModal(false));
btnCloseModal.addEventListener('click', closeModal);

updateUI();