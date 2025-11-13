class HangmanGame {
    constructor() {
        this.words = [];
        this.currentWord = '';
        this.guessedLetters = [];
        this.incorrectLetters = [];
        this.wrongGuesses = 0;
        this.maxWrongGuesses = 6;
        this.score = 0;
        this.gameName = '';
        this.gameStarted = false;
        this.currentWordIndex = 0;
        this.activeWords = [];
        this.correctWordsCount = 0;
        this.currentHintUsed = false;
        this.currentWordData = null;
        
        this.initializeElements();
        this.attachEventListeners();
        this.loadSavedWords();
        this.updateWordsList();
        this.updateWordsLeft();
    }
    
    initializeElements() {
        // Page elements (must be assigned before querying their children)
        this.teacherPage = document.getElementById('teacherPage');
        this.studentPage = document.getElementById('studentPage');

        // Teacher page elements
        this.gameNameInput = document.getElementById('gameName');
        this.wordInput = document.getElementById('wordInput');
        this.hintTextInput = document.getElementById('hintTextInput');
        this.hintImageInput = document.getElementById('hintImageInput');
        this.addWordBtn = document.getElementById('addWordBtn');
        this.wordsList = document.getElementById('wordsList');
        this.saveWordsBtn = document.getElementById('saveWordsBtn');
        this.goToStudentBtn = document.getElementById('goToStudentBtn');
        this.saveStatus = document.getElementById('saveStatus');
        this.clearWordsBtn = document.getElementById('clearWordsBtn');
        // Win overlay elements
        this.winOverlay = document.getElementById('winOverlay');
        this.winScore = document.getElementById('winScore');
        this.winSubtitle = document.getElementById('winSubtitle');
        this.winNewGameBtn = document.getElementById('winNewGameBtn');
        this.winResetBtn = document.getElementById('winResetBtn');
        
        // Student page elements
        this.studentGameTitle = document.getElementById('studentGameTitle');
        this.scoreElement = document.getElementById('score');
        this.wordsLeftElement = document.getElementById('wordsLeft');
        this.wordDisplay = document.getElementById('wordDisplay');
        this.gameMessage = document.getElementById('gameMessage');
        this.incorrectLettersElement = document.getElementById('incorrectLetters');
        this.letterInput = document.getElementById('letterInput');
        this.guessBtn = document.getElementById('guessBtn');
        this.showHintBtn = document.getElementById('showHintBtn');
        this.hintDisplay = document.getElementById('hintDisplay');
        this.startGameBtn = document.getElementById('startGameBtn');
        this.nextWordBtn = document.getElementById('nextWordBtn');
        this.newGameBtn = document.getElementById('newGameBtn');
        this.backToTeacherBtn = document.getElementById('backToTeacherBtn');
        // Student page sections to toggle visibility pre/post start
        this.gameInfoSection = this.studentPage.querySelector('.game-info');
        this.gameAreaSection = this.studentPage.querySelector('.game-area');
        this.guessSection = this.studentPage.querySelector('.guess-section');
        
        // Hangman parts
        this.hangmanParts = ['head', 'body', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'];
    }
    
    loadSavedWords() {
        const savedWords = localStorage.getItem('hangmanWords');
        const savedGameName = localStorage.getItem('hangmanGameName');
        if (savedWords) {
            try {
                const parsed = JSON.parse(savedWords);
                this.words = this.normalizeWords(parsed);
            } catch {
                this.words = [];
            }
        }
        if (savedGameName) {
            this.studentGameTitle.textContent = savedGameName;
            if (this.gameNameInput) {
                this.gameNameInput.value = savedGameName;
            }
        }
    }

    clearAllWords(options = {}) {
        const { suppressConfirm = false } = options;
        if (!suppressConfirm) {
            const confirmed = confirm('Clear all saved words and hints?');
            if (!confirmed) {
                return;
            }
        }
        this.words = [];
        this.activeWords = [];
        this.persistWordsToLocalStorage();
        this.updateWordsList();
        this.refreshWordsLeftFromStorage();
        if (this.wordInput) this.wordInput.value = '';
        this.resetHintInputs();
        if (this.gameMessage) {
            this.gameMessage.textContent = 'All words cleared. Add new words to play!';
        }
        this.clearHintDisplay();
    }

    normalizeWords(rawWords) {
        if (!Array.isArray(rawWords)) return [];
        return rawWords
            .map((item) => {
                if (typeof item === 'string') {
                    const normalized = item.trim().toLowerCase();
                    return normalized ? { word: normalized, hintText: '', hintImage: '' } : null;
                }
                if (item && typeof item === 'object') {
                    const normalized = (item.word || '').trim().toLowerCase();
                    if (!normalized) return null;
                    return {
                        word: normalized,
                        hintText: item.hintText ? String(item.hintText) : '',
                        hintImage: item.hintImage ? String(item.hintImage) : ''
                    };
                }
                return null;
            })
            .filter(Boolean);
    }

    persistWordsToLocalStorage() {
        localStorage.setItem('hangmanWords', JSON.stringify(this.words));
    }

    readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        });
    }

    resetHintInputs() {
        if (this.hintTextInput) this.hintTextInput.value = '';
        if (this.hintImageInput) this.hintImageInput.value = '';
    }

    clearHintDisplay() {
        if (this.hintDisplay) {
            this.hintDisplay.innerHTML = '';
            this.hintDisplay.classList.remove('has-hint');
            this.hintDisplay.textContent = 'No hint available.';
        }
    }

    updateHintUI() {
        if (!this.showHintBtn) return;
        this.clearHintDisplay();
        const hasHint = this.currentWordData && (this.currentWordData.hintText || this.currentWordData.hintImage);
        if (hasHint) {
            this.showHintBtn.style.display = 'block';
            this.showHintBtn.disabled = false;
            this.showHintBtn.textContent = 'Show Hint';
            if (this.hintDisplay) {
                this.hintDisplay.textContent = 'Hint hidden until you click Show Hint.';
            }
        } else {
            this.showHintBtn.style.display = 'none';
            if (this.hintDisplay) {
                this.hintDisplay.textContent = 'No hint available.';
            }
        }
    }
    
    attachEventListeners() {
        // Teacher page events
        this.addWordBtn && this.addWordBtn.addEventListener('click', (e) => { 
            e.preventDefault(); 
            e.stopPropagation();
            this.addWord(); 
        });
        this.wordInput.addEventListener('input', () => {
            if (!this.wordInput) return;
            const sanitized = this.wordInput.value.replace(/\s+/g, '');
            if (sanitized !== this.wordInput.value) {
                this.wordInput.value = sanitized;
            }
        });
        this.wordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addWord();
        });
        this.saveWordsBtn && this.saveWordsBtn.addEventListener('click', () => this.saveWords());
        this.goToStudentBtn && this.goToStudentBtn.addEventListener('click', () => this.goToStudentPage());
        
        // Student page events
        this.startGameBtn && this.startGameBtn.addEventListener('click', () => this.startGame());
        this.guessBtn && this.guessBtn.addEventListener('click', () => this.makeGuess());
        this.showHintBtn && this.showHintBtn.addEventListener('click', () => this.showHint());
        this.letterInput && this.letterInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.makeGuess();
        });
        this.nextWordBtn && this.nextWordBtn.addEventListener('click', () => this.nextWord());
        this.newGameBtn && this.newGameBtn.addEventListener('click', () => this.startNewGame());
        this.backToTeacherBtn && this.backToTeacherBtn.addEventListener('click', () => this.goToTeacherPage());
        this.clearWordsBtn && this.clearWordsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.clearAllWords();
        });
        this.winNewGameBtn && this.winNewGameBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.hideWinOverlay();
            this.startNewGame();
        });
        this.winResetBtn && this.winResetBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.hideWinOverlay();
            this.clearAllWords({ suppressConfirm: true });
            this.goToTeacherPage();
        });

        // Resilient global delegation as a safety net
        document.addEventListener('click', (e) => {
            const target = e.target;
            if (!(target instanceof HTMLElement)) return;
            switch (target.id) {
                case 'addWordBtn':
                    e.preventDefault();
                    this.addWord();
                    break;
                case 'saveWordsBtn':
                    this.saveWords();
                    break;
                case 'goToStudentBtn':
                    this.goToStudentPage();
                    break;
                case 'startGameBtn':
                    this.startGame();
                    break;
                case 'guessBtn':
                    this.makeGuess();
                    break;
                case 'nextWordBtn':
                    this.nextWord();
                    break;
                case 'newGameBtn':
                    this.startNewGame();
                    break;
                case 'backToTeacherBtn':
                    this.goToTeacherPage();
                    break;
                case 'showHintBtn':
                    this.showHint();
                    break;
                case 'winNewGameBtn':
                    this.hideWinOverlay();
                    this.startNewGame();
                    break;
                case 'winResetBtn':
                    this.hideWinOverlay();
                    this.clearAllWords({ suppressConfirm: true });
                    this.goToTeacherPage();
                    break;
                case 'clearWordsBtn':
                    this.clearAllWords();
                    break;
            }
        });
    }
    
    shuffleArray(array) {
        // Use crypto-based RNG when available for better randomness
        const randomInt = (maxExclusive) => {
            if (window.crypto && window.crypto.getRandomValues) {
                const buf = new Uint32Array(1);
                window.crypto.getRandomValues(buf);
                return Math.floor((buf[0] / (0xFFFFFFFF + 1)) * maxExclusive);
            }
            return Math.floor(Math.random() * maxExclusive);
        };
        for (let i = array.length - 1; i > 0; i--) {
            const j = randomInt(i + 1);
            [array[i], array[j]] = [array[j], array[i]];
        }
        // Add a random rotation to further vary order on short lists
        if (array.length > 1) {
            const rotateBy = randomInt(array.length);
            if (rotateBy > 0) {
                const head = array.splice(0, rotateBy);
                array.push(...head);
            }
        }
    }
    
    async addWord() {
        if (!this.wordInput) return;
        const rawInput = this.wordInput.value;
        const word = rawInput.trim().toLowerCase();
        if (!word) return;
        if (/\s/.test(word)) {
            alert('Please enter a single word without spaces.');
            return;
        }

        if (this.words.some((item) => item.word === word)) {
            alert('This word has already been added.');
            return;
        }

        const hintText = this.hintTextInput ? this.hintTextInput.value.trim() : '';
        let hintImage = '';
        const hintFile = this.hintImageInput && this.hintImageInput.files ? this.hintImageInput.files[0] : null;
        if (hintFile) {
            try {
                hintImage = await this.readFileAsDataURL(hintFile);
            } catch (error) {
                console.error('Failed to read hint image:', error);
                alert('Unable to load the hint image. Please try a different file.');
            }
        }

        this.words.push({
            word,
            hintText,
            hintImage
        });
        this.updateWordsList();
        this.persistWordsToLocalStorage();
        this.wordInput.value = '';
        this.resetHintInputs();
        this.refreshWordsLeftFromStorage();
    }
    
    getRandomEncouragement() {
        const phrases = [
            'Excellent!',
            'Well done!',
            'Awesome!',
            'Fantastic!',
            'Great work!',
            'Impressive!',
            'Nice job!',
            'Brilliant!',
            'Superb!',
            'Outstanding!'
        ];
        const idx = Math.floor(Math.random() * phrases.length);
        return phrases[idx];
    }
    
    updateWordsList() {
        if (!this.wordsList) return;
        this.wordsList.innerHTML = '';
        this.words.forEach((wordEntry, index) => {
            const li = document.createElement('li');
            const hintBadges = [];
            if (wordEntry.hintText) {
                hintBadges.push('<span class="hint-badge">Text Hint</span>');
            }
            if (wordEntry.hintImage) {
                hintBadges.push('<span class="hint-badge image">Image</span>');
            }
            li.innerHTML = `
                <span class="word-label">${wordEntry.word.toUpperCase()}</span>
                ${hintBadges.join(' ')}
                <button class="remove-word" data-index="${index}">×</button>
            `;
            this.wordsList.appendChild(li);
        });
        // Delegate remove clicks
        this.wordsList.querySelectorAll('.remove-word').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.getAttribute('data-index'), 10);
                this.removeWord(idx);
            });
        });
    }
    
    removeWord(index) {
        if (index < 0 || index >= this.words.length) return;
        this.words.splice(index, 1);
        this.updateWordsList();
        // Persist removal and update words left if on student page
        this.persistWordsToLocalStorage();
        this.refreshWordsLeftFromStorage();
    }
    
    saveWords() {
        if (this.words.length === 0) {
            this.showSaveStatus('Please add at least one word before saving.', true);
            return;
        }
        
        this.gameName = this.gameNameInput.value.trim() || 'Hangman Game';
        this.studentGameTitle.textContent = this.gameName;
        
        // Store words in localStorage
        this.persistWordsToLocalStorage();
        localStorage.setItem('hangmanGameName', this.gameName);
        
        this.showSaveStatus(`${this.words.length} word(s) saved. Switch to Student to play!`);
        this.refreshWordsLeftFromStorage();
    }

    showSaveStatus(message, isError = false) {
        if (!this.saveStatus) return;
        this.saveStatus.textContent = message;
        this.saveStatus.style.display = 'block';
        this.saveStatus.style.background = isError ? '#f8d7da' : '#d4edda';
        this.saveStatus.style.color = isError ? '#721c24' : '#155724';
        this.saveStatus.style.border = isError ? '1px solid #f5c6cb' : '1px solid #c3e6cb';
        clearTimeout(this._saveStatusTimer);
        this._saveStatusTimer = setTimeout(() => {
            if (this.saveStatus) this.saveStatus.style.display = 'none';
        }, 3000);
    }
    
    goToStudentPage() {
        if (this.words.length === 0) {
            alert('Please add and save words first.');
            return;
        }
        
        this.teacherPage.classList.remove('active');
        this.studentPage.classList.add('active');
        
        // Load saved words and game name
        this.loadSavedWords();
        this.updateWordsList();
        
        this.wordsLeftElement.textContent = this.words.length;
        this.gameMessage.textContent = 'Click Start to play!';
        this.currentHintUsed = false;
        this.currentWordData = null;
        this.updateHintUI();
        
        // Before game starts, show only title and Start button
        this.toggleStudentInterface(false);
    }
    
    goToTeacherPage() {
        this.studentPage.classList.remove('active');
        this.teacherPage.classList.add('active');
        this.resetGame();
    }
    
    startGame() {
        if (this.words.length === 0) {
            alert('No words available. Please go back to teacher page to add words.');
            return;
        }
        
        // Always reload latest saved words and game name at start
        this.loadSavedWords();
        this.updateWordsList();
        this.activeWords = this.words.map(item => ({ ...item }));
        this.shuffleArray(this.activeWords);
        this.wordsLeftElement.textContent = this.activeWords.length;
        
        this.gameStarted = true;
        this.currentWordIndex = 0;
        this.score = 0;
        this.correctWordsCount = 0;
        this.currentHintUsed = false;
        this.currentWordData = null;
        this.scoreElement.textContent = this.score;
        this.startGameBtn.style.display = 'none';
        this.toggleStudentInterface(true);
        this.updateHintUI();
        this.wordDisplay.textContent = '';
        this.gameMessage.textContent = '';
        this.incorrectLetters = [];
        this.incorrectLettersElement.textContent = '';
        if (this.letterInput) this.letterInput.value = '';
        this.resetHangman();
        this.nextWord();
    }
    
    nextWord() {
        if (this.currentWordIndex >= this.activeWords.length) {
            this.endGame();
            return;
        }
        
        this.currentWordData = this.activeWords[this.currentWordIndex];
        this.currentWord = this.currentWordData.word;
        if (!this.currentWord) {
            this.endGame();
            return;
        }
        this.guessedLetters = [];
        this.incorrectLetters = [];
        this.wrongGuesses = 0;
        this.currentHintUsed = false;
        
        this.updateWordDisplay();
        this.updateIncorrectLetters();
        this.resetHangman();
        this.updateWordsLeft();
        this.updateHintUI();
        
        this.nextWordBtn.style.display = 'none';
        this.newGameBtn.style.display = 'none';
        this.gameMessage.textContent = '';
    }
    
    makeGuess() {
        if (!this.gameStarted || !this.letterInput) return;
        
        const letter = this.letterInput.value.toLowerCase().trim();
        this.letterInput.value = '';
        if (!this.currentWord) return;
        
        // Only show alert if the user entered multiple characters.
        // Ignore empty submissions silently.
        if (letter.length === 0) return;
        if (letter.length > 1) { alert('Please enter a single letter.'); return; }
        
        if (this.guessedLetters.includes(letter) || this.incorrectLetters.includes(letter)) {
            alert('You already guessed this letter.');
            return;
        }
        
        if (this.currentWord.includes(letter)) {
            this.guessedLetters.push(letter);
            this.updateWordDisplay();
            
            if (this.isWordComplete()) {
                this.wordGuessed();
            }
        } else {
            this.incorrectLetters.push(letter);
            this.wrongGuesses++;
            this.updateIncorrectLetters();
            this.updateHangman();
            
            if (this.wrongGuesses >= this.maxWrongGuesses) {
                this.wordFailed();
            }
        }
    }
    
    updateWordDisplay() {
        let display = '';
        for (let letter of this.currentWord) {
            if (this.guessedLetters.includes(letter)) {
                display += letter.toUpperCase() + ' ';
            } else {
                display += '_ ';
            }
        }
        this.wordDisplay.textContent = display.trim();
    }
    
    updateIncorrectLetters() {
        this.incorrectLettersElement.textContent = this.incorrectLetters.join(' ');
    }

    showHint() {
        if (!this.showHintBtn || !this.hintDisplay || !this.currentWordData) return;
        const { hintText, hintImage } = this.currentWordData;
        if (!hintText && !hintImage) return;

        this.currentHintUsed = true;
        this.hintDisplay.innerHTML = '';
        const header = document.createElement('div');
        header.classList.add('hint-header');
        header.textContent = 'HINT:';
        this.hintDisplay.appendChild(header);

        if (hintText) {
            const textEl = document.createElement('p');
            textEl.textContent = hintText;
            this.hintDisplay.appendChild(textEl);
        }

        if (hintImage) {
            const imgEl = document.createElement('img');
            imgEl.src = hintImage;
            imgEl.alt = 'Hint image';
            this.hintDisplay.appendChild(imgEl);
        }

        if (!hintText && hintImage) {
            const caption = document.createElement('p');
            caption.textContent = 'Hint image';
            this.hintDisplay.appendChild(caption);
        }

        this.hintDisplay.classList.add('has-hint');

        this.showHintBtn.disabled = true;
        this.showHintBtn.textContent = 'Hint Shown';
    }
    
    updateHangman() {
        if (this.wrongGuesses > 0 && this.wrongGuesses <= this.hangmanParts.length) {
            const part = this.hangmanParts[this.wrongGuesses - 1];
            const element = document.getElementById(part);
            if (element) {
                element.style.display = 'block';
            }
        }
    }
    
    resetHangman() {
        this.hangmanParts.forEach(part => {
            const element = document.getElementById(part);
            if (element) {
                element.style.display = 'none';
            }
        });
    }
    
    updateWordsLeft() {
        if (this.gameStarted) {
            const remaining = Math.max((this.activeWords.length || 0) - this.currentWordIndex, 0);
            this.wordsLeftElement.textContent = remaining;
        } else {
            this.wordsLeftElement.textContent = this.words.length;
        }
    }
    
    isWordComplete() {
        for (let letter of this.currentWord) {
            if (!this.guessedLetters.includes(letter)) {
                return false;
            }
        }
        return true;
    }
    
    wordGuessed() {
        const pointsEarned = this.currentHintUsed ? 5 : 10;
        this.score += pointsEarned;
        this.correctWordsCount = (this.correctWordsCount || 0) + 1;
        this.scoreElement.textContent = this.score;
        const cheer = this.getRandomEncouragement();
        this.gameMessage.textContent = `Congratulations! You guessed the word "${this.currentWord.toUpperCase()}" and you got +${pointsEarned} points! ${cheer}`;
        // If this was the last word, end game instead of showing Next Word
        if (this.currentWordIndex + 1 >= this.activeWords.length) {
            this.currentWordIndex++;
            this.endGame();
        } else {
            this.nextWordBtn.style.display = 'inline-block';
            this.currentWordIndex++;
        }
    }
    
    wordFailed() {
        this.gameMessage.textContent = `Game Over! The word was "${this.currentWord.toUpperCase()}".`;
        // If this was the last word, end game instead of showing Next Word
        if (this.currentWordIndex + 1 >= this.activeWords.length) {
            this.currentWordIndex++;
            this.endGame();
        } else {
            this.nextWordBtn.style.display = 'inline-block';
            this.currentWordIndex++;
        }
    }
    
    endGame() {
        const totalWords = (this.activeWords && this.activeWords.length) ? this.activeWords.length : this.words.length;
        const allGuessed = totalWords > 0 && (this.correctWordsCount || 0) === totalWords;
        if (allGuessed && this.winOverlay && this.winScore) {
            const cheer = this.getRandomEncouragement();
            this.winScore.textContent = `Game Complete! Final Score: ${this.score} points`;
            if (this.winSubtitle) this.winSubtitle.textContent = cheer;
            this.winOverlay.style.display = 'flex';
            this.winOverlay.setAttribute('aria-hidden', 'false');
            if (this.winNewGameBtn) this.winNewGameBtn.textContent = 'Replay Game';
            if (this.winResetBtn) this.winResetBtn.style.display = '';
            // Hide in-page final controls when using overlay
            this.newGameBtn.style.display = 'none';
            this.nextWordBtn.style.display = 'none';
        } else {
            const cheer = this.getRandomEncouragement();
            this.gameMessage.innerHTML = `<span class="final-message">Game Complete! Final Score: ${this.score} points — ${cheer}</span>`;
            if (this.newGameBtn) this.newGameBtn.textContent = 'Replay Game';
            this.newGameBtn.style.display = 'inline-block';
            this.nextWordBtn.style.display = 'none';
        }
    }
    
    startNewGame() {
        this.resetGame();
        this.startGame();
    }
    
    resetGame() {
        this.gameStarted = false;
        this.currentWord = '';
        this.guessedLetters = [];
        this.incorrectLetters = [];
        this.wrongGuesses = 0;
        this.score = 0;
        this.currentWordIndex = 0;
        this.correctWordsCount = 0;
        this.activeWords = [];
        this.currentHintUsed = false;
        this.currentWordData = null;
        
        this.wordDisplay.textContent = '';
        this.gameMessage.textContent = 'Click Start to play!';
        this.incorrectLettersElement.textContent = '';
        this.scoreElement.textContent = '0';
        this.wordsLeftElement.textContent = this.words.length;
        
        this.startGameBtn.style.display = 'inline-block';
        this.nextWordBtn.style.display = 'none';
        this.newGameBtn.style.display = 'none';
        
        this.resetHangman();
        this.hideWinOverlay();
        this.updateHintUI();
    }

    refreshWordsLeftFromStorage() {
        // Keep student page words left in sync with saved words
        const savedWords = localStorage.getItem('hangmanWords');
        if (savedWords) {
            try {
                const savedList = JSON.parse(savedWords);
                this.words = this.normalizeWords(savedList);
                this.updateWordsList();
            } catch {
                this.words = [];
            }
            if (!this.gameStarted) {
                this.wordsLeftElement.textContent = this.words.length;
            } else {
                if (!this.activeWords || this.activeWords.length === 0) {
                    this.activeWords = this.words.map(item => ({ ...item }));
                    this.shuffleArray(this.activeWords);
                }
                const remaining = Math.max(this.activeWords.length - this.currentWordIndex, 0);
                this.wordsLeftElement.textContent = remaining;
            }
        }
    }

    hideWinOverlay() {
        if (this.winOverlay) {
            this.winOverlay.style.display = 'none';
            this.winOverlay.setAttribute('aria-hidden', 'true');
            if (this.winSubtitle) {
                this.winSubtitle.textContent = 'Great job!';
            }
        }
    }
    toggleStudentInterface(showFull) {
        const displayValue = showFull ? '' : 'none';
        if (this.gameInfoSection) this.gameInfoSection.style.display = displayValue;
        if (this.gameAreaSection) this.gameAreaSection.style.display = displayValue;
        if (this.guessSection) this.guessSection.style.display = displayValue;

        if (this.backToTeacherBtn) {
            this.backToTeacherBtn.style.display = showFull ? '' : 'none';
        }

        if (!showFull) {
            if (this.startGameBtn) this.startGameBtn.style.display = 'inline-block';
            this.currentHintUsed = false;
            this.currentWordData = null;
            this.updateHintUI();
        }
    }
}

// Initialize the game when the DOM is ready and expose it globally
document.addEventListener('DOMContentLoaded', () => {
    window.game = new HangmanGame();
});
