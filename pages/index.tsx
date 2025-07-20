import { useState } from 'react';

export default function Home() {
  const [input, setInput] = useState('');
  const [type, setType] = useState('Resume');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setResult('');

    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, type }),
    });

    const data = await response.json();
    setResult(data.result);
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-2xl p-10 space-y-6">
        <h1 className="text-3xl font-bold text-center text-gray-800">📄 Resumebot AI</h1>

        <div className="flex gap-4 justify-center">
          {['Resume', 'Cover Letter', 'LinkedIn Summary'].map((option) => (
            <button
              key={option}
              onClick={() => setType(option)}
              className={`px-4 py-2 rounded-full border ${type === option ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              {option}
            </button>
          ))}
        </div>

        <textarea
          rows={8}
          placeholder="Paste your job description or resume details here..."
          className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <button
          onClick={handleSubmit}
          disabled={loading || !input.trim()}
          className="w-full py-3 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50 transition"
        >
          {loading ? 'Generating...' : `Generate ${type}`}
        </button>

        {result && (
          <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 whitespace-pre-wrap text-gray-800">
            {result}
          </div>
        )}
      </div>
    </main>
  );
}
