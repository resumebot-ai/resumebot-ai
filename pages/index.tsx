// pages/index.tsx
import { useState } from 'react';

export default function Home() {
  const [jobTitle, setJobTitle] = useState('');
  const [experience, setExperience] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  async function generateCoverLetter() {
    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobTitle, experience }),
      });
      const data = await response.json();
      setResult(data.coverLetter || 'No response from AI.');
    } catch (error) {
      setResult('Error generating cover letter.');
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center p-6">
      <div className="max-w-xl w-full bg-white rounded-xl shadow-md p-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">
          Resumebot AI — Cover Letter Generator
        </h1>

        <label className="block mb-4">
          <span className="text-gray-700 font-semibold">Job Title</span>
          <input
            type="text"
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="e.g. Software Engineer"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
          />
        </label>

        <label className="block mb-4">
          <span className="text-gray-700 font-semibold">Your Experience</span>
          <textarea
            rows={6}
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 focus:border-indigo-500 focus:ring-indigo-500 resize-none"
            placeholder="Describe your relevant experience..."
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
          />
        </label>

        <button
          disabled={loading || !jobTitle || !experience}
          onClick={generateCoverLetter}
          className={`w-full py-3 rounded-md text-white font-semibold transition ${
            loading || !jobTitle || !experience
              ? 'bg-indigo-300 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {loading ? 'Generating...' : 'Generate Cover Letter'}
        </button>

        {result && (
          <section className="mt-8 bg-gray-100 p-4 rounded-md whitespace-pre-wrap text-gray-900 font-mono max-h-96 overflow-y-auto">
            {result}
          </section>
        )}
      </div>

      <footer className="mt-12 text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Resumebot AI. All rights reserved.
      </footer>
    </main>
  );
}
