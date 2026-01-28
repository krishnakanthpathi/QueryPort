

const DocsAchievements = () => {
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-white">Achievements</h1>
            <p className="text-gray-300">Retrieve information about achievements added by users.</p>

            {/* Get All Achievements */}
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                <div className="flex items-center px-4 py-3 bg-white/5 border-b border-white/10">
                    <span className="px-2 py-1 text-xs font-bold text-white bg-white/10 rounded mr-3 border border-white/10">GET</span>
                    <code className="text-sm font-mono text-gray-300">/api/v1/achievements</code>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-400">Fetches a list of all achievements.</p>
                    <div>
                        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Response Example</h4>
                        <pre className="bg-black/50 p-4 rounded-lg overflow-x-auto text-xs text-gray-300 font-mono">
                            {`{
  "status": "success",
  "data": {
    "achievements": [
      {
        "_id": "67890",
        "title": "Hackathon Winner",
        "description": "Won 1st place in the global hackathon.",
        "date": "2023-11-15T00:00:00.000Z",
        "image": "https://...",
        "user": {
           "name": "Jane Doe",
           "avatar": "https://..."
        }
      }
    ]
  }
}`}
                        </pre>
                    </div>
                </div>
            </div>

            {/* Get Achievement By ID */}
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                <div className="flex items-center px-4 py-3 bg-white/5 border-b border-white/10">
                    <span className="px-2 py-1 text-xs font-bold text-white bg-white/10 rounded mr-3 border border-white/10">GET</span>
                    <code className="text-sm font-mono text-gray-300">/api/v1/achievements/id/:id</code>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-400">Fetches details of a specific achievement.</p>
                    <div>
                        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Parameters</h4>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-300">
                                <thead className="text-xs uppercase bg-white/5 text-gray-400">
                                    <tr>
                                        <th className="px-4 py-2">Name</th>
                                        <th className="px-4 py-2">Type</th>
                                        <th className="px-4 py-2">Description</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    <tr>
                                        <td className="px-4 py-2 font-mono text-white">id</td>
                                        <td className="px-4 py-2">string</td>
                                        <td className="px-4 py-2">The unique ID of the achievement.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocsAchievements;
