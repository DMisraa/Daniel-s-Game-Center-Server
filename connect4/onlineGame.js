import { winningCombinations } from "./WINNING_COMBINATIONS.js";
import { connectToGameIdDatabase } from "../database.js";
import nodemailer from "nodemailer"

let board = Array.from({ length: 6 }, () => Array(7).fill(null));
let currentPlayer = "red";
let winner, data
let playerNames;
let gameTurns = 0;
let allTimeWinners;
let emailAdress;
let hasDraw
let playersId;

export class Connect4_Online {
  async getGameDataById(gameId) {
    try {
      const { gameCenterCollection, client } = await connectToGameIdDatabase();
      const gameData = await gameCenterCollection.findOne({ _id: gameId });
      console.log('gameId fethced', gameId)
      await client.close();
      return gameData;
    } catch (error) {
      console.error("Error fetching game data by ID:", error);
      throw error;
    }
  }
  async makeMove(column, gameId) {
    data = await this.getGameDataById(gameId);
    allTimeWinners = {
        yellowPlayer: 0,
        redPlayer: 0,
        draw: 0,
      };
    playerNames = data.playerNames;
    if (data.board) {
      board = data.board;
      currentPlayer = data.currentPlayer;
      winner = data.winner;
      gameTurns = data.gameTurns;
      allTimeWinners = data.allTimeWinners;
      hasDraw = data.hasDraw
      playersId = playersId;
      emailAdress = {
        yellow: data.invitingPlayer,
        red: data.invitedPlayer,
      };
    }

    if (column < 0 || column >= 7 || board[0][column] !== null || winner) {
      return false; // Invalid move
    }

    for (let row = 5; row >= 0; row--) {
      if (board[row][column] === null) {
        board[row][column] = currentPlayer;
        gameTurns++;
        this.checkForWinner(playerNames);
        if (!winner) {
          currentPlayer = currentPlayer === "red" ? "yellow" : "red";
        }
        console.log(winner, "makeMove winner");
        console.log(hasDraw, "makeMove draw");
        if (!winner && !hasDraw) {
          console.log("makeMove, database Fn running");
          await this.dataBase(gameId, allTimeWinners);
          data.currentPlayer = currentPlayer
          data.gameTurns = gameTurns
        } else {
          if (winner === playerNames.yellowPlayer) {
            allTimeWinners.yellowPlayer++;
            winner = playerNames.yellowPlayer
          } else if (winner === playerNames.redPlayer) {
            allTimeWinners.redPlayer++;
            winner = playerNames.yellowPlayer
          } else if (hasDraw === true) {
            allTimeWinners.draw++;
            hasDraw = true
          }
          data = await this.dataBase(gameId, allTimeWinners, playerNames);
          console.log(winner, "winner makeMove Fn");
        }
        console.log('makeMove data:', data)
        return data;
      }
    }
    return false;
  }

  async dataBase(gameId, allTimeWinners) {
    console.log(gameId, "gameId DataBase Fn ");
    const data = {
      board: board,
      currentPlayer: currentPlayer,
      winner: winner,
      allTimeWinners: allTimeWinners,
      playerNames: playerNames,
      gameTurns: gameTurns,
      hasDraw: hasDraw
    };
    console.log(data, "dataBase data sent");
    try {
      const { gameCenterCollection, client } = await connectToGameIdDatabase();
      await gameCenterCollection.updateOne(
        { _id: gameId },
        { $set: data },
        { upsert: true }
      );

      await client.close();
      return data
    } catch (error) {
      console.error(error);
    }
  }

  async startOver(gameId, yellowPlayerName, redPlayerName, allTimeWinners) {
    console.log(winner, ", winner log startover Fn");

    board = Array.from({ length: 6 }, () => Array(7).fill(null));

    const data = {
      board: board,
      currentPlayer: currentPlayer,
      winner: null,
      gameTurns: 0,
      playerNames: {
        yellowPlayer: yellowPlayerName,
        redPlayer: redPlayerName
      },
      hasDraw: null,
      playerChallenged: null,
      allTimeWinners: allTimeWinners
    };
    console.log(data, "startover Document");
    console.log(gameId, 'gameId startover Fn')

    try {
      const { gameCenterCollection, client } = await connectToGameIdDatabase();

      await gameCenterCollection.updateOne({ _id: gameId }, { $set: data });
      await client.close();
    } catch (error) {
      console.error(error);
    }

    return data
  }

  async newGameChallenge(playerId, gameId) {  
    const playerChallenged = playerId
    console.log('newGameChallenge, playerChallenged data:', playerChallenged)
    try {
        const { gameCenterCollection, client } = await connectToGameIdDatabase();
        await gameCenterCollection.updateOne(
          { _id: gameId },
          { $set:  { playerChallenged } },
        );
  
        await client.close();
        return playerChallenged
      } catch (error) {
        console.error(error);
      }
  }

  checkForWinner(playerNames) {
    for (const combination of winningCombinations) {
      const [a, b, c, d] = combination;
      const player = board[a.row][a.column];
      if (
        player &&
        player === board[b.row][b.column] &&
        player === board[c.row][c.column] &&
        player === board[d.row][d.column]
      ) {
        console.log(player, "winning player - checkForWinner Fn");
        if (player === 'red') {
            winner = playerNames.redPlayer
        } else if (player === 'yellow') {
            winner = playerNames.yellowPlayer
        }
        return winner;
      }
    }
    return null;
  }

  async getAllData(gameId) {
    try {
      const { gameCenterCollection, client } = await connectToGameIdDatabase();

      const document = await gameCenterCollection.findOne({ _id: gameId });
      await client.close();
      return document;
    } catch (error) {
      console.error("Error fetching documents:", error);
      throw error;
    }
  }

  async sendMail() {
    let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "danielmenahem90@gmail.com",
          pass: "uuxr kpcg dnmg fxiu",
        },
      });
      return transporter
  }
}


