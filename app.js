// Storage keys
const STORAGE_KEY_WORDS = 'hangman.words.v1';

// Elements
const tabTeacher = document.getElementById('tab-teacher');
const tabStudent = document.getElementById('tab-student');
const panelTeacher = document.getElementById('panel-teacher');
const panelStudent = document.getElementById('panel-student');

// Teacher panel
const wordsInput = document.getElementById('words-input');
const addWordsBtn = document.getElementById('add-words-btn');
const clearWordsBtn = document.getElementById('clear-words-btn');
const wordListUl = document.getElementById('word-list-ul');
const wordCount = document.getElementById('word-count');
const exportBtn = document.getElementById('export-btn');
const importFile = document.getElementById('import-file');

// Student panel
const maskedWordEl = document.getElementById('masked-word');
const incorrectLettersEl = document.getElementById('incorrect-letters');
const wrongCountEl = document.getElementById('wrong-count');
const keyboardEl = document.getElementById('keyboard');
const startBtn = document.getElementById('start-btn');
const nextBtn = document.getElementById('next-btn');
const resetRoundBtn = document.getElementById('reset-round-btn');
const messageEl = document.getElementById('message');
const scoreEl = document.getElementById('score');

// Hangman parts order (6)
const parts = [
  document.getElementById('part-head'),
  document.getElementById('part-body'),
  document.getElementById('part-arm-left'),
  document.getElementById('part-arm-right'),
  document.getElementById('part-leg-left'),
  document.getElementById('part-leg-right')
];

// State
let words = [];
let currentWord = '';
let revealed = [];
let wrongLetters = new Set();
let correctLetters = new Set();
let usedWordIndices = new Set();
let score = 0;

function saveWordsToStorage() {
  try { localStorage.setItem(STORAGE_KEY_WORDS, JSON.stringify(words)); } catch {}
}

function loadWordsFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WORDS);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr.filter(w => typeof w === 'string' && w.trim().length > 0);
  } catch {}
  return [];
}

function normalizeWord(word) {
  return word
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .trim();
}

function addWordsFromText(text) {
  const candidates = text.split(/[,\n]/g).map(normalizeWord).filter(Boolean);
  const set = new Set(words);
  for (const w of candidates) set.add(w);
  words = Array.from(set);
  words.sort();
  saveWordsToStorage();
  renderWordList();
}

function renderWordList() {
  wordListUl.innerHTML = '';
  wordCount.textContent = `(${words.length})`;
  for (const w of words) {
    const li = document.createElement('li');
    li.textContent = w;
    wordListUl.appendChild(li);
  }
}

function switchTab(target) {
  const isTeacher = target === 'teacher';
  tabTeacher.classList.toggle('active', isTeacher);
  tabStudent.classList.toggle('active', !isTeacher);
  tabTeacher.setAttribute('aria-selected', String(isTeacher));
  tabStudent.setAttribute('aria-selected', String(!isTeacher));
  panelTeacher.classList.toggle('hidden', !isTeacher);
  panelStudent.classList.toggle('hidden', isTeacher);
}

function buildKeyboard() {
  keyboardEl.innerHTML = '';
  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
  letters.forEach(letter => {
    const btn = document.createElement('button');
    btn.className = 'key';
    btn.textContent = letter;
    btn.setAttribute('data-letter', letter);
    btn.addEventListener('click', () => handleGuess(letter));
    keyboardEl.appendChild(btn);
  });
}

function resetHangman() {
  parts.forEach(p => p.classList.add('hidden'));
  wrongCountEl.textContent = '0';
}

function revealParts(count) {
  for (let i = 0; i < parts.length; i++) {
    parts[i].classList.toggle('hidden', i >= count);
  }
}

function pickNextWord() {
  if (usedWordIndices.size >= words.length) {
    usedWordIndices.clear();
  }
  const available = words
    .map((w, i) => i)
    .filter(i => !usedWordIndices.has(i));
  if (available.length === 0) return '';
  const idx = available[Math.floor(Math.random() * available.length)];
  usedWordIndices.add(idx);
  return words[idx];
}

