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

  const invitedPlayerLink = `${process.env.NEXT_PUBLIC_BASE_URL}/${gameType}/${gameId}?token=${player1Token}`;
  const gameCreatorLink = `${process.env.NEXT_PUBLIC_BASE_URL}/${gameType}/${gameId}?token=${player2Token}`;
  console.log(process.env.NEXT_PUBLIC_BASE_URL, 'NEXT_PUBLIC_BASE_URL')

  return { invitedPlayerLink, gameCreatorLink };
}

