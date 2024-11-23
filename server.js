import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from 'dotenv';
import { footer } from "./services/footer.js";
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

const app = express();
const port = process.env.PORT || 4000;
 
dotenv.config();
const allowedOrigins = process.env.BASE_URL
console.log('allowedOrigins', allowedOrigins)

app.use(cors( {
  origin: '*', 
  methods: ["GET", "POST", 'PUT', 'PATCH'], 
  credentials: true 
},)
);
app.use(bodyParser.json());

// connectFour

app.get('/', (req, res) => {
  res.send('Hello World!');
});



app.listen(port, () => {
  console.log(`Connect 4 server running on port ${port}`);
});
