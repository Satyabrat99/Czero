export default function Settings() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <p className="text-gray-400 mb-8">Configure what we monitor for you.</p>

      <div className="max-w-2xl space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Product URL</label>
          <input
            type="url"
            placeholder="https://your-saas.com"
            className="w-full p-3 bg-gray-900 border border-gray-700 rounded text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Keywords (comma separated)</label>
          <input
            type="text"
            placeholder="invoicing, billing, payments"
            className="w-full p-3 bg-gray-900 border border-gray-700 rounded text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Competitors</label>
          <input
            type="text"
            placeholder="FreshBooks, QuickBooks"
            className="w-full p-3 bg-gray-900 border border-gray-700 rounded text-white"
          />
        </div>

        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded font-medium">
          Analyze & Start Monitoring
        </button>
      </div>
    </div>
  )
}
