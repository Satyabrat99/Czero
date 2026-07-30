import re
import xml.etree.ElementTree as ET
import httpx
from datetime import datetime, timedelta
from .base import BaseSourceManager, Signal


class RedditViaRssCollector(BaseSourceManager):
    """
    Reddit signal collection using RSS feeds.
    
    Reddit API is blocked for new apps (November 2025).
    RSS feeds still work without credentials.
    
    This is FREE and reliable. We monitor target subreddits
    for posts matching product keywords.
    """
    
    # High-value subreddits for B2B SaaS
    DEFAULT_SUBREDDITS = [
        "SaaS", "startups", "Entrepreneur", "smallbusiness",
        "freelance", "webdev", "SideProject", "indiehackers",
        "marketing", "sales", "technology", "software",
    ]
    
    INTENT_PHRASES = [
        "recommend", "alternative to", "looking for", "anyone know",
        "need", "suggestion", "what do you use", "what's the best",
        "switching from", "frustrated", "better than", "worth it",
        "help me find", "how do you",
    ]
    
    def __init__(self):
        self.client = httpx.Client(
            headers={"User-Agent": "CzeroBot/1.0 (lead generation research)"},
            timeout=15
        )
    
    def name(self) -> str:
        return "reddit"
    
    async def collect(self, product: dict) -> list[Signal]:
        """Search Reddit via RSS for buying intent signals."""
        signals = []
        keywords = product.get("keywords", [])
        subreddits = product.get("subreddit_list", self.DEFAULT_SUBREDDITS)
        
        # Clean subreddit names (remove r/ prefix)
        subreddits = [s.replace("r/", "") for s in subreddits]
        
        for sub in subreddits:
            try:
                # Fetch new posts from subreddit
                rss_url = f"https://www.reddit.com/r/{sub}/new/.rss?limit=25"
                response = self.client.get(rss_url)
                
                if response.status_code != 200:
                    continue
                
                # Parse RSS
                root = ET.fromstring(response.text)
                ns = {'atom': 'http://www.w3.org/2005/Atom'}
                entries = root.findall('atom:entry', ns)
                
                for entry in entries:
                    title = entry.find('atom:title', ns)
                    link = entry.find('atom:link', ns)
                    content = entry.find('atom:content', ns)
                    
                    if title is None or link is None:
                        continue
                    
                    title_text = title.text or ""
                    content_text = content.text if content is not None else ""
                    full_text = f"{title_text}\n\n{content_text}"
                    
                    # Check if post matches product keywords
                    if not self._matches_keywords(full_text, keywords):
                        continue
                    
                    # Check for intent
                    intent = self._detect_intent(full_text)
                    if intent["score"] < 30:
                        continue
                    
                    # Extract username from content if possible
                    username = self._extract_username(content_text)
                    
                    url = link.attrib.get("href", "")
                    
                    signal = Signal(
                        source="reddit",
                        source_url=url,
                        author_username=username,
                        text=full_text[:1000],
                        posted_at=datetime.now(),  # RSS doesn't always have exact timestamp
                        subreddit=sub,
                        metadata={
                            "intent_type": intent["type"],
                            "intent_score": intent["score"],
                            "source": "rss",
                        }
                    )
                    signals.append(signal)
                    
            except Exception as e:
                print(f"Reddit RSS error for r/{sub}: {e}")
                continue
        
        return signals
    
    def _matches_keywords(self, text: str, keywords: list) -> bool:
        """Check if post text contains any product keywords."""
        text_lower = text.lower()
        return any(kw.lower() in text_lower for kw in keywords)
    
    def _detect_intent(self, text: str) -> dict:
        """Detect buying intent in Reddit post text."""
        text_lower = text.lower()
        
        for phrase in self.INTENT_PHRASES:
            if phrase in text_lower:
                return {"type": "strong", "score": 85}
        
        return {"type": "none", "score": 0}
    
    def _extract_username(self, content: str) -> str:
        """Try to extract username from Reddit content."""
        # Look for common username patterns in Reddit HTML
        match = re.search(r'>([^<]+)</a>', content)
        if match:
            return match.group(1).strip()
        return "unknown"
