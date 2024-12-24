import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from 'dotenv';

import { createServer } from "http";
import { footer } from "./services/footer.js";
import { initializeWebSocket } from "./services/socket.js";
import {
  authenticatePlayer,
  authenticateTicTacToePlayer,
} from "./services/authentication.js";

import {
  getData,
  playerMove,
  editPlayerName,
  gameInvite,
  newGameChallenge,
  getOnlineGameData,
  onlineGame_PlayerMove,
  onlineGame_startOver,
} from "./services/connectFourRoutes.js";

import {
  ticTacToe_getData,
  ticTacToe_playerMove,
  ticTacToe_editPlayerName,
  ticTacToe_gameInvite,
  onlineGame_getData,
  ticTacToe_newGameChallenge,
  startOver,
  sendMail,
} from "./services/ticTacToeRoutes.js";

dotenv.config();

const app = express();
const port = 4000
const httpServer = createServer(app)

console.log("Process Env BASE_URL:", process.env.BASE_URL )

app.use(cors( {
  origin: '*', 
  methods: ["GET", "POST", 'PUT', 'PATCH'], 
  credentials: true 
},)
);

app.use(bodyParser.json());

// Web Socket

initializeWebSocket(httpServer);

// connectFour

app.get("/connectFour/gameboard", getData);

app.put("/connectFour/move", playerMove);

app.put("/connectFour/player", editPlayerName);

// online game

app.post("/connectFour/game", gameInvite);

app.patch("/connectFour/game/:gameId", newGameChallenge);

app.get("/connectFour/:gameId", getOnlineGameData);

app.put("/connectFour/:gameId/move", authenticatePlayer, onlineGame_PlayerMove);

app.patch("/connectFour/:gameId/startOver", onlineGame_startOver);

// Tic _ Tac _ Toe

app.get("/ticTacToe/gameData", ticTacToe_getData);

app.put("/ticTacToe/move", ticTacToe_playerMove);

app.put("/ticTacToe/player", ticTacToe_editPlayerName);

// online game

app.post("/ticTacToe/game", ticTacToe_gameInvite);

app.get("/ticTacToe/:gameId", onlineGame_getData);

app.patch(
  "/ticTacToe/:gameId/move",
  authenticateTicTacToePlayer,
  onlineGame_getData
);

app.patch("/ticTacToe/game/:gameId", ticTacToe_newGameChallenge);

app.patch("/ticTacToe/:gameId/startOver", startOver);

app.post("/ticTacToe/sendMail", sendMail);

app.post("/footerContact", footer);

app.listen(process.env.PORT || port, () => {
  console.log(`Connect 4 server running on port ${port}`);
});
