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


<h2> WebSocket Events </h2>

The server uses WebSocket (Socket.IO) for real-time events. Below are the main events and their payloads:
<ul>
<li> joinRoom </li> 
<ul> 
<li> Description: Joins a game room based on game ID. </li>
<li> Payload: `{ gameId: String }` </li>
  </ul>
</ul>

<ul>
<li> initial_GET </li> 
<ul> 
<li> Description: Request to retrieve initial game data for a player. </li>
<li> Payload: { gameId: String } </li>
  </ul>
</ul>

<ul>
<li> ticTacToeMove </li> 
<ul> 
<li> Description: Handles a Tic-Tac-Toe move by a player after validating the token.</li>
<li> Payload: { gameId: String, playerId: String, move: { row: Number, col: Number } } </li>
  </ul>
</ul>

<ul>
<li> connectFourMove </li> 
<ul> 
<li> Description: Processes a Connect Four move by a player. </li>
<li> Payload: { gameId: String, playerId: String, move: { column: Number } } </li>
  </ul>
</ul>
