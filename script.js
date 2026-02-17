import {checkWinner, checkTie, resetBoard, updateScore} from "./gameUtilization.js";

const elements = {
    cells: document.querySelectorAll(".cells"),
    board: document.querySelector(".board"),
    levelSelect: document.querySelector("#level-select"),
    playerCard: document.querySelector("#player"),
    computerCard: document.querySelector("#computer"),
    startBtn: document.querySelector("#start"),
    restartBtn: document.querySelector("#restart"),
    resetBtn: document.querySelector("#reset"),
    turnLabel: document.querySelector("#turn-label"),
    modal: document.querySelector("#result-modal"),
    modalMessage: document.querySelector("#result-message"),
    modalClose: document.querySelector("#modal-close"),
};

// Default board size (Level 1)
let boardSize = 3;

const rd = {
   players: null,
   currentPlayer: null,
   oponent: () =>
      rd.currentPlayer === rd.players[0] ? rd.players[1] : rd.players[0],
};

const game = (function () {
   let board = Array(boardSize * boardSize).fill("");

   const getBoard = () => board;
   const setBoard = (newBoard) => (board = newBoard);
   const isSlotEmpty = (idx) => board[idx] === "";
   const setSlot = (idx, player) => (board[idx] = player.value);
   const switchPlayer = (players, current) =>
      (rd.currentPlayer = current === players[0] ? players[1] : players[0]);
   return { getBoard, setBoard, isSlotEmpty, setSlot, switchPlayer };
})();

function renderBoard(size) {
   const boardEl = elements.board;
   boardEl.innerHTML = "";
   boardEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
   boardEl.style.gridTemplateRows = `repeat(${size}, 1fr)`;

   const total = size * size;
   for (let i = 0; i < total; i++) {
      const cell = document.createElement("div");
      cell.className = `cells cell${i}`;
      cell.setAttribute("index", i);
      boardEl.appendChild(cell);
   }

   // refresh node list reference
   elements.cells = document.querySelectorAll(".cells");
}

(function init() {
   elements.startBtn.addEventListener("click", initializeGame);
})();

// Games
function initializeGame() {
   // read selected board size (3, 4 or 5)
   const selected = parseInt(elements.levelSelect?.value || "3", 10);
   boardSize = [3, 4, 5].includes(selected) ? selected : 3;

   renderBoard(boardSize);
   rd.players = createPlayers();
   rd.currentPlayer = rd.players[0];
   updateTurnUI();

   game.setBoard(Array(boardSize * boardSize).fill(""));

   elements.cells.forEach((cell) => {
      cell.classList.remove("x", "o", "winning-cell");
      cell.addEventListener("click", handleSlotClick);
   });

   elements.startBtn.classList.add("hidden");
   elements.restartBtn.classList.remove("hidden");
   elements.resetBtn.classList.remove("hidden");
   
   elements.modalClose.onclick = () => {
      elements.modal.classList.remove("show");
      resetBoard();
      initializeGame();
   };

   elements.restartBtn.onclick = () => {
      resetBoard();
      initializeGame();
   };

   elements.resetBtn.onclick = () => {
      location.reload(); // Simple way to reset everything for now
   };
}

function updateTurnUI() {
   elements.playerCard.classList.toggle("active", rd.currentPlayer === rd.players[0]);
   elements.computerCard.classList.toggle("active", rd.currentPlayer === rd.players[1]);
   elements.turnLabel.textContent = `${rd.currentPlayer.name}'s Turn`;
}

//Player functions
function handleSlotClick(event) {
   const target = event.target;
   const index = Number(target.getAttribute("index"));

   if (!game.isSlotEmpty(index) || rd.currentPlayer.name === "AI") return;

   setMove(index, rd.currentPlayer);
}

function setMove(idx, player) {
   const currentEl = elements.cells[idx];
   game.setSlot(idx, player);
   currentEl.classList.add(player.value);

   const result = checkWinner(game.getBoard(), player.value);
   if (result.isWin) {
      highlightWinner(result.pattern);
      showResult(`${player.name} Wins!`);
      updateScore(player);
      return;
   } else if (checkTie(game.getBoard())) {
      showResult("It's a Tie!");
      return;
   }

   game.switchPlayer(rd.players, player);
   updateTurnUI();

   if (rd.currentPlayer.name === "AI") {
      setTimeout(() => {
         const AImove = getBestMove(game.getBoard());
         if (AImove !== undefined && AImove !== null) setMove(AImove, rd.currentPlayer);
      }, 400); // Slight delay for realistic feel
   }
}

function highlightWinner(pattern) {
   pattern.forEach(idx => elements.cells[idx].classList.add("winning-cell"));
}

