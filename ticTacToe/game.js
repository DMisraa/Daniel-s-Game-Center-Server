import { connectToTicTacToeDatabase } from "../database.js";
import WINNING_COMBINATIONS from "./WINNING_COMBINATIONS.js";

let initialGameBoard = [
  [null, null, null],
  [null, null, null],
  [null, null, null],
];

let allTimeScore = {
  X: 0,
  Draw: 0,
  O: 0,
};

export class TicTacToe {
  constructor() {
    this.board = initialGameBoard;
    this.currentPlayer = "X";
    this.winner = null;
    this.turns = 0;
    this.gameId = "p2";
    this.playerNames = {
      X: "Player 1",
      O: "Player 2",
    };
  }

  gameTurns() {
    this.turns++
  }
  deriveWinner(players, gameBoard) {
    let winner;
    console.log(gameBoard, 'gameBoard, deriveWinner Fn')

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

  async getAllData() {
   
    try {
      const { gameCenterCollection, client } = await connectToTicTacToeDatabase();

      const document = await gameCenterCollection.findOne({});
      await client.close();
      return document;
    } catch (error) {
      console.error("Error fetching documents:", error);
      throw error;
    } 
  }

  async ticTacToeDataBase(gameBoard) {
    this.turns++
    console.log(this.turns)
    console.log(gameBoard, 'board ticTacToeDataBase')

    let data = {
      gameBoard,
      playerNames: {
        X: this.playerNames.X,
        O: this.playerNames.O,
      },
      allTimeScore: {
        X: allTimeScore.X,
        Draw: allTimeScore.Draw,
        O: allTimeScore.O
      }
    };

    console.log(data.gameBoard, 'gameBoard, ticTacToeDataBase')

    const winner = this.deriveWinner(this.playerNames, data.gameBoard);
    const hasDraw = this.turns === 9 && !winner

    if (winner || hasDraw) {
      if ((winner === this.playerNames.X)) {
        console.log('player X winner')
        allTimeScore.X++;
        this.turns = 0
      } else if ((winner === this.playerNames.O)) {
        allTimeScore.O++;
        this.turns = 0
        console.log('player O winner')
      } else if (hasDraw) {
        allTimeScore.Draw++;
        this.turns = 0
        console.log('Draw set new game')
      }

       data = {
        gameBoard: initialGameBoard,
        playerNames: {
          X: this.playerNames.X,
          O: this.playerNames.O,
        },
        allTimeScore: {
            X: allTimeScore.X,
            Draw: allTimeScore.Draw,
            O: allTimeScore.O
        }
      };
    }

    try {
      const { gameCenterCollection, client } =
        await connectToTicTacToeDatabase();

      await gameCenterCollection.updateOne(
        { _id: this.gameId },
        { $set: data },
        { upsert: true },
        console.log(data, "Tic Tac Toe data sent to dataBase")
      );
      await client.close();
    } catch (error) {
      console.error(error);
    }

    return;
  }

  async updatePlayerNames(playerName, symbol) {
    this.playerNames[symbol] = playerName;

    const data = {
      playerNames: {
        X: this.playerNames.X,
        O: this.playerNames.O,
      },
    };

    try {
      const { gameCenterCollection, client } =
        await connectToTicTacToeDatabase();

      await gameCenterCollection.updateOne(
        { _id: this.gameId },
        { $set: data },
        console.log(data, "Tic Tac Toe player update")
      );
      await client.close();
    } catch (error) {
      console.error(error);
    }

    return;
  }
}
