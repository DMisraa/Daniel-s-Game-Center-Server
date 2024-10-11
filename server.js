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
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const app = express();
dotenv.config();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.BASE_URL, 
    methods: ["GET", "POST", 'PUT', 'PATCH'], 
    credentials: true // Allow cookies or authentication headers if necessary
  },
})
const port = 4000;
const socketPort = 4001
const game = new Connect4();
const game_Online = new Connect4_Online();
const ticTacToe_Game = new TicTacToe();
const ticTacToe_Online_Game = new TicTacToe_Online()
const { verify } = pkg;

app.use(cors());
app.use(bodyParser.json());


export let games = {
  yellowPlayer: 0,
  redPlayer: 0,
  draw: 0,
};

async function socket_authenticatePlayer(token, gameId, gameType) {
  try {
    const decoded = verify(token, process.env.JWT_SECRET);
    let game;

    if (gameType === 'connectFour') {
      game = await game_Online.getGameDataById(gameId);
    } else if (gameType === 'ticTacToe') {
      game = await ticTacToe_Online_Game.getGameDataById(gameId);
    }

    if (!game || !Object.values(game.playersId).includes(decoded.playedId)) {
      return { error: "Not authorized to play this game" };
    }

    if (game.currentPlayer !== decoded.playedId) {
      return { error: "It's not your turn" };
    }

    return { success: true, decoded };

  } catch (error) {
    return { error: "Invalid token" };
  }
}

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

// Web Socket TicTacToe

// const __dirname = dirname(fileURLToPath(import.meta.url));

// app.get('/', (req, res) => {
//   res.sendFile(join(__dirname, 'index.html'));
// });

io.on('connection', (socket) => {
  console.log("A client connected:", socket.id);

  socket.on("joinRoom", ({gameId}) => {
    socket.join(gameId);
    console.log(`User joined game: ${gameId}`);
  });

 socket.on("initial_GET", async ({gameId}) => {
    const gameData = await ticTacToe_Online_Game.getAllData(gameId);
    console.log('Socket GET RUNNING')
    console.log("Broadcasting initial Page to room:", gameId, gameData);
    io.to(gameId).emit('initialPageLoad', gameData)
  })

  socket.on("make-ticTacToe-move", async ({ token, gameId, board, playerNames }) => {
    console.log(token, gameId, board, playerNames, 'data received from client side');
    
    const authResult = await socket_authenticatePlayer(token, gameId, 'ticTacToe');

    if (authResult.error) {
      return socket.emit("unauthorized", { message: authResult.error });
    }

    const gameData = await ticTacToe_Online_Game.makeMove(board, gameId, playerNames);
    console.log("Broadcasting updated game to room:", gameId, gameData);
    io.to(gameId).emit("initialPageLoad", gameData); // Broadcast to all users in the room
  });

  socket.on('startOver_Req', async ({playerId, gameId}) => {
    const playerChallenged = await ticTacToe_Online_Game.newGameChallenge(playerId, gameId);
    console.log('startOver_Req gameData:', playerChallenged )
    io.to(gameId).emit('initialPageLoad', playerChallenged)
  })

  socket.on('startOver', async ({gameId, players}) => {
    await ticTacToe_Online_Game.startOver(gameId, players)
    const gameData = await ticTacToe_Online_Game.getAllData(gameId)
    console.log('broadcasting startOver with:', gameData)
    io.to(gameId).emit('initialPageLoad', gameData)
  })

  // ConnectFour

  socket.on("connectFour_Initial_GET", async ({gameId}) => {
    const gameData = await game_Online.getAllData(gameId);
    console.log('broadcasting startOver with:', gameData)
    io.to(gameId).emit('connectFour_Initial', gameData)
  })

  socket.on("ConnectFourMove", async ({ column, gameId, token }) => {
    console.log(token, gameId, column, 'data received from client side');
    
    const authResult = await socket_authenticatePlayer(token, gameId, 'connectFour');

    if (authResult.error) {
      return socket.emit("unauthorized", { message: authResult.error });
    }

    const gameData = await game_Online.makeMove(column, gameId);
    console.log("Broadcasting updated game to room:", gameId, gameData);
    io.to(gameId).emit("connectFour_Initial", gameData); // Broadcast to all users in the room
  });

  socket.on('ConnectFour_startOver_Req', async ({ playerId, gameId }) => {
    const playerChallenged = await game_Online.newGameChallenge(playerId, gameId);
    console.log('startOver_Req gameData:', playerChallenged )
    io.to(gameId).emit('connectFour_Initial', playerChallenged)
  })

  socket.on('ConnectFour_startOver', async ({ gameId, yellowPlayerName, redPlayerName }) => {
    const gameData = game_Online.startOver(gameId, yellowPlayerName, redPlayerName)
    console.log('broadcasting startOver with:', gameData)
    io.to(gameId).emit('connectFour_Initial', gameData)
  })

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
  });
});

// Web Socket ConnectFour

// socket.emit("connectFour_Initial_GET", { gameId });

// socket.io('connectFour_Initial', (data) => {



server.listen(socketPort, () => {
  console.log(`Real-Time server ${socketPort}`);
});

// connectFour

