

const DocsLeaderboard = () => {
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
            <p className="text-gray-300">Access global leaderboard statistics.</p>

            {/* Get Leaderboard */}
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                <div className="flex items-center px-4 py-3 bg-white/5 border-b border-white/10">
                    <span className="px-2 py-1 text-xs font-bold text-white bg-white/10 rounded mr-3 border border-white/10">GET</span>
                    <code className="text-sm font-mono text-gray-300">/api/v1/leaderboard</code>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-400">Fetches the current leaderboard rankings based on user statistics.</p>
                    <div>
                        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Response Example</h4>
                        <pre className="bg-black/50 p-4 rounded-lg overflow-x-auto text-xs text-gray-300 font-mono">
                            {`{
  "status": "success",
  "data": {
    "leaderboard": [
      {
        "user": {
           "name": "Top Coder",
           "username": "topcoder",
           "avatar": "https://..."
        },
        "totalScore": 1500,
        "leetcodeSolved": 500,
        "hackerrankScore": 1000
      }
    ]
  }
}`}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocsLeaderboard;
