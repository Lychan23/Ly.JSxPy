import { NextApiRequest, NextApiResponse } from 'next';
import Groq from "groq-sdk";
import OpenAI from "openai";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  const { 
    query, 
    provider = 'free', 
    apiKey,
    model 
  } = req.body;

  if (!query) {
    return res.status(400).json({ message: 'Query is required' });
  }

  try {
    let aiResponse = '';

    switch(provider) {
      case 'free':
        // Use Groq as the free provider
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const groqCompletion = await groq.chat.completions.create({
          messages: [{ role: 'user', content: query }],
          model: model || 'llama-3.1-70b-versatile'
        });
        aiResponse = groqCompletion.choices[0]?.message?.content || '';
        break;

      case 'openai':
        // Validate API key
        if (!apiKey) {
          return res.status(401).json({ message: 'OpenAI API key is required' });
        }

        const openai = new OpenAI({ apiKey });
        const openaiCompletion = await openai.chat.completions.create({
          messages: [{ role: 'user', content: query }],
          model: model || 'gpt-3.5-turbo'
        });
        aiResponse = openaiCompletion.choices[0]?.message?.content || '';
        break;

      default:
        return res.status(400).json({ message: 'Unsupported AI provider' });
    }

    res.status(200).json({ result: aiResponse });
  } catch (error) {
    console.error('AI API Error:', error);
    
    // More detailed error handling
    if (error instanceof OpenAI.APIError) {
      // OpenAI specific error
      res.status(error.status || 500).json({ 
        message: 'OpenAI API Error', 
        error: error.message 
      });
    } else if (error instanceof Groq.APIError) {
      // Groq specific error
      res.status(500).json({ 
        message: 'Groq API Error', 
        error: error.message 
      });
    } else if (error instanceof Error) {
      // Generic error
      res.status(500).json({ 
        message: 'Error interacting with AI model', 
        error: error.message 
      });
    } else {
      res.status(500).json({ message: 'Unknown error occurred' });
    }
  }
}