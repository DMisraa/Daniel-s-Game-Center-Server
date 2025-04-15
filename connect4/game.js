import { winningCombinations } from "./WINNING_COMBINATIONS.js";
import { games } from "../services/connectFourRoutes.js";
import { connectToDatabase } from "../database.js";

export class Connect4 {
  constructor() {
    this.board = Array.from({ length: 6 }, () => Array(7).fill(null));
    this.currentPlayer = "red";
    this.winner = null;
    this.turns = 0;
    this.gameId = "p1"
    this.hasDraw = false
    this.timeoutId = null;
    this.inactivityPeriod = 10 * 60 * 1000;
    this.playerNames = {
      yellowPlayer: "Blue Player",
      redPlayer: "Red Player",
    };
  }

  getBoard() {
    return this.board;
  }

  getWinner() {
    return this.winner;
  }
  isDraw() {
    return this.turns === 42 && !this.winner;
  }

  async startOver(timeOut) {
    this.board = Array.from({ length: 6 }, () => Array(7).fill(null));
    this.winner = null;
    this.turns = 0

    const data = {
      board: this.board,
      currentPlayer: this.currentPlayer,
      winner: this.winner,
      hasDraw: false,
      allTimeWinners: games,
      turnLength: this.turns
    };

    if (timeOut) {
      data.playerNames = this.playerNames
    }

    try {
      const { gameCenterCollection, client } = await connectToDatabase();

      await gameCenterCollection.updateOne(
        { _id: this.gameId },
        { $set: data },
      );
    await client.close();
    } catch (error) {
      console.error(error);
    }
    return;
  }

  startInactivityTimer() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      let timeOut
      this.startOver(timeOut);
      console.log('timeOut Activated')
    }, this.inactivityPeriod);

    console.log('Inactivity timer start');
  }

  async playerDatabase(playerNames) {
    try {
      const { gameCenterCollection, client } = await connectToDatabase();
      await gameCenterCollection.updateOne(
        { _id: this.gameId },
        { $set: { playerNames } }
      );

      await client.close();
    } catch (error) {
      console.error(error);
    }
  }
  async dataBase() {
    const draw = this.turns === 42 && !this.winner;
    
    const data = {
      board: this.board,
      currentPlayer: this.currentPlayer,
      winner: this.winner,
      hasDraw: draw,
      allTimeWinners: games,
      turnLength: this.turns,
      playerNames: this.playerNames,
    };

    try {
      const { gameCenterCollection, client } = await connectToDatabase();
      await gameCenterCollection.updateOne(
        { _id: this.gameId },
        { $set: data },
        { upsert: true }
      );
      await client.close();
      return;
    } catch (error) {
      console.error(error);
    }
  }

  async getAllData() {
    try {
      const { gameCenterCollection, client } = await connectToDatabase();

      const document = await gameCenterCollection.findOne({});
      await client.close();
      return document;
    } catch (error) {
      console.error("Error fetching documents:", error);
      throw error;
    } 
  }

  checkForWinner() {
    for (const combination of winningCombinations) {
      const [a, b, c, d] = combination;
      const player = this.board[a.row][a.column];
      if (
        player &&
        player === this.board[b.row][b.column] &&
        player === this.board[c.row][c.column] &&
        player === this.board[d.row][d.column]
      ) {
        this.winner = player;
        return player;
      }
    }
    return null;
  }

  makeMove(column) {
    if (
      column < 0 ||
      column >= 7 ||
      this.board[0][column] !== null ||
      this.winner
    ) {
      return false;
    }

    for (let row = 5; row >= 0; row--) {
      if (this.board[row][column] === null) {
        this.board[row][column] = this.currentPlayer;
        this.turns++;
        this.checkForWinner();
        if (!this.winner) {
          this.currentPlayer = this.currentPlayer === "red" ? "blue" : "red";
        }

        return true;
      }
    }
    return false; 
  }
}
