// Simulación de tragamonedas en vanilla JS
// Símbolos disponibles por cada rodillo
const SYMBOLS = ['🍒','🍋','🍊','🔔','💎','7️⃣'];

// Configuración de apuestas y saldo
const START_BALANCE = 100;
const MIN_BET = 10;
const MAX_BET = 100;
const BET_STEP = 10;

// DOM elements
const balanceEl = document.getElementById('balance');
const betDisplayEl = document.getElementById('betDisplay');
const betUpBtn = document.getElementById('betUp');
const betDownBtn = document.getElementById('betDown');
const spinBtn = document.getElementById('spinBtn');
const reelsEls = [
  document.querySelector('#reel-0 .symbol'),
  document.querySelector('#reel-1 .symbol'),
  document.querySelector('#reel-2 .symbol')
];
const resultMessage = document.getElementById('resultMessage');
const alertBox = document.getElementById('alertBox');

// Estado del juego
let balance = START_BALANCE;
let currentBet = MIN_BET;
let spinning = false;

// Inicialización UI
function updateUI() {
  balanceEl.textContent = `$${balance}`;
  betDisplayEl.textContent = `$${currentBet}`;
}
updateUI();

// Mostrar alerta integrada en UI (no uso alert browser)
function showAlert(text, timeout = 2200) {
  alertBox.textContent = text;
  alertBox.style.display = 'block';
  alertBox.style.opacity = '1';
  clearTimeout(alertBox._hideTimer);
  alertBox._hideTimer = setTimeout(() => {
    alertBox.style.transition = 'opacity 400ms ease';
    alertBox.style.opacity = '0';
    setTimeout(()=> alertBox.style.display = 'none', 420);
  }, timeout);
}

// Mostrar resultado flotante (win/lose)
function showResult(text, type='win', timeout = 2200) {
  resultMessage.textContent = text;
  resultMessage.className = 'result-message ' + (type === 'win' ? 'win' : 'lose');
  // Se muestra (CSS ya define display:block para las clases), luego ocultamos
  clearTimeout(resultMessage._hideTimer);
  resultMessage._hideTimer = setTimeout(() => {
    resultMessage.className = 'result-message';
    resultMessage.textContent = '';
  }, timeout);
}

// Cambiar apuesta (respetando límites)
betUpBtn.addEventListener('click', () => {
  if (spinning) return;
  currentBet = Math.min(MAX_BET, currentBet + BET_STEP);
  betDisplayEl.textContent = `$${currentBet}`;
});
betDownBtn.addEventListener('click', () => {
  if (spinning) return;
  currentBet = Math.max(MIN_BET, currentBet - BET_STEP);
  betDisplayEl.textContent = `$${currentBet}`;
});

// Lógica de spin
spinBtn.addEventListener('click', () => {
  if (spinning) return;
  if (currentBet < MIN_BET || currentBet > MAX_BET) {
    showAlert(`Apuesta válida: $${MIN_BET} - $${MAX_BET}`);
    return;
  }
  if (balance < currentBet) {
    showAlert('Saldo insuficiente para esa apuesta');
    return;
  }

  // Se coloca la apuesta: restamos el valor inmediatamente (simula poner la apuesta)
  balance -= currentBet;
  updateUI();

  // Desactivar botones durante animación
  spinning = true;
  spinBtn.disabled = true;

  // Duraciones por reel (ms) - paradas secuenciales izquierda -> derecha
  const durations = [1600, 1800, 2000];

  // Guardaremos los interval IDs para cada reel
  const intervals = [null, null, null];
  const finalSymbols = [null, null, null];

  // Empezar animación de cada reel: cambiar símbolo rápido mediante setInterval
  for (let i = 0; i < 3; i++) {
    intervals[i] = setInterval(() => {
      // Cambia símbolo a uno aleatorio de la lista
      const s = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      reelsEls[i].textContent = s;
      // Pequeña escala para dar sensación de movimiento
      reelsEls[i].style.transform = 'translateY(0) scale(1.02)';
      // restaurar rápido
      setTimeout(()=> reelsEls[i].style.transform = 'translateY(0) scale(1)', 60);
    }, 80);

    // Programar parada secuencial con setTimeout
    ((index, stopAfter) => {
      setTimeout(() => {
        // Al parar, elegimos el símbolo final aleatoriamente y limpiamos el interval
        clearInterval(intervals[index]);
        const final = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        finalSymbols[index] = final;
        reelsEls[index].textContent = final;
        // Efecto visual al detenerse
        reelsEls[index].style.transform = 'scale(1.08)';
        setTimeout(()=> reelsEls[index].style.transform = 'scale(1)', 160);

        // Si es el último rodillo en detenerse, resolvemos el resultado
        if (index === 2) {
          // Pequeño delay para dejar que la última animación termine
          setTimeout(() => finishSpin(finalSymbols), 120);
        }
      }, stopAfter);
    })(i, durations[i]);
  }
});

/*
  finishSpin:
  - finalSymbols: array con los símbolos reales de los 3 rodillos.
  - Calcula premio según reglas:
      * 3 iguales en línea central -> paga 10x la apuesta
      * 2 iguales en línea central -> paga 2x la apuesta
      * 3 diferentes -> pérdida (ya se descontó la apuesta al inicio)
  - Actualiza el saldo y muestra mensajes.
*/
function finishSpin(finalSymbols){
  // Validación básica
  if (!Array.isArray(finalSymbols) || finalSymbols.length !== 3) {
    showAlert('Error interno: símbolos inválidos');
    resetAfterSpin();
    return;
  }

  const [a,b,c] = finalSymbols;
  let payout = 0;
  let message = '';
  let type = 'lose';

  if (a === b && b === c) {
    // Premio mayor: 3 iguales
    payout = currentBet * 10;
    message = `¡Jackpot! Ganaste $${payout}`;
    type = 'win';
  } else if (a === b || a === c || b === c) {
    // Premio menor: 2 iguales
    payout = currentBet * 2;
    message = `¡Ganaste $${payout}! (2 símbolos)`;
    type = 'win';
  } else {
    // 3 diferentes => pérdida (ya restada la apuesta)
    payout = 0;
    message = `Perdiste $${currentBet}`;
    type = 'lose';
  }

  // Si hay payout, sumarlo al balance (recuerda que la apuesta ya fue restada)
  if (payout > 0) {
    balance += payout;
  }

  // Actualizar UI y mostrar mensaje flotante
  updateUI();
  showResult(message, type);

  // Si el balance quedara por debajo del MIN_BET, informamos
  if (balance < MIN_BET) {
    showAlert('Saldo bajo. Recarga para seguir jugando.');
  }

  // Restaurar estado para permitir nuevos giros
  resetAfterSpin();
}

// Restaurar estado tras animación
function resetAfterSpin(){
  spinning = false;
  spinBtn.disabled = false;
}

/* Opcional: permitir apostar max según el saldo */
function adjustBetToBalance() {
  if (currentBet > balance) {
    // reducir apuesta al múltiplo de BET_STEP menor o igual al balance
    const maxAllowed = Math.floor(balance / BET_STEP) * BET_STEP;
    currentBet = Math.max(MIN_BET, Math.min(currentBet, maxAllowed || MIN_BET));
    betDisplayEl.textContent = `$${currentBet}`;
  }
}

// Cada vez que cambia el balance o apuesta (ej: después de juego), ajustamos apuestas si es necesario
// (Aquí lo llamamos tras actualizaciones; puedes llamarlo donde lo necesites)