// static/script.js - The main game logic and front-end interaction.

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const appContainer = document.getElementById('app');
    const authView = document.getElementById('auth-view');
    const gameView = document.getElementById('game-view');
    const leaderboardView = document.getElementById('leaderboard-view');
    const authMessage = document.getElementById('auth-message');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginFormContainer = document.getElementById('login-form-container');
    const registerFormContainer = document.getElementById('register-form-container');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const usernameDisplay = document.getElementById('username-display');
    const logoutButton = document.getElementById('logout-button');
    const leaderboardLinkBtn = document.getElementById('leaderboard-link-btn');
    const showGameBtn = document.getElementById('show-game-btn');
    const bingoBoard = document.getElementById('bingo-board');
    const currentNumberDisplay = document.getElementById('current-number-display');
    const currentNumberEl = document.getElementById('current-number');
    const callNumberBtn = document.getElementById('call-number-btn');
    const checkBingoBtn = document.getElementById('check-bingo-btn');
    const newGameBtn = document.getElementById('new-game-btn');
    const gameMessage = document.getElementById('game-message');
    const leaderboardTableBody = document.querySelector('#leaderboard-table tbody');

    // --- Game State Variables ---
    let bingoCard = [];
    let markedNumbers = new Set();
    let calledNumbers = new Set();
    let isGameActive = false;

    // --- API Utility Function ---
    async function apiCall(endpoint, method = 'GET', body = null) {
        const options = {
            method: method,
            headers: { 'Content-Type': 'application/json' },
        };
        if (body) {
            options.body = JSON.stringify(body);
        }
        
        try {
            const response = await fetch(`/api/${endpoint}`, options);
            const data = await response.json();
            if (!response.ok) {
                // If the response is not ok, throw an error with the message from the backend.
                throw new Error(data.error || 'Something went wrong');
            }
            return data;
        } catch (error) {
            console.error('API Error:', error.message);
            authMessage.textContent = error.message;
            return null;
        }
    }

    // --- UI State Management ---
    function showView(view) {
        authView.classList.add('hidden');
        gameView.classList.add('hidden');
        leaderboardView.classList.add('hidden');
        
        if (view === 'auth') {
            authView.classList.remove('hidden');
            leaderboardLinkBtn.classList.add('hidden');
            logoutButton.classList.add('hidden');
            usernameDisplay.textContent = '';
        } else if (view === 'game') {
            gameView.classList.remove('hidden');
            leaderboardLinkBtn.classList.remove('hidden');
            logoutButton.classList.remove('hidden');
        } else if (view === 'leaderboard') {
            leaderboardView.classList.remove('hidden');
            leaderboardLinkBtn.classList.add('hidden');
        }
    }

    // Check login status on page load.
    async function checkLoginStatus() {
        const data = await apiCall('me');
        if (data && data.username) {
            usernameDisplay.textContent = `Welcome, ${data.username}!`;
            showView('game');
            newGame();
        } else {
            showView('auth');
        }
    }

    // --- Authentication Handlers ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = e.target['login-username'].value;
        const password = e.target['login-password'].value;
        const data = await apiCall('login', 'POST', { username, password });
        if (data) {
            authMessage.textContent = data.message;
            setTimeout(() => {
                authMessage.textContent = '';
                usernameDisplay.textContent = `Welcome, ${username}!`;
                showView('game');
                newGame(); // Start a new game after login.
            }, 1000);
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = e.target['register-username'].value;
        const password = e.target['register-password'].value;
        const data = await apiCall('register', 'POST', { username, password });
        if (data) {
            authMessage.textContent = data.message;
            setTimeout(() => {
                authMessage.textContent = '';
                loginFormContainer.classList.remove('hidden');
                registerFormContainer.classList.add('hidden');
            }, 1000);
        }
    });

    logoutButton.addEventListener('click', async () => {
        const data = await apiCall('logout', 'POST');
        if (data) {
            showView('auth');
            leaderboardLinkBtn.classList.add('hidden');
        }
    });

    // Toggle between login and registration forms.
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginFormContainer.classList.add('hidden');
        registerFormContainer.classList.remove('hidden');
        authMessage.textContent = '';
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginFormContainer.classList.remove('hidden');
        registerFormContainer.classList.add('hidden');
        authMessage.textContent = '';
    });
    
    // --- Leaderboard Logic ---
    async function fetchLeaderboard() {
        const leaderboardTableBody = document.querySelector('#leaderboard-table tbody');
        leaderboardTableBody.innerHTML = '';
        const data = await apiCall('leaderboard');
        if (data && data.length > 0) {
            data.forEach((entry, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="py-2">${index + 1}</td>
                    <td class="py-2">${entry.username}</td>
                    <td class="py-2">${entry.score}</td>
                `;
                leaderboardTableBody.appendChild(row);
            });
        } else {
            leaderboardTableBody.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-gray-400">No scores yet.</td></tr>';
        }
    }

    // --- Game Logic ---
    function generateBingoCard() {
        const card = [];
        const columns = {
            'B': [], 'I': [], 'N': [], 'G': [], 'O': []
        };
        
        // Generate unique random numbers for each column.
        ['B', 'I', 'N', 'G', 'O'].forEach((letter, index) => {
            const start = index * 15 + 1;
            const end = start + 14;
            let numbers = [];
            while (numbers.length < 5) {
                const num = Math.floor(Math.random() * (end - start + 1)) + start;
                if (!numbers.includes(num)) {
                    numbers.push(num);
                }
            }
            columns[letter] = numbers;
        });

        // The center square is the free space.
        columns['N'][2] = 'FREE';

        // Flatten the columns into a single array for easier rendering.
        card.push(...columns['B'], ...columns['I'], ...columns['N'], ...columns['G'], ...columns['O']);
        return card;
    }

    function renderBingoCard() {
        bingoBoard.innerHTML = `
            <div class="bingo-header">B</div>
            <div class="bingo-header">I</div>
            <div class="bingo-header">N</div>
            <div class="bingo-header">G</div>
            <div class="bingo-header">O</div>
        `;
        bingoCard.forEach((number, index) => {
            const cell = document.createElement('div');
            cell.classList.add('bingo-cell');
            cell.textContent = number;
            
            if (number === 'FREE') {
                cell.id = 'free-space';
                cell.classList.add('marked');
            }
            
            cell.dataset.number = number;
            bingoBoard.appendChild(cell);
            
            // The corrected logic is here:
            cell.addEventListener('click', () => {
                const cellNumber = cell.dataset.number;
                // Check if the number is on the card and has been called.
                // The 'FREE' space is a special case.
                if (cellNumber === 'FREE') {
                    gameMessage.textContent = "The 'FREE' space is always marked!";
                } else if (calledNumbers.has(cellNumber)) {
                    // Check if the number has already been marked
                    if (!markedNumbers.has(cellNumber)) {
                        cell.classList.add('marked');
                        markedNumbers.add(cellNumber);
                        gameMessage.textContent = `Number ${cellNumber} marked!`;
                    } else {
                        gameMessage.textContent = `Number ${cellNumber} is already marked.`;
                    }
                } else {
                    gameMessage.textContent = `Number ${cellNumber} hasn't been called yet.`;
                }
            });
        });

        // The FREE space is automatically marked.
        if (bingoCard.includes('FREE')) {
            markedNumbers.add('FREE');
        }
    }

    function checkBingo() {
        const winningPatterns = [
            [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14], [15, 16, 17, 18, 19], [20, 21, 22, 23, 24], // Rows
            [0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22], [3, 8, 13, 18, 23], [4, 9, 14, 19, 24], // Columns
            [0, 6, 12, 18, 24], [4, 8, 12, 16, 20] // Diagonals
        ];

        for (const pattern of winningPatterns) {
            const isBingo = pattern.every(index => {
                const number = bingoCard[index];
                return markedNumbers.has(String(number));
            });
            if (isBingo) {
                return true;
            }
        }
        return false;
    }

    function newGame() {
        bingoCard = generateBingoCard();
        markedNumbers = new Set();
        calledNumbers = new Set();
        renderBingoCard();
        currentNumberEl.textContent = '';
        gameMessage.textContent = 'Game started! Call the first number.';
        callNumberBtn.classList.remove('hidden');
        checkBingoBtn.classList.remove('hidden');
        newGameBtn.classList.add('hidden');
        isGameActive = true;
    }

    function callNextNumber() {
        if (!isGameActive) {
            gameMessage.textContent = "Please start a new game first.";
            return;
        }

        const allNumbers = Array.from({ length: 75 }, (_, i) => i + 1);
        const availableNumbers = allNumbers.filter(num => !calledNumbers.has(String(num)));
        
        if (availableNumbers.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableNumbers.length);
            const nextNumber = availableNumbers[randomIndex];
            calledNumbers.add(String(nextNumber));
            currentNumberEl.textContent = nextNumber;
            gameMessage.textContent = `Number called: ${nextNumber}`;
        } else {
            gameMessage.textContent = "All numbers have been called! No winner.";
            callNumberBtn.disabled = true;
        }
    }
    
    // --- Event Listeners ---
    callNumberBtn.addEventListener('click', callNextNumber);

    checkBingoBtn.addEventListener('click', async () => {
        if (!isGameActive) {
            gameMessage.textContent = "No game in progress.";
            return;
        }

        if (checkBingo()) {
            gameMessage.textContent = "BINGO! You won!";
            const score = 75 - calledNumbers.size; // Simple scoring based on fewer calls.
            // Submit the score to the backend.
            await apiCall('submit_score', 'POST', { score: score });
            callNumberBtn.classList.add('hidden');
            checkBingoBtn.classList.add('hidden');
            newGameBtn.classList.remove('hidden');
            isGameActive = false;
        } else {
            gameMessage.textContent = "Not a Bingo yet. Keep playing!";
        }
    });

    newGameBtn.addEventListener('click', newGame);
    
    leaderboardLinkBtn.addEventListener('click', () => {
        fetchLeaderboard();
        showView('leaderboard');
    });

    showGameBtn.addEventListener('click', () => {
        showView('game');
    });

    // Initial check on page load.
    checkLoginStatus();
});
