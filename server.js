import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import pkg from "jsonwebtoken";
import dotenv from "dotenv";
import { ObjectId } from "mongodb";
import { Connect4 } from "./connect4/game.js";
import { TicTacToe } from "./ticTacToe/game.js";
import { Connect4_Online } from "./connect4/onlineGame.js";
import { connectToGameIdDatabase, connectToTicTacToeGameId } from "./database.js";
import { generateTokenByLink } from "./authentication.js";
import { TicTacToe_Online } from "./ticTacToe/onlineGame.js";

const app = express();
const port = 4000;
const game = new Connect4();
const game_Online = new Connect4_Online();
const ticTacToe_Game = new TicTacToe();
const ticTacToe_Online_Game = new TicTacToe_Online()
const { verify } = pkg;

app.use(cors());
app.use(bodyParser.json());
dotenv.config();

export let games = {
  yellowPlayer: 0,
  redPlayer: 0,
  draw: 0,
};

async function authenticatePlayer(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  console.log(token, "token recieved from user");

  if (!token) return res.status(403).json({ error: "No token provided" });

  try {
    console.log("try block working");
    console.log(process.env.JWT_SECRET);
    const decoded = verify(token, process.env.JWT_SECRET);
    console.log(decoded, "decoded, in auth middelware Fn");
    console.log(decoded.playedId, "auth middelware Fn ffffffffff");
    const game = await game_Online.getGameDataById(req.params.gameId);
    console.log(game, "data, auth Fn");


    if (!game || !Object.values(game.playersId).includes(decoded.playedId)) {
      return res
        .status(403)
        .json({ error: "Not authorized to play this game" });
    }

    console.log(game.currentPlayer, "game.currentPlayer ");
    console.log(decoded.playedId, "decoded.playedId");

    if (game.currentPlayer !== decoded.playedId) {
      return res.status(403).json({ error: "It's not this user's turn" });
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

async function authenticateTicTacToePlayer(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  console.log(token, "token recieved from user");

  if (!token) return res.status(403).json({ error: "No token provided" });

  try {
    console.log("try block working");
    console.log(process.env.JWT_SECRET);
    const decoded = verify(token, process.env.JWT_SECRET);
    console.log(decoded, "decoded, in auth middelware Fn");
    console.log(decoded.playedId, "auth middelware Fn ffffffffff");
    const game = await ticTacToe_Online_Game.getGameDataById(req.params.gameId);
    console.log(game, "data, auth Fn");


    if (!game || !Object.values(game.playersId).includes(decoded.playedId)) {
      return res
        .status(403)
        .json({ error: "Not authorized to play this game" });
    }

    console.log(game.currentPlayer, "game.currentPlayer ");
    console.log(decoded.playedId, "decoded.playedId");

    if (game.currentPlayer !== decoded.playedId) {
      return res.status(403).json({ error: "It's not this user's turn" });
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// connectFour

app.get("/connectFour/gameboard", async (req, res) => {
  try {
    const document = await game.getAllData();
    console.log(document, "database Document");

    if (document) {
      game.board = document.board;
      game.currentPlayer = document.currentPlayer;
      game.winner = document.winner;
      game.hasDraw = document.hasDraw;
      game.playerNames = document.playerNames;
      games = document.allTimeWinners;
      game.turns = document.turnLength
    } else {
      return null;
    }

    res.json({
      board: game.board,
      currentPlayer: game.currentPlayer,
      winner: game.winner,
      hasDraw: game.hasDraw,
      allTimeWinners: games,
      playerNames: game.playerNames,
      turnLength: game.turns
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
    console.log("yellow start over");
    await game.startOver();
  } else if (winner === "red") {
    games.redPlayer++;
    console.log("red start over");
    await game.startOver();
  } else if (isDraw === true) {
    games.draw++;
    await game.startOver();
    console.log("draw start over");
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
  console.log(playerNames);

  game.playerDatabase(playerNames);

  res.json(playerNames);
});

app.post("/connectFour/game", async (req, res) => {
  const { userEmail, rivalUserEmail, userName, rivalName } = req.body;
  const gameId = new ObjectId();
  const gameIdStringfy = gameId.toString();
  console.log(gameId, "gameId, invitation sent");
  console.log(gameIdStringfy, "id turned to a string");

  let playersId = {
    userId1: "yellow",
    userId2: "red"
  }
let gameType = 'connectFour'

  const { invitedPlayerLink, gameCreatorLink } = generateTokenByLink(
    playersId.userId2,
    playersId.userId1,
    gameId,
    gameType
  );
  console.log(invitedPlayerLink, "invitedPlayerLink");

  const data = {
    playerNames: {
      yellowPlayer: userName,
      redPlayer: rivalName,
    },
    emailAdress: {
      invitingPlayer: userEmail,
      InvitedPlayer: rivalUserEmail,
    },
    gameLinksWithTokens: {
      invitingPlayer: gameCreatorLink,
      InvitedPlayer: invitedPlayerLink
    },
    allTimeWinners: {
      yellowPlayer: 0,
      redPlayer: 0,
      draw: 0,
    },
    playersId: playersId,
    currentPlayer: "red",
  };

 
  const msg = {
    from: userEmail,
    to: rivalUserEmail,
    subject: `${userName} has challenged you to a game!`,
    text: `Hi ${rivalName},\n\n${userName} has invited you to a game. Click the link below to join the match:\n\n${invitedPlayerLink}\n\nGood luck!`,
    html: `<p>Hi ${rivalName},</p> <p>${userName} has invited you to a game. Click the link below to join the match:</p><p><a href="${invitedPlayerLink}">Join the Game</a></p><p>Good luck!</p> ${gameCreatorLink}`,
  };

  try {
    const transporter = await game_Online.sendMail()
    await transporter.sendMail(msg);
    res.status(200).json({ gameId: gameIdStringfy });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: "Failed to send invitation." });
  }

  try {
    const { gameCenterCollection, client } = await connectToGameIdDatabase();
    await gameCenterCollection.updateOne(
      { _id: gameIdStringfy },
      { $set: data },
      { upsert: true }
    );
    await client.close();
  } catch (error) {
    console.error("Error sending userName data", error);
  }
});

app.patch("/connectFour/game/:gameId", async (req, res) => {
  console.log("patch handling for playerChallenged");
  const playerId = req.body;
  const gameId = req.params.gameId;
  await game_Online.newGameChallenge(playerId, gameId);
  console.log("patch handling completed");
  res.json();
});

app.get("/connectFour/:gameId", async (req, res) => {
  const gameId = req.params.gameId;
  try {
    const document = await game_Online.getAllData(gameId);

    let board = Array.from({ length: 6 }, () => Array(7).fill(null));
    let playerNames 
    let currentPlayer = "red";
    let winner;
    let gameTurns;
    let hasDraw;
    let playerChallenged;
    let emailAdress
    let gameLinksWithTokens
    let allTimeWinners = {
      yellowPlayer: 0,
      redPlayer: 0,
      draw: 0,
    };
    playerNames = document.playerNames;
    emailAdress = document.emailAdress
    console.log(emailAdress, 'get route')
    gameLinksWithTokens = document.gameLinksWithTokens
    console.log(gameLinksWithTokens, 'get route')
    
    if (document.board) {
      console.log(document);
      board = document.board;
      currentPlayer = document.currentPlayer;
      winner = document.winner;
      gameTurns = document.gameTurns;
      allTimeWinners = document.allTimeWinners;
      hasDraw = document.hasDraw;
      playerChallenged = document.playerChallenged;
     console.log(document, 'data recived via get route')
    } else {
      const msg = {
        from: emailAdress.InvitedPlayer,
        to: emailAdress.invitingPlayer,
        subject: `${playerNames.redPlayer} has accepted challenge!`,
        text: `Hi ${playerNames.yellowPlayer},\n\n${playerNames.redPlayer} has accepted your challenge. Click the link below to join the match:\n\n${gameLinksWithTokens.invitingPlayer}\n\nGood luck!`,
        html: `<p>Hi ${playerNames.yellowPlayer},</p> <p>${playerNames.redPlayer} has invited you to a game. Click the link below to join the match:</p><p><a href="${gameLinksWithTokens.invitingPlayer}">Join the Game</a></p><p>Good luck!</p>`,
      };
  
        const transporter = await game_Online.sendMail()
        const success = await transporter.sendMail(msg);
  
        if (!success) {
          return res.status(400).json({ error: "Unable to send gameCreator link to game" });
        }
    }

    res.json({
      board,
      currentPlayer,
      winner,
      playerNames,
      gameTurns,
      allTimeWinners,
      hasDraw,
      playerChallenged,
      gameLinksWithTokens
    });
  } catch (error) {
    console.error("Error handling request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/connectFour/:gameId/move", authenticatePlayer, async (req, res) => {
  const gameId = req.params.gameId;
  const { column } = req.body;
  console.log(gameId, "gameId, server handling");

  const success = game_Online.makeMove(column, gameId);

  if (!success) {
    return res.status(400).json({ error: "Invalid move" });
  }

  res.json();
});

app.patch('/connectFour/:gameId/startOver', async (req, res) => {
  const { gameId, yellowPlayerName, redPlayerName } = req.body
  const success = game_Online.startOver(gameId, yellowPlayerName, redPlayerName)

  if (!success) {
    return res.status(400).json({ error: "Error creating a new Match" });
  }
  console.log('startOver succeded')
  res.json();
})

// Tic _ Tac _ Toe

app.get("/ticTacToe/gameData", async (req, res) => {
  let data;
  const document = await ticTacToe_Game.getAllData();

  if (document) {
    data = {
      allTimeScore: document.allTimeScore,
      gameBoard: document.gameBoard,
      playerNames: document.playerNames,
    };
    console.log(document.board, "database board");
  }
  console.log(data, "Tic Tac Toe gameData ticTacToe/gameData");

  res.json(data);
});

app.put("/ticTacToe/move", async (req, res) => {
  const gameBoard = req.body;
  console.log(gameBoard);

  await ticTacToe_Game.ticTacToeDataBase(gameBoard);

  res.json();
});

app.put("/ticTacToe/player", async (req, res) => {
  const { playerName, symbol } = req.body;
  console.log(playerName, symbol);

  ticTacToe_Game.updatePlayerNames(playerName, symbol);

  res.json();
});

// online game

app.post("/ticTacToe/game", async (req, res) => {
  const { userEmail, rivalUserEmail, userName, rivalName } = req.body;
  const gameId = new ObjectId();
  const gameIdStringfy = gameId.toString();
  console.log(gameId, "gameId, invitation sent");
  console.log(gameIdStringfy, "id turned to a string");

  let playersId = {
    userId1: "O",
    userId2: "X"
  }
  let gameType = 'ticTacToe'

  const { invitedPlayerLink, gameCreatorLink } = generateTokenByLink(
    playersId.userId2,
    playersId.userId1,
    gameId,
    gameType
  );
  console.log(invitedPlayerLink, "invitedPlayerLink");

  const data = {
    playerNames: {
      O: userName,
      X: rivalName,
    },
    emailAdress: {
      invitingPlayer: userEmail,
      InvitedPlayer: rivalUserEmail,
    },
    gameLinksWithTokens: {
      invitingPlayer: gameCreatorLink,
      InvitedPlayer: invitedPlayerLink
    },
    allTimeWinners: {
      O: 0,
      X: 0,
      draw: 0,
    },
    playersId: playersId,
    currentPlayer: "X",
    winner: null,
    hasDraw: false,
    turns: 0
  };

 
  const msg = {
    from: userEmail,
    to: rivalUserEmail,
    subject: `${userName} has challenged you to a game!`,
    text: `Hi ${rivalName},\n\n${userName} has invited you to a game. Click the link below to join the match:\n\n${invitedPlayerLink}\n\nGood luck!`,
    html: `<p>Hi ${rivalName},</p> <p>${userName} has invited you to a game. Click the link below to join the match:</p><p><a href="${invitedPlayerLink}">Join the Game</a></p><p>Good luck!</p> ${gameCreatorLink}`,
  };

  try {
    const transporter = await ticTacToe_Online_Game.sendMail()
    await transporter.sendMail(msg);
    res.status(200).json({ gameId: gameIdStringfy });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: "Failed to send invitation." });
  }

  try {
    const { gameCenterCollection, client } = await connectToTicTacToeGameId();
    await gameCenterCollection.updateOne(
      { _id: gameIdStringfy },
      { $set: data },
      { upsert: true }
    );
    await client.close();
  } catch (error) {
    console.error("Error sending userName data", error);
  }
  
});

app.get("/ticTacToe/:gameId", async (req, res) => {
  console.log('gat route online tic tac toe running')
  const gameId = req.params.gameId;
  try {
    const document = await ticTacToe_Online_Game.getAllData(gameId);
    console.log(document, 'data recieved get route')
    let board = [
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ];
    let playerNames 
    let currentPlayer = "X";
    let winner;
    let hasDraw;
    let playerChallenged;
    let emailAdress
    let gameLinksWithTokens
    let allTimeWinners = {
      O: 0,
      redPlayer: 0,
      X: 0,
    };
    playerNames = document.playerNames;
    emailAdress = document.emailAdress
    console.log(emailAdress, 'get route')
    gameLinksWithTokens = document.gameLinksWithTokens
    console.log(gameLinksWithTokens, 'get route')
    console.log(playerNames, 'pkayer names after update')
    
    if (document.board) {
      console.log(document);
      board = document.board;
      currentPlayer = document.currentPlayer;
      winner = document.winner;
      allTimeWinners = document.allTimeWinners;
      hasDraw = document.hasDraw;
      playerChallenged = document.playerChallenged;
     console.log(document, 'data recived via get route')
    } else {
      const msg = {
        from: emailAdress.InvitedPlayer,
        to: emailAdress.invitingPlayer,
        subject: `${playerNames.X} has accepted challenge!`,
        text: `Hi ${playerNames.O},\n\n${playerNames.X} has accepted your challenge. Click the link below to join the match:\n\n${gameLinksWithTokens.O}\n\nGood luck!`,
        html: `<p>Hi ${playerNames.O},</p> <p>${playerNames.X} has invited you to a game. Click the link below to join the match:</p><p><a href="${gameLinksWithTokens.O}">Join the Game</a></p><p>Good luck!</p>`,
      };
  
        const transporter = await game_Online.sendMail()
        const success = await transporter.sendMail(msg);
  
        if (!success) {
          return res.status(400).json({ error: "Unable to send gameCreator link to game" });
        }
    }

    res.json({
      board,
      winner,
      playerNames,
      allTimeWinners,
      hasDraw,
      playerChallenged,
      currentPlayer, 
      gameLinksWithTokens
    });
  } catch (error) {
    console.error("Error handling request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.patch("/ticTacToe/:gameId/move", authenticateTicTacToePlayer, async (req, res) => {
  const { gameBoard, playerNames } = req.body;
  let board = [
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ];

  console.log(gameBoard, 'gameBoard patch route')
  

  if (gameBoard) {
    board = gameBoard
  }
  const gameId = req.params.gameId;

  console.log(board, 'gameBoard patch route')


  await ticTacToe_Online_Game.makeMove(board, gameId, playerNames);

  res.json(gameBoard);
});

app.patch("/ticTacToe/game/:gameId", async (req, res) => {
  console.log("patch handling for playerChallenged");
  const playerId = req.body;
  const gameId = req.params.gameId;
  await ticTacToe_Online_Game.newGameChallenge(playerId, gameId);
  console.log("patch handling completed");
  res.json();
});

app.patch('/ticTacToe/:gameId/startOver', async (req, res) => {
  const { gameId, players } = req.body
  const success = ticTacToe_Online_Game.startOver(gameId, players)

  if (!success) {
    return res.status(400).json({ error: "Error creating a new Match" });
  }
  console.log('startOver succeded')
  res.json();
})

app.listen(port, () => {
  console.log(`Connect 4 server running on port ${port}`);
});
