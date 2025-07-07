// --------------------------------------------------
//  Tebak Warna Ceria – main JS
// --------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {

  /* ----------  ELEMEN DOM  ---------- */
  const activateBtn   = document.getElementById('activate-btn');
  const gameCircle    = document.getElementById('game-circle');
  const instructions  = document.getElementById('instructions');
  const micStatus     = document.getElementById('mic-status');
  const scoreValue    = document.getElementById('score-value');
  const gameElements  = document.getElementById('game-elements');
  const chartContainer= document.getElementById('chart-container');

  // modal & nama
  const nameModal         = document.getElementById('nameModal');
  const playerNameInput   = document.getElementById('playerNameInput');
  const saveNameBtn       = document.getElementById('saveNameBtn');
  const voiceNameBtn      = document.getElementById('voiceNameBtn');
  const playerNameDisplay = document.getElementById('player-name-display');

  /* ----------  DATA & STATUS  ---------- */
  const colors = [
    { name: 'merah',       code: '#e74c3c' },
    { name: 'biru',        code: '#3498db' },
    { name: 'hijau',       code: '#2ecc71' },
    { name: 'kuning',      code: '#f1c40f' },
    { name: 'ungu',        code: '#9b59b6' },
    { name: 'jingga',      code: '#e67e22' },
    { name: 'hitam',       code: '#34495e' },
    { name: 'merah muda',  code: '#ff79c6' }
  ];

  let score = 0,
      isGameActive = false,
      isListening  = false,
      currentGameColor = {};

  let correctAnswers  = 0,
      incorrectAnswers= 0,
      scoreHistory    = [],
      colorStats      = {};

  let pieChart, lineChart, barChart;
  let playerName = '';

  /* ----------  SPEECH  ---------- */
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const speechSynthesis   = window.speechSynthesis;

  const speak = (text) => {
    if (!speechSynthesis) return;
    speechSynthesis.cancel();
    const ut = new SpeechSynthesisUtterance(text);
    ut.lang  = 'id-ID'; ut.rate = 1.1;
    speechSynthesis.speak(ut);
  };

  /* ----------  MODAL (nama pemain)  ---------- */
  const storedName = localStorage.getItem('twc_playerName');
  if (storedName) {
    playerName = storedName;
    nameModal.classList.add('hidden');
  } else {
    nameModal.classList.remove('hidden');
    // fokus setelah animasi modal visible
    requestAnimationFrame(() => playerNameInput.focus());
  }

  function savePlayerName() {
    const val = playerNameInput.value.trim();
    if (!val) return;
    playerName = val;
    localStorage.setItem('twc_playerName', val);
    nameModal.classList.add('hidden');
    speak(`Halo ${playerName}, selamat bermain!`);
  }

  saveNameBtn.addEventListener('click', savePlayerName);
  playerNameInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') savePlayerName();
  });

  // voice input nama
  let nameRec;
  voiceNameBtn.addEventListener('click', () => {
    if (!SpeechRecognition) return;
    if (nameRec) nameRec.abort();

    nameRec = new SpeechRecognition();
    nameRec.lang = 'id-ID';
    speak('Silakan sebutkan namamu');
    nameRec.start();

    nameRec.onresult = ev => {
      const txt = ev.results[0][0].transcript;
      playerNameInput.value = txt.trim();
      savePlayerName();
    };
  });

  /* ----------  JIKA browser tak mendukung speech  ---------- */
  if (!SpeechRecognition) {
    instructions.innerHTML =
      'Maaf, browsermu tidak mendukung <strong>Kontrol Suara</strong>. Coba gunakan Google Chrome.';
    activateBtn.disabled = true;
    return;
  }

  /* ----------  Speech recognizer utama (permainan)  ---------- */
  const recognition = new SpeechRecognition();
  recognition.lang = 'id-ID';
  recognition.continuous = false;
  recognition.interimResults = false;

  /* ----------  LOGIKA PERMAINAN  ---------- */
  function resetStats() {
    score = 0;
    correctAnswers = 0;
    incorrectAnswers = 0;
    scoreHistory = [0];
    colorStats = {};
    colors.forEach(c => (colorStats[c.name] = { correct: 0, incorrect: 0 }));
  }

  function startGame() {
    isGameActive = true;
    resetStats();

    // chart lama (jika ada) dihancurkan
    pieChart && pieChart.destroy();
    lineChart && lineChart.destroy();
    barChart && barChart.destroy();

    playerNameDisplay.classList.add('hidden');  // sembunyikan label nama
    gameElements.style.display = 'block';
    chartContainer.classList.add('hidden');

    updateScoreUI();
    instructions.textContent = 'Sebutkan nama warna yang muncul!';
    speak('Permainan dimulai!');
    newRound();
  }

  function newRound() {
    if (!isGameActive) return;

    let nextColor;
    do {
      nextColor = colors[Math.floor(Math.random() * colors.length)];
    } while (nextColor.name === currentGameColor.name);

    currentGameColor = nextColor;
    gameCircle.style.backgroundColor = currentGameColor.code;
    instructions.className = ''; // hapus feedback-color class
    if (isListening) recognition.start();
  }

  function checkAnswer(spokenText) {
    if (!isGameActive) return;
    const guess = spokenText.toLowerCase().trim();
    const correctName = currentGameColor.name;

    if (guess.includes(correctName)) {
      feedback(true);
      score++;
      correctAnswers++;
      colorStats[correctName].correct++;
    } else {
      feedback(false, correctName);
      incorrectAnswers++;
      colorStats[correctName].incorrect++;
    }

    scoreHistory.push(score);
    updateScoreUI();
    setTimeout(newRound, 2000);
  }

  function feedback(isCorrect, correctName='') {
    if (isCorrect) {
      instructions.textContent = 'Benar! ✨';
      instructions.classList.add('feedback-correct');
      speak('Benar!');
    } else {
      const txt = `Bukan, ini warna ${correctName}.`;
      instructions.textContent = txt;
      instructions.classList.add('feedback-wrong');
      speak(txt);
    }
  }

  function updateScoreUI() {
    scoreValue.textContent = score;
  }

  function endGame() {
    if (!isGameActive) return;
    isGameActive = false;

    const finalMsg = `Permainan Selesai! Skor Akhir kamu adalah ${score}.`;
    instructions.innerHTML =
      `Permainan Selesai! Skor Akhir: <strong>${score}</strong>.`;
    speak(finalMsg);

    gameElements.style.display = 'none';
    chartContainer.classList.remove('hidden');

    // tampilkan nama pemain di atas chart
    playerNameDisplay.textContent = `Pemain: ${playerName}`;
    playerNameDisplay.classList.remove('hidden');

    // buat chart sesudah DOM tampil
    requestAnimationFrame(createAllCharts);

    if (isListening) {
      isListening = false;
      recognition.stop();
    }
  }

  /* ----------  CHART.JS  ---------- */
  function createAllCharts() {
    Chart.defaults.font.family = 'Poppins';
    Chart.defaults.color = '#34495e';

    // Pie
    pieChart = new Chart(
      document.getElementById('pieChart'),
      {
        type: 'pie',
        data: {
          labels: ['Benar', 'Salah'],
          datasets: [{
            data: [correctAnswers, incorrectAnswers],
            backgroundColor: ['#2ecc71', '#e74c3c'],
            borderColor: 'rgba(255,255,255,.5)',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins:{ legend:{ position:'bottom', labels:{ usePointStyle:true } } }
        }
      }
    );

    // Line
    lineChart = new Chart(
      document.getElementById('lineChart'),
      {
        type: 'line',
        data: {
          labels: scoreHistory.map((_, i) => (i ? `Ronde ${i}` : 'Mulai')),
          datasets: [{
            label: 'Skor',
            data: scoreHistory,
            fill: false,
            borderColor: '#3498db',
            tension: .1
          }]
        },
        options: {
          responsive:true, maintainAspectRatio:false,
          scales:{ y:{ beginAtZero:true, ticks:{ stepSize:1 } } },
          plugins:{ legend:{ display:false } }
        }
      }
    );

    // Bar (filter warna yang belum muncul)
    const colorNames = Object.keys(colorStats)
      .filter(n => colorStats[n].correct + colorStats[n].incorrect > 0);

    barChart = new Chart(
      document.getElementById('barChart'),
      {
        type: 'bar',
        data: {
          labels: colorNames,
          datasets: [
            { label:'Benar', data:colorNames.map(n=>colorStats[n].correct),  backgroundColor:'#2ecc71' },
            { label:'Salah', data:colorNames.map(n=>colorStats[n].incorrect),backgroundColor:'#e74c3c' }
          ]
        },
        options:{
          responsive:true, maintainAspectRatio:false,
          scales:{
            x:{ stacked:true },
            y:{ stacked:true, beginAtZero:true, ticks:{ stepSize:1, precision:0 } }
          },
          plugins:{ legend:{ position:'bottom' } }
        }
      }
    );
  }

  /* ----------  EVENT LISTENER – tombol mic  ---------- */
  activateBtn.addEventListener('click', () => {
    if (!isListening) {
      try {
        recognition.start();
        isListening = true;
        micStatus.textContent = 'Kontrol suara AKTIF.';
        activateBtn.innerHTML = '<i class="fa-solid fa-stop"></i> Matikan Kontrol';
        instructions.innerHTML =
          'Ucapkan <strong>"Mulai"</strong> untuk bermain atau <strong>"Berhenti"</strong> untuk melihat hasil.';
      } catch {
        micStatus.textContent = 'Gagal memulai mikrofon.';
      }
    } else {
      if (isGameActive) endGame();
      isListening = false;
      recognition.stop();
      micStatus.textContent = '';
      activateBtn.innerHTML = '<i class="fa-solid fa-microphone"></i> Aktifkan Kontrol Suara';
    }
  });

  /* ----------  RECOGNITION EVENT HANDLER  ---------- */
  recognition.onresult = e => {
    const cmd = e.results[0][0].transcript.trim().toLowerCase();
    if (!isGameActive && cmd.includes('mulai')) {
      startGame();
    } else if (isGameActive && cmd.includes('berhenti')) {
      endGame();
    } else if (isGameActive) {
      checkAnswer(cmd);
    }
  };

  recognition.onerror = e => {
    micStatus.textContent = `Error mikrofon: ${e.error}`;
    isListening = false;
  };

  recognition.onend = () => {
    if (isListening && isGameActive) {
      recognition.start();         // auto-restart
    } else {
      activateBtn.innerHTML =
        '<i class="fa-solid fa-microphone"></i> Aktifkan Kontrol Suara';
      isListening = false;
    }
  };
});
