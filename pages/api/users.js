import { supabase } from '../../lib/supabaseClient';

export default async function handler(req, res) {
  // Handle GET request: fetch all users
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('users').select('*');
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ users: data });
  }

  // Handle POST request: add a new user
  if (req.method === 'POST') {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const { data, error } = await supabase.from('users').insert([{ email }]);
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(201).json({ user: data[0] });
  }

  // Respond with 405 if method not supported
  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
