

const DocsIntro = () => {
    return (
        <div className="space-y-6">
            <h1 className="text-4xl font-bold text-white mb-2">Introduction</h1>
            <p className="text-lg text-gray-300">
                Welcome to the QueryPort API documentation. You can use our public API endpoints to integrate your QueryPort data into your personal portfolio, blog, or other applications.
            </p>

            <div className="my-8 p-6 bg-white/5 border border-white/10 rounded-xl">
                <h3 className="text-xl font-semibold text-white mb-2">Base URL</h3>
                <code className="text-lg text-white bg-black/50 px-4 py-2 rounded-lg block w-full overflow-x-auto border border-white/5">
                    https://query-port.vercel.app/api/v1
                </code>
            </div>

            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white">Getting Started</h2>
                <p className="text-gray-400 leading-relaxed">
                    All endpoints return JSON responses. Most public endpoints do not require authentication, allowing you to easily fetch your profile details, projects, and achievements to display elsewhere.
                </p>
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-yellow-200 text-sm">
                        <strong>Note:</strong> Rate limiting may apply. Please cache responses where possible to avoid hitting the limits.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DocsIntro;
