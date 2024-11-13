<h1> Game Center Server </h1>

This is the back-end server for the Game Center project. It supports real-time gameplay features and handles player authentication, game state management, and WebSocket communication for games like Tic-Tac-Toe and Connect Four.


<h2> Features </h2>
<ul>
<li> Real-time gameplay: Enables real-time updates for games using WebSockets, so players can see moves instantly. </li>
<li> Token-based authentication: Secure token-based system to verify player actions and access control. </li>
<li> Game state management: Tracks the game board, scores, player turns, and game completion state. </li>
<li> Persistent storage: Uses MongoDB to store game information, player stats, and scores. </li>
<li> Cross-origin support: Configured to work with the Game Center front end. </li>
</ul>

<h2> Technologies </h2>
<ul>
<li> Node.js </li>
<li> Express.js </li>
<li> WebSocket (Socket.IO) </li>
<li> MongoDB </li>
<li> JSON Web Token (JWT) for authentication </li>
</ul>

<h2> WebSocket Events </h2>

The server uses WebSocket (Socket.IO) for real-time events. Below are the main events and their payloads:
<ul>
<li> <code>joinRoom</code> </li> 
<ul> 
<li> Description: Joins a game room based on game ID. </li>
<li> Payload: <code>{ gameId: String }</code> </li>
  </ul>
</ul>

<ul>
<li> <code>initial_GET</code> </li>
<ul> 
<li> Description: Request to retrieve initial game data for a player. </li>
<li> Payload: <code>{ gameId: String }</code> </li>
  </ul>
</ul>

<ul>
<li> <code>ticTacToeMove</code> </li>  
<ul> 
<li> Description: Handles a Tic-Tac-Toe move by a player after validating the token.</li>
<li> Payload: <code>{ gameId: String, playerId: String, move: { row: Number, col: Number } }</code> </li>
  </ul>
</ul>

<ul>
<li> <code>connectFourMove</code> </li> 
<ul> 
<li> Description: Processes a Connect Four move by a player. </li>
<li> Payload: <code>{ gameId: String, playerId: String, move: { column: Number } }</code> </li>
  </ul>
</ul>

<h2> API Endpoints </h2>

The server also provides RESTful API endpoints:

<ul>
<li> <code>POST /game/invite</code> </li> 
Invites a player to join a game. Generates a link with a token for secure access. </ul>

<ul>
<li> <code>GET /game/:gameId/status</code> </li>
Retrieves the status of a game, including current turn, board state, and scores. </ul>

<ul>
<li> <code>POST /game/:gameId/move</code> </li>
Submits a player’s move. Validates the token before processing. </ul>

<h2> Connecting to the Vercel Frontend </h2>

The Game Center front end is deployed on Vercel, with the backend on Railway. CORS settings are configured to allow cross-origin requests seamlessly between the frontend and backend, ensuring a smooth and responsive gaming experience.


