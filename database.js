import { MongoClient } from "mongodb";

const uri =
  "mongodb+srv://danielm:gcese0lmx9Dls2UB@game-center-1.fhck7o2.mongodb.net/";
let client;

export async function connectToDatabase() {
  client = await MongoClient.connect(uri);

  const db = client.db("Game-Center");
  const gameCenterCollection = db.collection("connect4");
  return { gameCenterCollection, client };
}

export async function connectToGameIdDatabase() {
  client = await MongoClient.connect(uri);

  const db = client.db("Game-Center");
  const gameCenterCollection = db.collection("connect4_Online");
  return { gameCenterCollection, client };
}

export async function connectToTicTacToeDatabase() {
  client = await MongoClient.connect(uri);

  const db = client.db("Game-Center");
  const gameCenterCollection = db.collection("Tic_Tac_Toe");
  return { gameCenterCollection, client };
}

export async function connectToTicTacToeGameId() {
  client = await MongoClient.connect(uri);

  const db = client.db("Game-Center");
  const gameCenterCollection = db.collection("Tic_Tac_Toe_Online");
  return { gameCenterCollection, client };
}
