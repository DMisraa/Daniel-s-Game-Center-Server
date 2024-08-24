import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

import { Connect4 } from "./connect4/game.js";
import { TicTacToe } from "./ticTacToe/game.js";

const app = express();
const port = 4000;
const game = new Connect4();
const ticTacToe_Game = new TicTacToe();


app.use(cors());
app.use(bodyParser.json());

export let games = {
  yellowPlayer: 0,
  redPlayer: 0,
  draw: 0,
};

app.get("/connectFour/gameboard", async (req, res) => {
  try {
    const document = await game.getAllData();
    console.log(document, 'database Document')

    if (document) {
      game.board = document.board;
      game.currentPlayer = document.currentPlayer;
      game.winner = document.winner;
      game.hasDraw = document.hasDraw;
      game.playerNames = document.playerNames;
      games = document.allTimeWinners;
    } else {
      return null
    }


    res.json({
      board: game.board,
      currentPlayer: game.currentPlayer,
      winner: game.winner,
      hasDraw: game.hasDraw,
      allTimeWinners: games,
      playerNames: game.playerNames
    });
  } catch (error) {
    console.error("Error handling request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/connectFour/move", async (req, res) => {
  const { column } = req.body;

  const success = game.makeMove(column);

  if (!success) {
    return res.status(400).json({ error: "Invalid move" });
  }

  await game.dataBase();

  const winner = game.getWinner();
  
  const isDraw = game.isDraw();
  if (winner === "yellow") {
    games.yellowPlayer++;
    console.log('yellow start over')
    await game.startOver()
  } else if (winner === "red") {
    games.redPlayer++;
    console.log('red start over')
    await game.startOver();
  } else if (isDraw === true) {
    games.draw++;
    await game.startOver()
    console.log('draw start over')
  } 

  res.json({
    board: game.getBoard(),
    currentPlayer: game.currentPlayer,
    winner: game.getWinner(),
    hasDraw: game.isDraw(),
    allTimeWinners: games,
  });
});

app.put("/connectFour/player", (req, res) => {
  const playerNames = req.body;
  console.log(playerNames)

  game.playerDatabase(playerNames);

  res.json( playerNames );
});

// Tic _ Tac _ Toe

app.get('/ticTacToe/gameData', async (req, res) => {
  let data
  const document = await ticTacToe_Game.getAllData()

  

  if (document) {
     data = {
      allTimeScore: document.allTimeScore,
      board: document.board,
      playerNames: document.playerNames
    }
    console.log(document.board, 'database board')
  }
  console.log(data, 'Tic Tac Toe gameData ticTacToe/gameData')

  res.json(data)
})

app.put("/ticTacToe/move", async (req, res) => {
   const gameBoard = req.body
   console.log(gameBoard)
   
   await ticTacToe_Game.ticTacToeDataBase(gameBoard)

   res.json( gameBoard )
})

app.put("/ticTacToe/player", async (req, res) => {
   const {playerName, symbol} = req.body
   console.log(playerName, symbol)

   ticTacToe_Game.updatePlayerNames(playerName, symbol)

   res.json()
})

app.listen(port, () => {
  console.log(`Connect 4 server running on port ${port}`);
});
