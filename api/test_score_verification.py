import asyncio
import os
from app.engines.scorer.llm_scorer import LLMIntentScorer

class SignalMock:
    def __init__(self, text, source='hn'):
        self.text = text
        self.source = source

test_signals = [
    SignalMock("SEEKING WORK | CENTRAL EUROPE | REMOTE<p><pre><code>Premium service, 14 person team of developers + 2 PMs + 1 QA"),
    SignalMock("Lite Agent — https://liteagent.cloud | Hiring Sales Agent | REMOTE | Worldwide"),
    SignalMock("&gt; What's wrong with this idea, really? It's redundant because you can serve HTML to requests with Apache or Ngnix...<p>Overhead, security..."),
    SignalMock("Scrapy vs. Selenium in 2026: Architecture, Tradeoffs, and Real Advice")
]

async def test():
    scorer = LLMIntentScorer()
    results = await scorer.score_batch(test_signals, "TinyFish - Real browser web automation API", {})
    for sig, res in zip(test_signals, results):
        print(f"SCORE: {res['score']} | REASON: {res['reason']}")
        print(f"CLEANED TEXT: {sig.text}")
        print("-" * 60)

if __name__ == "__main__":
    asyncio.run(test())