function showResult(message) {
   elements.modalMessage.textContent = message;
   setTimeout(() => elements.modal.classList.add("show"), 500);
}

//Game Algorithm
function getAvailSlots(board) {
   return board
      .map((v, i) => ({ v, i }))
      .filter((s) => s.v === "")
      .map((s) => s.i);
}

function makeMove(board, index, isMaximizing) {
   const newBoard = [...board];
   newBoard[index] = isMaximizing ? "o" : "x";
   return newBoard;
}

function evaluateBoard(board, depth) {
   const winO = checkWinner(board, "o");
   if (winO.isWin) return 100 - depth;
   const winX = checkWinner(board, "x");
   if (winX.isWin) return depth - 100;
   return 0;
}

function minimax(board, depth, isMaximizing, alpha = -Infinity, beta = Infinity) {
   const score = evaluateBoard(board, depth);
   if (score !== 0) return score;
   if (getAvailSlots(board).length === 0) return 0;

   if (isMaximizing) {
      let bestScore = -Infinity;
      for (const spot of getAvailSlots(board)) {
         const newBoard = makeMove(board, spot, true);
         const currentScore = minimax(newBoard, depth + 1, false, alpha, beta);
         bestScore = Math.max(bestScore, currentScore);
         alpha = Math.max(alpha, currentScore);
         if (beta <= alpha) break;
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (const spot of getAvailSlots(board)) {
         const newBoard = makeMove(board, spot, false);
         const currentScore = minimax(newBoard, depth + 1, true, alpha, beta);
         bestScore = Math.min(bestScore, currentScore);
         beta = Math.min(beta, currentScore);
         if (beta <= alpha) break;
      }
      return bestScore;
    }
}

// Opening book for 3x3 only
function getOpeningMove(board) {
   const size = Math.sqrt(board.length);
   if (size !== 3) return null;

   const moveCount = board.filter(cell => cell !== "").length;
   
   // First move (AI goes first) - vary between center and corners
   if (moveCount === 0) {
      const options = [4, 0, 2, 6, 8]; // Center + all corners
      return options[Math.floor(Math.random() * options.length)];
   }
   
   // Second move (player went first)
   if (moveCount === 1) {
      // If player took center, take a random corner
      if (board[4] === "x") {
         const corners = [0, 2, 6, 8];
         return corners[Math.floor(Math.random() * corners.length)];
      }
      
      // If player took corner, always take center
      if (board[0] === "x" || board[2] === "x" || board[6] === "x" || board[8] === "x") {
         return 4;
      }
      
      // If player took edge, take center
      return 4;
   }
   
   // After opening, use minimax
   return null;
}

// For larger boards use quick heuristics (immediate win / block) + random fallback
function findImmediateMove(board, playerValue) {
   for (const spot of getAvailSlots(board)) {
      const copy = [...board];
      copy[spot] = playerValue;
      if (checkWinner(copy, playerValue).isWin) return spot;
   }
   return null;
}

function getBestMove(board) {
   const size = Math.sqrt(board.length);

   // 3x3: strong AI using minimax + opening book
   if (size === 3) {
      const openingMove = getOpeningMove(board);
      if (openingMove !== null) return openingMove;

      let bestScore = -Infinity;
      let bestMoves = [];
      let depth = 0;

      const slots = getAvailSlots(board);
      const shuffledSlots = slots.sort(() => Math.random() - 0.5);

      for (const spot of shuffledSlots) {
         const newBoard = makeMove(board, spot, true);
         const score = minimax(newBoard, depth, false);

         if (score > bestScore) {
            bestScore = score;
            bestMoves = [spot];
         } else if (score === bestScore) {
            bestMoves.push(spot);
         }
      }

      const randomIndex = Math.floor(Math.random() * bestMoves.length);
      return bestMoves[randomIndex];
   }

   // Larger boards: try immediate win, block opponent, prefer center-ish, else random
   const winMove = findImmediateMove(board, "o");
   if (winMove !== null) return winMove;
   const blockMove = findImmediateMove(board, "x");
   if (blockMove !== null) return blockMove;

   const centerIndex = Math.floor(board.length / 2);
   if (board[centerIndex] === "") return centerIndex;

   const available = getAvailSlots(board);
   return available[Math.floor(Math.random() * available.length)];
}

export { elements, game };

//Player Creation
function createPlayers(playerName = "Human", opponentName = "AI") {
   const createPlayer = (name, value) => ({
      name,
      value,
      score: 0,
      toString() {
         return `${this.name} : ${this.value}`;
      },
   });

   return [createPlayer(playerName, "x"), createPlayer(opponentName, "o")];
}