import pkg from 'jsonwebtoken';

const { sign } = pkg;

export function generateTokenByLink(player1Id, player2Id, gameId, gameType) {
    const secretKey = "Daniels_Game_Center"
  const player1Token = sign(
    { playedId: player1Id, gameId, role: "player1" },
    secretKey
  );
  const player2Token = sign(
    { playedId: player2Id, gameId, role: "player2" },
    secretKey
  );
process.en
  console.log(gameId, 'generateToken Fn')

  console.log(player1Token, 'Token 1', player2Token, "Token 2");

  const invitedPlayerLink = `${process.env.NODE_BASE_URL}/${gameType}/${gameId}?token=${player1Token}`;
  const gameCreatorLink = `${process.env.NODE_BASE_URL}/${gameType}/${gameId}?token=${player2Token}`;

  return { invitedPlayerLink, gameCreatorLink };
}