function startRound(newWord) {
  currentWord = newWord || pickNextWord();
  if (!currentWord) {
    messageEl.textContent = 'No words. Ask your teacher to add some!';
    return;
  }
  revealed = Array.from(currentWord).map(ch => (/[a-z]/.test(ch) ? '_' : ch));
  wrongLetters.clear();
  correctLetters.clear();
  incorrectLettersEl.textContent = '';
  messageEl.textContent = 'Guess a letter!';
  resetHangman();
  updateMaskedWord();
  updateKeyboardStates();
  nextBtn.disabled = true;
}

function updateMaskedWord() {
  maskedWordEl.textContent = revealed.join(' ');
}

function updateKeyboardStates() {
  Array.from(keyboardEl.children).forEach(btn => {
    const letter = btn.getAttribute('data-letter');
    btn.disabled = wrongLetters.has(letter) || correctLetters.has(letter) || isGameOver();
    btn.classList.toggle('wrong', wrongLetters.has(letter));
    btn.classList.toggle('correct', correctLetters.has(letter));
  });
}

function isGameOver() {
  return revealed.join('') === currentWord || wrongLetters.size >= 6;
}

function handleGuess(letter) {
  if (!currentWord || isGameOver()) return;
  if (wrongLetters.has(letter) || correctLetters.has(letter)) return;

  if (currentWord.includes(letter)) {
    correctLetters.add(letter);
    for (let i = 0; i < currentWord.length; i++) {
      if (currentWord[i] === letter) revealed[i] = letter.toUpperCase();
    }
    updateMaskedWord();
    if (revealed.join('') === currentWord.toUpperCase()) {
      score += 10;
      if (scoreEl) scoreEl.textContent = String(score);
      messageEl.textContent = 'Great job! You found the word!';
      nextBtn.disabled = false;
    } else {
      messageEl.textContent = 'Nice! Keep going!';
    }
  } else {
    wrongLetters.add(letter);
    incorrectLettersEl.textContent = Array.from(wrongLetters).join(' ').toUpperCase();
    const wrongCount = wrongLetters.size;
    wrongCountEl.textContent = String(wrongCount);
    revealParts(wrongCount);
    if (wrongCount >= 6) {
      messageEl.textContent = `Oh no! The word was "${currentWord.toUpperCase()}"`;
      nextBtn.disabled = false;
    } else {
      messageEl.textContent = 'Not quite. Try another letter!';
    }
  }
  updateKeyboardStates();
}

function onKeydown(e) {
  const letter = (e.key || '').toLowerCase();
  if (/^[a-z]$/.test(letter)) {
    handleGuess(letter);
  } else if (e.key === 'Enter' && !nextBtn.disabled) {
    startRound();
  }
}

// Events
tabTeacher.addEventListener('click', () => switchTab('teacher'));
tabStudent.addEventListener('click', () => switchTab('student'));

addWordsBtn.addEventListener('click', () => {
  if (!wordsInput.value.trim()) return;
  addWordsFromText(wordsInput.value);
  wordsInput.value = '';
  messageEl.textContent = 'Words saved. Switch to Student to play!';
});

clearWordsBtn.addEventListener('click', () => {
  if (!confirm('Clear all words?')) return;
  words = [];
  saveWordsToStorage();
  renderWordList();
});

exportBtn.addEventListener('click', () => {
  const blob = new Blob([words.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'hangman-words.txt';
  a.click();
  URL.revokeObjectURL(url);
});

document.querySelector('.import-label span').addEventListener('click', () => importFile.click());
document.querySelector('.import-label span').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') importFile.click();
});
importFile.addEventListener('change', async (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const text = await file.text();
  addWordsFromText(text);
  importFile.value = '';
});

startBtn.addEventListener('click', () => {
  score = 0;
  if (scoreEl) scoreEl.textContent = '0';
  startRound();
});
nextBtn.addEventListener('click', () => startRound());
resetRoundBtn.addEventListener('click', () => {
  if (!currentWord) return;
  startRound(currentWord);
});

document.addEventListener('keydown', onKeydown);

// Init
function init() {
  words = loadWordsFromStorage();
  renderWordList();
  buildKeyboard();
  messageEl.textContent = words.length ? 'Press Start to begin!' : 'Add words in the Teacher tab first.';
}

init();


