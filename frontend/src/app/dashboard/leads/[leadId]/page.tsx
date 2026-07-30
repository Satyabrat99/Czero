export default function LeadDetail({ params }: { params: { leadId: string } }) {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <a href="/dashboard" className="text-blue-400 hover:underline mb-4 block">← Back to Leads</a>

      <div className="max-w-2xl space-y-6">
        <div className="border-l-4 border-red-500 pl-4">
          <span className="text-red-400 font-bold text-2xl">HOT 92%</span>
          <h2 className="text-xl mt-2">&quot;Anyone know a good invoicing tool?&quot;</h2>
          <p className="text-gray-400 mt-1">Reddit · r/freelance · 4 hours ago</p>
        </div>

        <div className="bg-gray-900 p-4 rounded">
          <h3 className="font-bold mb-2">WHY THIS LEAD</h3>
          <ul className="text-gray-300 space-y-1">
            <li>Directly asking for your type of product</li>
            <li>Freelancer — matches your ICP</li>
            <li>Posted 4 hours ago — thread is active</li>
          </ul>
        </div>

        <div className="bg-gray-900 p-4 rounded">
          <h3 className="font-bold mb-2">CONTACT</h3>
          <p className="text-gray-300">joe@example.com</p>
          <p className="text-gray-300">linkedin.com/in/joesmith</p>
        </div>

        <div className="bg-gray-900 p-4 rounded">
          <h3 className="font-bold mb-2">READY TO SEND</h3>
          <div className="bg-gray-800 p-3 rounded text-gray-300 text-sm">
            Hey Joe, saw your post about invoicing — I built InvoicePilot, an AI tool that handles billing in seconds. Want to try it free?
          </div>
          <button className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm">Copy Email</button>
        </div>

        <div className="flex gap-4">
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">Useful</button>
          <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded">Not useful</button>
        </div>
      </div>
    </div>
  )
}
