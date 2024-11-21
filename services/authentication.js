import pkg from 'jsonwebtoken';

import { Connect4_Online } from "../connect4/onlineGame.js";
import { TicTacToe_Online } from "../ticTacToe/onlineGame.js";

const { sign } = pkg;
const { verify } = pkg;
const game_Online = new Connect4_Online();
const ticTacToe_Online_Game = new TicTacToe_Online()

export function generateTokenByLink(player1Id, player2Id, gameId, gameType) {
    const secretKey = "Daniels_Game_Center"
  const player1Token = sign(
    { playedId: player1Id, gameId, role: "player1" },
    secretKey
  );
  const player2Token = sign(
    { playedId: player2Id, gameId, role: "player2" },
    secretKey
  );
process.en
  
  const invitedPlayerLink = `${process.env.BASE_URL}/${gameType}/${gameId}/?token=${player1Token}`
  const gameCreatorLink = `${process.env.BASE_URL}/${gameType}/${gameId}/?token=${player2Token}`

  return { invitedPlayerLink, gameCreatorLink };
}

export async function socket_authenticatePlayer(token, gameId, gameType) {
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

export async function authenticatePlayer(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(403).json({ error: "No token provided" });

  try {
    const decoded = verify(token, process.env.JWT_SECRET);
    const game = await game_Online.getGameDataById(req.params.gameId);
  
    if (!game || !Object.values(game.playersId).includes(decoded.playedId)) {
      return res
        .status(403)
        .json({ error: "Not authorized to play this game" });
    }

    if (game.currentPlayer !== decoded.playedId) {
      return res.status(403).json({ error: "It's not this user's turn" });
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export async function authenticateTicTacToePlayer(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(403).json({ error: "No token provided" });

  try {
    const decoded = verify(token, process.env.JWT_SECRET);
    const game = await ticTacToe_Online_Game.getGameDataById(req.params.gameId);

    if (!game || !Object.values(game.playersId).includes(decoded.playedId)) {
      return res
        .status(403)
        .json({ error: "Not authorized to play this game" });
    }

    if (game.currentPlayer !== decoded.playedId) {
      return res.status(403).json({ error: "It's not this user's turn" });
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
}