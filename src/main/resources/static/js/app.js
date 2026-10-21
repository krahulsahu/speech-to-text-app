// ===== State =====
let recognition = null;
let isRecording = false;
let finalText = '';
let selectedLang = 'hi-IN';
let sessionStart = null;
let sessionTimer = null;
let audioCtx = null, analyser = null, dataArray = null, animFrame = null;
let stompClient = null;

// ===== Tab Navigation =====
function showTab(tab) {
  document.getElementById('tabRecord').classList.add('hidden');
  document.getElementById('tabHistory').classList.add('hidden');
  document.getElementById('navRecord').classList.remove('active');
  document.getElementById('navHistory').classList.remove('active');

  if (tab === 'record') {
    document.getElementById('tabRecord').classList.remove('hidden');
    document.getElementById('navRecord').classList.add('active');
  } else {
    document.getElementById('tabHistory').classList.remove('hidden');
    document.getElementById('navHistory').classList.add('active');
    loadTranscriptions();
  }
}

// ===== Language Selection =====
function selectLang(el, lang) {
  document.querySelectorAll('.lang-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  selectedLang = lang;
  if (isRecording) {
    stopRecording();
    setTimeout(startRecording, 300);
  }
}

// ===== WebSocket (STOMP) =====
function connectWebSocket() {
  try {
    const socket = new SockJS('/ws');
    stompClient = new StompJs.Client({ webSocketFactory: () => socket });
    stompClient.onConnect = () => console.log('WebSocket connected');
    stompClient.activate();
  } catch(e) { console.warn('WebSocket optional, continuing without it.', e); }
}

// ===== Web Speech API =====
function initSpeechRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { showToast('❌ Speech recognition not supported in this browser. Try Chrome.', 'error'); return false; }

  recognition = new SR();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = selectedLang;
  recognition.maxAlternatives = 1;

  recognition.onresult = (e) => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const transcript = e.results[i][0].transcript;
      if (e.results[i].isFinal) {
        finalText += transcript + ' ';
      } else {
        interim += transcript;
      }
    }
    updateLiveText(interim);
  };

  recognition.onerror = (e) => {
    if (e.error !== 'no-speech') {
      showToast('⚠️ ' + e.error, 'error');
      stopRecording();
    }
  };

  recognition.onend = () => {
    if (isRecording) recognition.start(); // Auto-restart for continuous
  };

  return true;
}

function updateLiveText(interim) {
  const el = document.getElementById('liveText');
  const interimEl = document.getElementById('interimText');
  el.textContent = finalText;
  interimEl.textContent = interim ? '▌ ' + interim : '';

  const words = finalText.trim() ? finalText.trim().split(/\s+/).length : 0;
  document.getElementById('charCount').textContent = words + ' words';
  document.getElementById('statWords').textContent = words;
  document.getElementById('saveBtn').disabled = finalText.trim().length === 0;
}

// ===== Recording =====
function toggleRecording() {
  if (isRecording) stopRecording(); else startRecording();
}

async function startRecording() {
  recognition = null;
  if (!initSpeechRecognition()) return;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    startVisualizer(stream);
  } catch(e) {
    showToast('🎤 Microphone access denied', 'error'); return;
  }

  recognition.lang = selectedLang;
  recognition.start();
  isRecording = true;

  // UI updates
  document.getElementById('micBtn').classList.add('recording');
  document.getElementById('micIcon').textContent = '⏹️';
  document.getElementById('micStatus').textContent = 'Listening... speak now';
  document.getElementById('recordingBadge').classList.add('show');
  document.getElementById('liveDot').classList.add('active');
  document.getElementById('liveText').classList.add('active');
  document.getElementById('waveformIdle').style.display = 'none';
  document.getElementById('waveformCanvas').style.display = 'block';

  sessionStart = Date.now();
  sessionTimer = setInterval(() => {
    const secs = Math.floor((Date.now() - sessionStart) / 1000);
    document.getElementById('statTime').textContent = secs + 's';
  }, 1000);
}

function stopRecording() {
  isRecording = false;
  if (recognition) { recognition.onend = null; recognition.stop(); }
  clearInterval(sessionTimer);
  stopVisualizer();

  document.getElementById('micBtn').classList.remove('recording');
  document.getElementById('micIcon').textContent = '🎙️';
  document.getElementById('micStatus').textContent = 'Click to start recording';
  document.getElementById('recordingBadge').classList.remove('show');
  document.getElementById('liveDot').classList.remove('active');
  document.getElementById('liveText').classList.remove('active');
  document.getElementById('waveformIdle').style.display = 'flex';
  document.getElementById('waveformCanvas').style.display = 'none';
}

function clearText() {
  finalText = '';
  document.getElementById('liveText').textContent = '';
  document.getElementById('interimText').textContent = '';
  document.getElementById('charCount').textContent = '0 words';
  document.getElementById('statWords').textContent = '0';
  document.getElementById('titleInput').value = '';
  document.getElementById('saveBtn').disabled = true;
}

// ===== Audio Visualizer =====
function startVisualizer(stream) {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  const src = audioCtx.createMediaStreamSource(stream);
  src.connect(analyser);
  dataArray = new Uint8Array(analyser.frequencyBinCount);
  drawWaveform();
}

function drawWaveform() {
  const canvas = document.getElementById('waveformCanvas');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.offsetWidth;

  function draw() {
    if (!isRecording) return;
    animFrame = requestAnimationFrame(draw);
    analyser.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const barW = (canvas.width / dataArray.length) * 2.5;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
      const h = (dataArray[i] / 255) * canvas.height;
      const grad = ctx.createLinearGradient(0, canvas.height - h, 0, canvas.height);
      grad.addColorStop(0, '#7c3aed');
      grad.addColorStop(1, '#06b6d4');
      ctx.fillStyle = grad;
      ctx.fillRect(x, canvas.height - h, barW - 1, h);
      x += barW;
    }
  }
  draw();
}

