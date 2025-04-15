import { ObjectId } from "mongodb";
import { Connect4 } from "../connect4/game.js";
import { Connect4_Online } from "../connect4/onlineGame.js";
import { generateTokenByLink } from "./authentication.js";
import { connectToGameIdDatabase } from "../database.js";

const game = new Connect4();
const game_Online = new Connect4_Online();

export let games = {
  yellowPlayer: 0,
  redPlayer: 0,
  draw: 0,
};

export async function getData(req, res) {
 
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
  }

  export async function playerMove(req, res) {
    
    const { column } = req.body;
    const success = game.makeMove(column);
  
    if (!success) {
      return res.status(400).json({ error: "Invalid move" });
    }
  
    await game.dataBase();
    const winner = game.getWinner();
    const isDraw = game.isDraw();
  
    if (winner === "blue") {
      games.yellowPlayer++;
      await game.startOver();
    } else if (winner === "red") {
      games.redPlayer++;
      await game.startOver();
    } else if (isDraw === true) {
      games.draw++;
      await game.startOver();
    }

    game.startInactivityTimer()
  
    res.json({
      board: game.getBoard(),
      currentPlayer: game.currentPlayer,
      winner: game.getWinner(),
      hasDraw: game.isDraw(),
      allTimeWinners: games,
    });
  }

  export async function editPlayerName(req, res) {
    const playerNames = req.body;
    game.playerDatabase(playerNames);
    res.json(playerNames);
  }

  export async function startOver(req, res) {
    let timeOut
    await game.startOver(timeOut)

    res.json()
  }

  export async function gameInvite(req, res) {
    const { userEmail, rivalUserEmail, userName, rivalName, whatsappInvite } = req.body;
    
    console.log(userEmail, rivalUserEmail, userName, rivalName, whatsappInvite)
    
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
      html: `<p>Hi ${rivalName},</p> <p>${userName} has invited you to a game. Click the link below to join the match:</p><p><a href="${invitedPlayerLink}">Join the Game</a></p><p>Good luck!</p>`,
    };
  
  
  
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
     if (whatsappInvite) {
      res.json({ gameCreatorLink, invitedPlayerLink })
     } else {
      try {
      const transporter = await game_Online.sendMail()
      await transporter.sendMail(msg);
      res.status(200).json({ gameCreatorLink });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ error: "Failed to send invitation." });
    }
     }
  }

  export async function newGameChallenge(req, res) {
    const playerId = req.body;
    const gameId = req.params.gameId;
    await game_Online.newGameChallenge(playerId, gameId);
    res.json();
  }

  export async function getOnlineGameData(req, res) {
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
  }

  export async function onlineGame_PlayerMove(req, res) {
    const gameId = req.params.gameId;
    const { column } = req.body;
    const success = game_Online.makeMove(column, gameId);
  
    if (!success) {
      return res.status(400).json({ error: "Invalid move" });
    }
    res.json();
  }

export async function onlineGame_startOver(req, res) {
    const { gameId, yellowPlayerName, redPlayerName } = req.body
    const success = game_Online.startOver(gameId, yellowPlayerName, redPlayerName)
  
    if (!success) {
      return res.status(400).json({ error: "Error creating a new Match" });
    }
    res.json();
  }