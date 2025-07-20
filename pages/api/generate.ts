// pages/api/generate.ts
import type { NextApiRequest, NextApiResponse } from 'next';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { jobTitle, experience } = req.body;

  if (!jobTitle || !experience) {
    return res.status(400).json({ error: 'Missing jobTitle or experience' });
  }

  try {
    const completion = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a professional career assistant that generates high-quality, personalized cover letters.',
          },
          {
            role: 'user',
            content: `Generate a cover letter for a "${jobTitle}" position. Here is the candidate's experience: ${experience}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 600,
      }),
    });

    const data = await completion.json();

    const aiMessage = data?.choices?.[0]?.message?.content;
    if (!aiMessage) {
      return res.status(500).json({ error: 'No response from OpenAI' });
    }

    return res.status(200).json({ coverLetter: aiMessage });
  } catch (error) {
    console.error('OpenAI API error:', error);
    return res.status(500).json({ error: 'Error contacting OpenAI API' });
  }
}
