import express from "express";
import dotenv from 'dotenv';

import { Connect4_Online } from "../connect4/onlineGame.js";
import { TicTacToe_Online } from "../ticTacToe/onlineGame.js";
import { socket_authenticatePlayer } from "./authentication.js";

dotenv.config();

const game_Online = new Connect4_Online();
const ticTacToe_Online_Game = new TicTacToe_Online()
const app = express();

// const httpserver = createServer(app);
// const socketPort = 4000

export function initializeWebSocket(io) {

io.on('connection', (socket) => {
  console.log('New WebSocket connection:', socket.id);
    socket.on("joinRoom", ({gameId}) => {
      socket.join(gameId);
    });
  
   socket.on("initial_GET", async ({gameId}) => {
      const gameData = await ticTacToe_Online_Game.getAllData(gameId);
      io.to(gameId).emit('initialPageLoad', gameData)
    })
  
    socket.on("make-ticTacToe-move", async ({ token, gameId, board, playerNames }) => {
      const authResult = await socket_authenticatePlayer(token, gameId, 'ticTacToe');
  
      if (authResult.error) {
        return socket.emit("unauthorized", { message: authResult.error });
      }
  
      const gameData = await ticTacToe_Online_Game.makeMove(board, gameId, playerNames);
      io.to(gameId).emit("initialPageLoad", gameData); 
    });
  
    socket.on('startOver_Req', async ({playerId, gameId}) => {
      const playerChallenged = await ticTacToe_Online_Game.newGameChallenge(playerId, gameId);
      io.to(gameId).emit('initialPageLoad', playerChallenged)
    })
  
    socket.on('startOver', async ({gameId, players}) => {
      await ticTacToe_Online_Game.startOver(gameId, players)
      const gameData = await ticTacToe_Online_Game.getAllData(gameId)
      io.to(gameId).emit('initialPageLoad', gameData)
    })
  
    // ConnectFour
  
    socket.on("connectFour_Initial_GET", async ({gameId}) => {
      const gameData = await game_Online.getAllData(gameId);
      io.to(gameId).emit('connectFour_Initial', gameData)
    })
  
    socket.on("ConnectFourMove", async ({ column, gameId, token }) => {
      const authResult = await socket_authenticatePlayer(token, gameId, 'connectFour');
  
      if (authResult.error) {
        return socket.emit("unauthorized", { message: authResult.error });
      }
  
      const gameData = await game_Online.makeMove(column, gameId);
      io.to(gameId).emit("connectFour_Initial", gameData); // Broadcast to all users in the room
    });
  
    socket.on('ConnectFour_startOver_Req', async ({ playerId, gameId }) => {
      const playerChallenged = await game_Online.newGameChallenge(playerId, gameId);
      io.to(gameId).emit('connectFour_Initial', playerChallenged)
    })
  
    socket.on('ConnectFour_startOver', async ({ gameId, yellowPlayerName, redPlayerName, allTimeWinners}) => {
      const gameData = await game_Online.startOver(gameId, yellowPlayerName, redPlayerName, allTimeWinners)
      io.to(gameId).emit('connectFour_Initial', gameData)
    })
  
    socket.on("disconnect", () => {
      console.log("A user disconnected:", socket.id);
    });
  });
}