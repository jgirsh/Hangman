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
        
        this.initializeElements();
        this.attachEventListeners();
    }
    
    initializeElements() {
        // Page elements (must be assigned before querying their children)
        this.teacherPage = document.getElementById('teacherPage');
        this.studentPage = document.getElementById('studentPage');

        // Teacher page elements
        this.gameNameInput = document.getElementById('gameName');
        this.wordInput = document.getElementById('wordInput');
        this.addWordBtn = document.getElementById('addWordBtn');
        this.wordsList = document.getElementById('wordsList');
        this.saveWordsBtn = document.getElementById('saveWordsBtn');
        this.goToStudentBtn = document.getElementById('goToStudentBtn');
        this.saveStatus = document.getElementById('saveStatus');
        
        // Student page elements
        this.studentGameTitle = document.getElementById('studentGameTitle');
        this.scoreElement = document.getElementById('score');
        this.wordsLeftElement = document.getElementById('wordsLeft');
        this.wordDisplay = document.getElementById('wordDisplay');
        this.gameMessage = document.getElementById('gameMessage');
        this.incorrectLettersElement = document.getElementById('incorrectLetters');
        this.letterInput = document.getElementById('letterInput');
        this.guessBtn = document.getElementById('guessBtn');
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
            this.words = JSON.parse(savedWords);
        }
        if (savedGameName) {
            this.studentGameTitle.textContent = savedGameName;
        }
    }
    
    attachEventListeners() {
        // Teacher page events
        this.addWordBtn && this.addWordBtn.addEventListener('click', (e) => { e.preventDefault(); this.addWord(); });
        this.wordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addWord();
        });
        this.saveWordsBtn && this.saveWordsBtn.addEventListener('click', () => this.saveWords());
        this.goToStudentBtn && this.goToStudentBtn.addEventListener('click', () => this.goToStudentPage());
        
        // Student page events
        this.startGameBtn && this.startGameBtn.addEventListener('click', () => this.startGame());
        this.guessBtn && this.guessBtn.addEventListener('click', () => this.makeGuess());
        this.letterInput && this.letterInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.makeGuess();
        });
        this.nextWordBtn && this.nextWordBtn.addEventListener('click', () => this.nextWord());
        this.newGameBtn && this.newGameBtn.addEventListener('click', () => this.startNewGame());
        this.backToTeacherBtn && this.backToTeacherBtn.addEventListener('click', () => this.goToTeacherPage());

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
            }
        });
    }
    
    addWord() {
        const word = this.wordInput.value.trim().toLowerCase();
        if (word && !this.words.includes(word)) {
            this.words.push(word);
            this.updateWordsList();
            // Persist immediately so state is not lost
            localStorage.setItem('hangmanWords', JSON.stringify(this.words));
            this.wordInput.value = '';
        }
    }
    
    updateWordsList() {
        this.wordsList.innerHTML = '';
        this.words.forEach((word, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                ${word.toUpperCase()}
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
        this.words.splice(index, 1);
        this.updateWordsList();
        // Persist removal and update words left if on student page
        localStorage.setItem('hangmanWords', JSON.stringify(this.words));
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
        localStorage.setItem('hangmanWords', JSON.stringify(this.words));
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
        
        this.wordsLeftElement.textContent = this.words.length;
        this.gameMessage.textContent = 'Click Start to play!';
        
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
        this.wordsLeftElement.textContent = this.words.length;
        
        this.gameStarted = true;
        this.currentWordIndex = 0;
        this.score = 0;
        this.scoreElement.textContent = this.score;
        this.startGameBtn.style.display = 'none';
        this.toggleStudentInterface(true);
        this.nextWord();
    }
    
    nextWord() {
        if (this.currentWordIndex >= this.words.length) {
            this.endGame();
            return;
        }
        
        this.currentWord = this.words[this.currentWordIndex];
        this.guessedLetters = [];
        this.incorrectLetters = [];
        this.wrongGuesses = 0;
        
        this.updateWordDisplay();
        this.updateIncorrectLetters();
        this.resetHangman();
        this.updateWordsLeft();
        
        this.nextWordBtn.style.display = 'none';
        this.newGameBtn.style.display = 'none';
        this.gameMessage.textContent = '';
    }
    
    makeGuess() {
        if (!this.gameStarted) return;
        
        const letter = this.letterInput.value.toLowerCase().trim();
        this.letterInput.value = '';
        
        if (!letter || letter.length !== 1) {
            alert('Please enter a single letter.');
            return;
        }
        
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
        this.wordsLeftElement.textContent = this.words.length - this.currentWordIndex;
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
        this.score += 10;
        this.scoreElement.textContent = this.score;
        this.gameMessage.textContent = `Congratulations! You guessed the word "${this.currentWord.toUpperCase()}" and you got +10 points!`;
        // If this was the last word, end game instead of showing Next Word
        if (this.currentWordIndex + 1 >= this.words.length) {
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
        if (this.currentWordIndex + 1 >= this.words.length) {
            this.currentWordIndex++;
            this.endGame();
        } else {
            this.nextWordBtn.style.display = 'inline-block';
            this.currentWordIndex++;
        }
    }
    
    endGame() {
        this.gameMessage.innerHTML = `<span class="final-message">Game Complete! Final Score: ${this.score} points</span>`;
        this.newGameBtn.style.display = 'inline-block';
        this.nextWordBtn.style.display = 'none';
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
        
        this.wordDisplay.textContent = '';
        this.gameMessage.textContent = 'Click Start to play!';
        this.incorrectLettersElement.textContent = '';
        this.scoreElement.textContent = '0';
        this.wordsLeftElement.textContent = this.words.length;
        
        this.startGameBtn.style.display = 'inline-block';
        this.nextWordBtn.style.display = 'none';
        this.newGameBtn.style.display = 'none';
        
        this.resetHangman();
    }

    refreshWordsLeftFromStorage() {
        // Keep student page words left in sync with saved words
        const savedWords = localStorage.getItem('hangmanWords');
        if (savedWords) {
            const savedList = JSON.parse(savedWords);
            this.words = savedList;
            if (!this.gameStarted) {
                this.wordsLeftElement.textContent = this.words.length;
            } else {
                // If mid-game, remaining words are total minus currentWordIndex
                const remaining = Math.max(this.words.length - this.currentWordIndex, 0);
                this.wordsLeftElement.textContent = remaining;
            }
        }
    }

    toggleStudentInterface(showFull) {
        if (showFull) {
            this.gameInfoSection.style.display = '';
            this.gameAreaSection.style.display = '';
            this.guessSection.style.display = '';
            this.backToTeacherBtn.style.display = '';
        } else {
            this.gameInfoSection.style.display = 'none';
            this.gameAreaSection.style.display = 'none';
            this.guessSection.style.display = 'none';
            // Show Start button; hide Back to Teacher to match requested minimal view
            this.startGameBtn.style.display = 'inline-block';
            this.backToTeacherBtn.style.display = 'none';
        }
    }
}

// Initialize the game when the DOM is ready and expose it globally
document.addEventListener('DOMContentLoaded', () => {
    window.game = new HangmanGame();
});