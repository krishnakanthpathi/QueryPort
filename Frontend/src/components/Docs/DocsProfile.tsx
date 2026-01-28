

const DocsProfile = () => {
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-white">User Profile</h1>
            <div className="space-y-4">
                <p className="text-gray-300">
                    The profile endpoint allows you to retrieve public details about a user, including their bio, skills, social links, and stats.
                </p>

                <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                    <div className="flex items-center px-4 py-3 bg-white/5 border-b border-white/10">
                        <span className="px-2 py-1 text-xs font-bold text-white bg-white/10 rounded mr-3 border border-white/10">GET</span>
                        <code className="text-sm font-mono text-gray-300">/api/v1/profile/u/:username</code>
                    </div>
                    <div className="p-6 space-y-4">
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
                                            <td className="px-4 py-2 font-mono text-white">username</td>
                                            <td className="px-4 py-2">string</td>
                                            <td className="px-4 py-2">The unique username of the user.</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Response Example</h4>
                            <pre className="bg-black/50 p-4 rounded-lg overflow-x-auto text-xs text-gray-300 font-mono">
                                {`{
  "status": "success",
  "data": {
    "profile": {
      "user": "[UserId]",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "https://...",
      "username": "johndoe",
      "bio": "Full Stack Developer",
      "github": "https://github.com/johndoe",
      "linkedin": "https://linkedin.com/in/johndoe",
      "skills": ["React", "Node.js", "TypeScript"],
      "stats": {
        "leetcode": { ... },
        "hackerrank": { ... }
      }
    }
  }
}`}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocsProfile;
