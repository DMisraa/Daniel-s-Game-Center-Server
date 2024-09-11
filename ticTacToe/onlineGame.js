import nodemailer from "nodemailer";
import { connectToTicTacToeGameId } from "../database.js";
import WINNING_COMBINATIONS from "./WINNING_COMBINATIONS.js";

let currentPlayer = 'X'
export class TicTacToe_Online {
  async sendMail() {
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "danielmenahem90@gmail.com",
        pass: "uuxr kpcg dnmg fxiu",
      },
    });
    return transporter;
  }

  async getGameDataById(gameId) {
    try {
      const { gameCenterCollection, client } = await connectToTicTacToeGameId();
      const gameData = await gameCenterCollection.findOne({ _id: gameId });
      console.log('gameId fethced', gameId)
      await client.close();
      return gameData;
    } catch (error) {
      console.error("Error fetching game data by ID:", error);
      throw error;
    }
  }
  async getAllData(gameId) {
    try {
      const { gameCenterCollection, client } = await connectToTicTacToeGameId();

      const document = await gameCenterCollection.findOne({ _id: gameId });
      await client.close();
      return document;
    } catch (error) {
      console.error("Error fetching documents:", error);
      throw error;
    }
  }

  async updateDatabase(gameId, data) {
    try {
      const { gameCenterCollection, client } = await connectToTicTacToeGameId();

      const document = await gameCenterCollection.updateOne(
        { _id: gameId },
        { $set: data }
      );
      await client.close();
      return document;
    } catch (error) {
      console.error("Error updating docs:", error);
      throw error;
    }
  }

  //   async getGameDataById(gameId) {
  //     try {
  //       const { gameCenterCollection, client } = await connectToTicTacToeGameId();
  //       const gameData = await gameCenterCollection.findOne({ _id: gameId });
  //       console.log('gameId fethced', gameId)
  //       await client.close();
  //       return gameData;
  //     } catch (error) {
  //       console.error("Error fetching game data by ID:", error);
  //       throw error;
  //     }
  //   }

  async newGameChallenge(playerId, gameId) {
    const playerChallenged = playerId;
    try {
      const { gameCenterCollection, client } = await connectToTicTacToeGameId();
      await gameCenterCollection.updateOne(
        { _id: gameId },
        { $set: playerChallenged }
      );

      await client.close();
      return;
    } catch (error) {
      console.error(error);
    }
  }

  async makeMove(gameBoard, gameId, playerNames) {
    const gameData = await this.getAllData(gameId);
    
    let allTimeScore = gameData.allTimeWinners;
    let turns = gameData.turns;

    const winner = this.deriveWinner(playerNames, gameBoard);
    const hasDraw = turns === 9 && !winner;
    console.log(playerNames, "player names makemove Fn");
    console.log(currentPlayer, 'player playing, makeMove Fn')
    if (!winner) {
        currentPlayer = currentPlayer === "X" ? "O" : "X";
        console.log('changeActivePlayer running')
      }
      console.log(currentPlayer, 'next player playing, makeMove Fn')

    if (winner || hasDraw) {
      if (winner === playerNames.X) {
        console.log("player X winner");
        allTimeScore.X++;
        turns = 0;
      } else if (winner === playerNames.O) {
        allTimeScore.O++;
        turns = 0;
        console.log("player O winner");
      } else if (hasDraw) {
        allTimeScore.Draw++;
        turns = 0;
        console.log("Draw set new game");
      }
    }

    turns++;

    const data = {
      allTimeWinners: allTimeScore,
      turns: turns,
      board: gameBoard,
      winner: winner,
      currentPlayer: currentPlayer
    };

    console.log(data, 'data sent to database, makeMove Fn')

    this.updateDatabase(gameId, data);
  }
  deriveWinner(players, gameBoard) {
    let winner;

    console.log(gameBoard, " gameBoard, deriveWinner Fn");

    for (const combination of WINNING_COMBINATIONS) {
      const firstSquareSymbole =
        gameBoard[combination[0].row][combination[0].column];
      const secondSquareSymbole =
        gameBoard[combination[1].row][combination[1].column];
      const thirdSquareSymbole =
        gameBoard[combination[2].row][combination[2].column];

      if (
        firstSquareSymbole &&
        firstSquareSymbole === secondSquareSymbole &&
        firstSquareSymbole === thirdSquareSymbole
      ) {
        winner = players[firstSquareSymbole];
      }
    }
    return winner;
  }

  async startOver(gameId, players) {

    let board = [
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ];

    const data = {
      board: board,
      currentPlayer: 'X',
      winner: null,
      turns: 0,
      playerNames: players,
      hasDraw: false,
      playerChallenged: null,
    };
    console.log(data, "startover Document");
    console.log(gameId, "gameId startover Fn");

    try {
      const { gameCenterCollection, client } = await connectToTicTacToeGameId();

      await gameCenterCollection.updateOne({ _id: gameId }, { $set: data });
      await client.close();
    } catch (error) {
      console.error(error);
    }

    return;
  }
}
