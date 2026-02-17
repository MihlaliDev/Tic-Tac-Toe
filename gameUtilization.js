//Game Functions
import {game, elements} from "./script.js";

function generateWinPatterns(size) {
   const patterns = [];

   // rows
   for (let r = 0; r < size; r++) {
      const row = [];
      for (let c = 0; c < size; c++) row.push(r * size + c);
      patterns.push(row);
   }

   // columns
   for (let c = 0; c < size; c++) {
      const col = [];
      for (let r = 0; r < size; r++) col.push(r * size + c);
      patterns.push(col);
   }

   // main diagonal
   const mainDiag = [];
   for (let i = 0; i < size; i++) mainDiag.push(i * (size + 1));
   patterns.push(mainDiag);

   // anti diagonal
   const antiDiag = [];
   for (let i = 0; i < size; i++) antiDiag.push((i + 1) * (size - 1));
   patterns.push(antiDiag);

   return patterns;
}

function checkWinner(board, player) {
   const size = Math.sqrt(board.length);
   const patterns = generateWinPatterns(size);

   for (const pattern of patterns) {
      const isWin = pattern.every((idx) => board[idx] === player);
      if (isWin) return { isWin: true, pattern };
   }
   
   return { isWin: false };
}

function checkTie(board) {
   return board.every((v) => v !== "");
}

function resetBoard() {
   game.setBoard(Array(elements.cells.length).fill(""));
   elements.cells.forEach((slot) => {
      slot.classList.remove("x", "o", "winning-cell");
   });
}

function updateScore(player) {
   const playerScore = document.querySelector("#player .score");
   const computerScore = document.querySelector("#computer .score");

   if (player.name === "AI") {
      computerScore.textContent = ++player.score;
   } else {
      playerScore.textContent = ++player.score;
   }
}

export { checkWinner, checkTie, resetBoard, updateScore };