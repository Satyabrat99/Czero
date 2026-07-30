export default function Dashboard() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Leads</h1>
      <p className="text-gray-400 mb-8">People actively looking for your product.</p>

      <div className="space-y-4">
        {[
          { score: 92, text: "Anyone know a good invoicing tool?", source: "Reddit", time: "4h ago", hot: true },
          { score: 87, text: "Looking for FreshBooks alternative", source: "Reddit", time: "1d ago", hot: true },
          { score: 68, text: "How do you handle freelancer billing?", source: "Twitter", time: "2d ago", hot: false },
        ].map((lead, i) => (
          <div key={i} className={`border-l-4 p-4 rounded ${lead.hot ? 'border-red-500 bg-red-500/10' : 'border-yellow-500 bg-yellow-500/10'}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`font-bold ${lead.hot ? 'text-red-400' : 'text-yellow-400'}`}>
                {lead.hot ? 'HOT' : 'WARM'} {lead.score}%
              </span>
              <span className="text-gray-500 text-sm">{lead.source} · {lead.time}</span>
            </div>
            <p className="text-white">&quot;{lead.text}&quot;</p>
            <button className="mt-2 text-blue-400 text-sm hover:underline">View →</button>
          </div>
        ))}
      </div>
    </div>
  )
}
