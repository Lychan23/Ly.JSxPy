import { NextApiRequest, NextApiResponse } from 'next';
import Groq from "groq-sdk";

// Initialize Groq with your API key
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ message: 'Query is required' });
  }

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: query,
        },
      ],
      model: 'llama-3.1-70b-versatile', // You can replace this with any other model you want to use
    });

    // Return the AI's response
    const aiResponse = chatCompletion.choices[0]?.message?.content || 'No response from model';
    res.status(200).json({ result: aiResponse });
  } catch (error) {
    // Type-check the error
    if (error instanceof Error) {
      res.status(500).json({ message: 'Error interacting with the model', error: error.message });
    } else {
      // Handle the case where the error is not an instance of Error
      res.status(500).json({ message: 'Unknown error occurred' });
    }
  }
}