app.get("/connectFour/gameboard", async (req, res) => {
  try {
    const document = await game.getAllData();

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
    await game.startOver();
  } else if (winner === "red") {
    games.redPlayer++;
    await game.startOver();
  } else if (isDraw === true) {
    games.draw++;
    await game.startOver();
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
  game.playerDatabase(playerNames);

  res.json(playerNames);
});

app.post("/connectFour/game", async (req, res) => {
  const { userEmail, rivalUserEmail, userName, rivalName } = req.body;
  const gameId = new ObjectId();
  const gameIdStringfy = gameId.toString();

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
  const playerId = req.body;
  const gameId = req.params.gameId;
  await game_Online.newGameChallenge(playerId, gameId);
  res.json();
});

app.get("/connectFour/:gameId", async (req, res) => {
  const gameId = req.params.gameId;
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
    gameLinksWithTokens = document.gameLinksWithTokens
    
    if (document.board) {
      board = document.board;
      currentPlayer = document.currentPlayer;
      winner = document.winner;
      gameTurns = document.gameTurns;
      allTimeWinners = document.allTimeWinners;
      hasDraw = document.hasDraw;
      playerChallenged = document.playerChallenged;
    // } else {
    //   const msg = {
    //     from: emailAdress.InvitedPlayer,
    //     to: emailAdress.invitingPlayer,
    //     subject: `${playerNames.redPlayer} has accepted challenge!`,
    //     text: `Hi ${playerNames.yellowPlayer},\n\n${playerNames.redPlayer} has accepted your challenge. Click the link below to join the match:\n\n${gameLinksWithTokens.invitingPlayer}\n\nGood luck!`,
    //     html: `<p>Hi ${playerNames.yellowPlayer},</p> <p>${playerNames.redPlayer} has invited you to a game. Click the link below to join the match:</p><p><a href="${gameLinksWithTokens.invitingPlayer}">Join the Game</a></p><p>Good luck!</p>`,
    //   };
  
        // const transporter = await game_Online.sendMail()
        // const success = await transporter.sendMail(msg);
  
        // if (!success) {
        //   return res.status(400).json({ error: "Unable to send gameCreator link to game" });
        // }
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
 
});

app.put("/connectFour/:gameId/move", authenticatePlayer, async (req, res) => {
  const gameId = req.params.gameId;
  const { column } = req.body;
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
    }
  }

  res.json(data);
});

app.put("/ticTacToe/move", async (req, res) => {
  const gameBoard = req.body;
  await ticTacToe_Game.ticTacToeDataBase(gameBoard);

  res.json();
});

app.put("/ticTacToe/player", async (req, res) => {
  const { playerName, symbol } = req.body;
  ticTacToe_Game.updatePlayerNames(playerName, symbol);

  res.json();
});

// online game

app.post("/ticTacToe/game", async (req, res) => {
  const { userEmail, rivalUserEmail, userName, rivalName } = req.body;
  const gameId = new ObjectId();
  const gameIdStringfy = gameId.toString()

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
    const transporter = await game_Online.sendMail()
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
  const gameId = req.params.gameId;
  try {
    const document = await ticTacToe_Online_Game.getAllData(gameId);
    let board = [
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ];
    let playerNames, turns
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
    gameLinksWithTokens = document.gameLinksWithTokens
    if (document.board) {
      board = document.board;
      currentPlayer = document.currentPlayer;
      winner = document.winner;
      allTimeWinners = document.allTimeWinners;
      hasDraw = document.hasDraw;
      playerChallenged = document.playerChallenged;
      turns = document.turns
    } 

    res.json({
      board,
      winner,
      playerNames,
      allTimeWinners,
      hasDraw,
      playerChallenged,
      currentPlayer, 
      gameLinksWithTokens,
      emailAdress,
      turns
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

  if (gameBoard) {
    board = gameBoard
  }
  const gameId = req.params.gameId;
  await ticTacToe_Online_Game.makeMove(board, gameId, playerNames);

  res.json(gameBoard);
});

app.patch("/ticTacToe/game/:gameId", async (req, res) => {
  const playerId = req.body;
  const gameId = req.params.gameId;
  await ticTacToe_Online_Game.newGameChallenge(playerId, gameId);

  res.json();
});

app.patch('/ticTacToe/:gameId/startOver', async (req, res) => {
  const { gameId, players } = req.body
  const success = ticTacToe_Online_Game.startOver(gameId, players)

  if (!success) {
    return res.status(400).json({ error: "Error creating a new Match" });
  }
  res.json();
})

app.post('/ticTacToe/sendMail', async (req,res) => {
  const {playerNames, emailAdress, gameLinksWithTokens} = req.body
  console.log('req.body data:', req.body)
  const msg = {
    from: emailAdress.InvitedPlayer,
    to: emailAdress.invitingPlayer,
    subject: `${playerNames.X} has accepted your challenge!`,
    text: `Hi ${playerNames.O},\n\n${playerNames.X} has accepted your challenge. Click the link below to join the match:\n\n${gameLinksWithTokens.invitingPlayer}\n\nGood luck!`,
    html: `<p>Hi ${playerNames.O},</p> <p>${playerNames.X} accepted your challenge. Click the link below to join the match:</p><p><a href="${gameLinksWithTokens.invitingPlayer}">Join the Game</a></p><p>Good luck!</p>`,
  };

        const transporter = await game_Online.sendMail()
        const success = await transporter.sendMail(msg);
  
        if (!success) {
          return res.status(400).json({ error: "Unable to send gameCreator link to game" });
        }
        res.json()
})

app.listen(port, () => {
  console.log(`Connect 4 server running on port ${port}`);
});
