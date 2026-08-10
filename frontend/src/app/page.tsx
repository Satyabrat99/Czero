export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center py-20 px-4">
        <h1 className="text-5xl font-bold text-center max-w-3xl">
          Find the people already looking for your product.
        </h1>
        <p className="text-xl text-gray-400 mt-6 text-center max-w-2xl">
          Paste your SaaS URL. We monitor Reddit, Twitter, LinkedIn, HN and the
          entire web for buying intent signals. Get leads with contact info and
          ready-to-send messages.
        </p>
        <div className="mt-8 flex gap-4">
          <a
            href="/auth/signup"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium"
          >
            Get Started Free
          </a>
          <a
            href="#how-it-works"
            className="border border-gray-600 hover:border-gray-400 text-white px-8 py-3 rounded-lg font-medium"
          >
            How it works
          </a>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: '1',
              title: 'Paste your URL',
              desc: 'AI analyzes your product and identifies who your customers are.',
            },
            {
              step: '2',
              title: 'We find buyers',
              desc: 'We monitor social platforms 24/7 for people actively looking for your product.',
            },
            {
              step: '3',
              title: 'Get leads + drafts',
              desc: 'Receive their contact info and ready-to-send personalized messages.',
            },
          ].map((item, i) => (
            <div key={i} className="text-center">
              <div className="text-4xl font-bold text-blue-500 mb-4">
                {item.step}
              </div>
              <h3 className="text-xl font-bold mb-2">{item.title}</h3>
              <p className="text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Simple pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              name: 'Free',
              price: '$0',
              features: ['3 leads/week', 'No contact info', 'Score + reasoning only'],
            },
            {
              name: 'Starter',
              price: '$29/mo',
              features: [
                '10 leads/week',
                'Email + LinkedIn',
                'Ready-to-send drafts',
                'Priority scoring',
              ],
              popular: true,
            },
            {
              name: 'Pro',
              price: '$79/mo',
              features: [
                '25 leads/week',
                'Daily alerts',
                'All platforms',
                'API access',
              ],
            },
          ].map((plan, i) => (
            <div
              key={i}
              className={`p-6 rounded-lg border ${
                plan.popular
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-700'
              }`}
            >
              {plan.popular && (
                <div className="text-blue-400 text-sm mb-2">Most popular</div>
              )}
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <div className="text-3xl font-bold mt-2">{plan.price}</div>
              <ul className="mt-4 space-y-2">
                {plan.features.map((f, j) => (
                  <li key={j} className="text-gray-300">
                    ✓ {f}
                  </li>
                ))}
              </ul>
              <a
                href="/auth/signup"
                className={`block mt-6 text-center py-2 rounded font-medium ${
                  plan.popular
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'border border-gray-600 hover:border-gray-400 text-white'
                }`}
              >
                Get started
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 text-center text-gray-500 text-sm">
        <p>Czero — Built for the 86% of founders stuck at $0.</p>
      </footer>
    </div>
  )
}
