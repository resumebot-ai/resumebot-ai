return (
  <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center">
    <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-6 space-y-6">
      <h1 className="text-3xl font-bold text-center">ResumeBot AI</h1>
      <p className="text-center text-gray-500">Generate a Resume or Cover Letter using AI</p>

      <textarea
        className="w-full border border-gray-300 rounded-lg p-4 h-40 resize-none"
        placeholder="Paste your job experience, role, skills, or goals here..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <div className="flex justify-between items-center">
        <label className="text-sm font-medium">Choose type:</label>
        <select
          className="border border-gray-300 rounded-md p-2"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="resume">Resume</option>
          <option value="coverLetter">Cover Letter</option>
        </select>
      </div>

      <button
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition duration-300"
        onClick={handleGenerate}
        disabled={loading}
      >
        {loading ? 'Generating...' : 'Generate'}
      </button>

      {result && (
        <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 whitespace-pre-wrap max-h-[400px] overflow-auto">
          <h2 className="font-bold mb-2">Output:</h2>
          <p>{result}</p>
        </div>
      )}
    </div>
  </div>
);
