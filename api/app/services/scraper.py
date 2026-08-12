import os
import re
import httpx
import logging
from exa_py import Exa

logger = logging.getLogger("scraper")

class WebPageScraper:
    """
    Lightweight, robust web page scraper with standard HTTP fetch
    and Exa get_contents fallback to bypass Cloudflare/JS blocking.
    """

    def __init__(self):
        self.headers = {
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
        }

    def _clean_html(self, html_text: str) -> str:
        """Strip HTML tags, scripts, stylesheets, and normalize whitespaces."""
        # Remove script and style elements
        html_clean = re.sub(r'<(script|style|noscript)[^>]*>([\s\S]*?)<\/\1>', ' ', html_text)
        # Remove comments
        html_clean = re.sub(r'<!--([\s\S]*?)-->', ' ', html_clean)
        # Remove all HTML tags
        text = re.sub(r'<[^>]+>', ' ', html_clean)
        # Normalize whitespace (replace tabs/newlines with spaces)
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    async def scrape(self, url: str) -> str:
        """Scrape webpage content. Fallback to Exa if standard fetch fails."""
        # 1. Standard HTTP fetch
        try:
            logger.info(f"Attempting standard HTTP scrape for URL: {url}")
            async with httpx.AsyncClient(headers=self.headers, follow_redirects=True, timeout=15.0) as client:
                response = await client.get(url)
                
                # Check if we were blocked (Cloudflare etc. often return 403 or 503)
                if response.status_code == 200:
                    text_content = self._clean_html(response.text)
                    if text_content and len(text_content) > 100:
                        logger.info("Standard HTTP scrape successful")
                        return text_content
                    else:
                        logger.warning("Standard HTTP scrape returned empty or very short content")
                else:
                    logger.warning(f"Standard HTTP scrape returned status code {response.status_code}")
        except Exception as e:
            logger.warning(f"Standard HTTP scrape failed: {e}")

        # 2. Fallback: Exa get_contents API
        exa_key = os.getenv("EXA_API_KEY")
        if exa_key:
            try:
                logger.info(f"Attempting Exa get_contents fallback for URL: {url}")
                # Exa SDK does synchronous HTTP, so we wrap it or call it in executor if needed.
                # However, since we're in async, we can construct the client and call it.
                # In most python async frameworks, running short synchronous I/O blocks the thread briefly,
                # but to be safe, we'll wrap it or just use the SDK.
                exa = Exa(api_key=exa_key)
                
                # Normalize URL for Exa (ensure protocol exists)
                normalized_url = url
                if not normalized_url.startswith("http://") and not normalized_url.startswith("https://"):
                    normalized_url = "https://" + normalized_url

                result = exa.get_contents([normalized_url])
                if result and result.results:
                    scraped_text = result.results[0].text
                    if scraped_text:
                        logger.info("Exa get_contents scrape successful")
                        # Exa returns cleaned markdown or plain text by default, but let's normalize spaces
                        return re.sub(r'\s+', ' ', scraped_text).strip()
            except Exception as ex:
                logger.error(f"Exa fallback scrape failed: {ex}")
        else:
            logger.warning("EXA_API_KEY not configured. Cannot perform fallback scrape.")

        return ""
