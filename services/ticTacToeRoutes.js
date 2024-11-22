import { ObjectId } from "mongodb";

import { TicTacToe } from "../ticTacToe/game.js";
import { TicTacToe_Online } from "../ticTacToe/onlineGame.js";
import { Connect4_Online } from "../connect4/onlineGame.js";


const ticTacToe_Game = new TicTacToe();
const ticTacToe_Online_Game = new TicTacToe_Online()
const game_Online = new Connect4_Online();


export const ticTacToe_getData = async (req, res) => {
    console.log("CORS Allowed Origin:", process.env.BASE_URL);
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
  }

  export const ticTacToe_playerMove = async (req, res) => {
    const gameBoard = req.body;
    await ticTacToe_Game.ticTacToeDataBase(gameBoard);
  
    res.json();
  }

  export const ticTacToe_editPlayerName = async (req, res) => {
    const { playerName, symbol } = req.body;
    ticTacToe_Game.updatePlayerNames(playerName, symbol);
  
    res.json();
  }

  export const ticTacToe_gameInvite = async (req, res) => {
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
  }

  export const onlineGame_getData = async (req, res) => {
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
  }

  export const onlineGame_PlayerMove = async (req, res) => {
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
  }

  export const ticTacToe_newGameChallenge = async (req, res) => {
    const playerId = req.body;
    const gameId = req.params.gameId;
    await ticTacToe_Online_Game.newGameChallenge(playerId, gameId);
  
    res.json();
  }

  export const startOver = async (req, res) => {
    const { gameId, players } = req.body
    const success = ticTacToe_Online_Game.startOver(gameId, players)
  
    if (!success) {
      return res.status(400).json({ error: "Error creating a new Match" });
    }
    res.json();
  }

  export const sendMail = async (req, res) => {
    const {playerNames, emailAdress, gameLinksWithTokens} = req.body
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
  }