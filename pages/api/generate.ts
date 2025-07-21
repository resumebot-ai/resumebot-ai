import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { input, type } = req.body;

  if (!input || !type) {
    return res.status(400).json({ error: 'Missing input or type' });
  }

  try {
    const prompt = `Generate a professional ${type.toLowerCase()} based on the following:\n\n${input}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    const json = await response.json();

    if (json.error) {
      return res.status(500).json({ error: json.error.message });
    }

    const output = json.choices?.[0]?.message?.content || 'No response generated.';
    res.status(200).json({ result: output });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
}