function stopVisualizer() {
  cancelAnimationFrame(animFrame);
  if (audioCtx) { audioCtx.close(); audioCtx = null; }
}

// ===== Save Transcription =====
async function saveTranscription() {
  const text = finalText.trim();
  if (!text) { showToast('⚠️ Nothing to save', 'error'); return; }

  const title = document.getElementById('titleInput').value.trim()
    || 'Recording ' + new Date().toLocaleString('en-IN');
  const duration = sessionStart ? (Date.now() - sessionStart) / 1000 : null;

  const payload = { text, title, languageCode: selectedLang, durationSeconds: duration };

  try {
    const res = await fetch('/api/transcriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const saved = await res.json();

      // Send via WebSocket too
      if (stompClient?.connected) {
        stompClient.publish({ destination: '/app/transcribe', body: JSON.stringify(saved) });
      }

      showToast('✅ Transcription saved!', 'success');
      clearText();
      loadStats();
    } else {
      showToast('❌ Failed to save', 'error');
    }
  } catch(e) {
    showToast('❌ Server error', 'error');
  }
}

// ===== Load Transcriptions =====
async function loadTranscriptions(query = '') {
  const grid = document.getElementById('transcriptionsGrid');
  grid.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Loading...</p></div>';

  try {
    const url = query ? `/api/transcriptions/search?q=${encodeURIComponent(query)}` : '/api/transcriptions';
    const res = await fetch(url);
    const data = await res.json();
    renderTranscriptions(data);
  } catch(e) {
    grid.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><p>Failed to load transcriptions</p></div>';
  }
}

function renderTranscriptions(items) {
  const grid = document.getElementById('transcriptionsGrid');
  if (!items.length) {
    grid.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><p>No transcriptions yet. Start recording!</p></div>';
    return;
  }

  grid.innerHTML = items.map(t => `
    <div class="trans-card" id="card-${t.id}">
      <div class="trans-card-header">
        <span class="trans-title">${escapeHtml(t.title || 'Untitled')}</span>
        <div class="trans-meta">
          <span class="lang-badge">${t.languageCode || 'hi-IN'}</span>
        </div>
      </div>
      <div class="trans-text">${escapeHtml(t.text)}</div>
      <div class="trans-footer">
        <span class="trans-date">🕐 ${formatDate(t.createdAt)}</span>
        <span class="trans-words">📝 ${t.wordCount || 0} words</span>
        <div class="trans-actions">
          <button class="act-btn act-edit" onclick="openEdit(${t.id},'${escapeAttr(t.title)}','${escapeAttr(t.text)}','${t.languageCode}')">✏️ Edit</button>
          <button class="act-btn act-delete" onclick="deleteTranscription(${t.id})">🗑️ Delete</button>
        </div>
      </div>
    </div>
  `).join('');
}

// ===== Search =====
let searchDebounce = null;
function searchTranscriptions(val) {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => loadTranscriptions(val), 300);
}

// ===== Edit Modal =====
function openEdit(id, title, text, lang) {
  document.getElementById('editId').value = id;
  document.getElementById('editTitle').value = title || '';
  document.getElementById('editText').value = text || '';
  document.getElementById('editLang').value = lang || 'hi-IN';
  document.getElementById('editModal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('editModal').classList.add('hidden');
}

async function submitEdit() {
  const id = document.getElementById('editId').value;
  const payload = {
    title: document.getElementById('editTitle').value,
    text: document.getElementById('editText').value,
    languageCode: document.getElementById('editLang').value
  };

  try {
    const res = await fetch(`/api/transcriptions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      showToast('✅ Updated!', 'success');
      closeModal();
      loadTranscriptions();
    } else {
      showToast('❌ Update failed', 'error');
    }
  } catch(e) { showToast('❌ Server error', 'error'); }
}

// ===== Delete =====
async function deleteTranscription(id) {
  if (!confirm('Delete this transcription?')) return;
  try {
    const res = await fetch(`/api/transcriptions/${id}`, { method: 'DELETE' });
    if (res.ok) {
      document.getElementById('card-' + id)?.remove();
      showToast('🗑️ Deleted', 'success');
      loadStats();
      const grid = document.getElementById('transcriptionsGrid');
      if (!grid.children.length) renderTranscriptions([]);
    }
  } catch(e) { showToast('❌ Error deleting', 'error'); }
}

async function deleteAllConfirm() {
  if (!confirm('Delete ALL transcriptions? This cannot be undone.')) return;
  try {
    await fetch('/api/transcriptions', { method: 'DELETE' });
    showToast('🗑️ All cleared', 'success');
    renderTranscriptions([]);
    loadStats();
  } catch(e) { showToast('❌ Error', 'error'); }
}

// ===== Stats =====
async function loadStats() {
  try {
    const res = await fetch('/api/transcriptions/stats');
    const data = await res.json();
    document.getElementById('statTotal').textContent = data.totalTranscriptions || 0;
  } catch(e) {}
}

// ===== Toast =====
let toastTimer = null;
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast' + (type ? ' ' + type : '');
  t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), 3000);
}

// ===== Helpers =====
function escapeHtml(s) {
  if (!s) return '';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escapeAttr(s) {
  if (!s) return '';
  return s.replace(/'/g,'&#39;').replace(/"/g,'&quot;').replace(/\n/g,' ');
}
function formatDate(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

// Close modal on overlay click
document.getElementById('editModal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

// ===== Init =====
connectWebSocket();
loadStats();
