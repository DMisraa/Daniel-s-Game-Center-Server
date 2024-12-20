import { Connect4_Online } from "../connect4/onlineGame.js";

const game_Online = new Connect4_Online();

export async function footer(req, res) {
    const {name, email, message} = req.body
 
    const msg = {
     from: email,
     to: 'danielmenahem90@gmail.com',
     subject: `${name} has contacted Menahem Game-Center admin`,
     text: `${message}`,
     html: `${message}`
    }
 
    const transporter = await game_Online.sendMail()
    const success = await transporter.sendMail(msg)
 
    if (!success) {
     return res.status(400).json({ error: "Unable to contact page admin via Footer form" });
   }
   res.json()
 }