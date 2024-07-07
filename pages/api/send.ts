import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { Server as SocketIOServer } from "socket.io";

interface ExtendedNextApiRequest extends NextApiRequest {
  io: SocketIOServer;
}

export default async function handler(req: ExtendedNextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { message } = req.body;
    const apiUrl = "http://localhost:5000/send-message"; // Flask endpoint

    try {
      await axios.post(apiUrl, { text: message });
      req.io.emit("activity", "Text sent to Discord");
      res.send("Message sent to Discord");
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(`Failed to send message: ${error.message}`);
        res.status(500).send(`Failed to send message: ${error.message}`);
      } else {
        console.error("Failed to send message: Unknown error");
        res.status(500).send("Failed to send message");
      }
    }
  } else {
    res.status(405).send("Method Not Allowed");
  }
}
