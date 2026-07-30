import os
import praw
from datetime import datetime, timezone
from typing import Optional
from .base import BaseSourceManager, Signal


class RedditSourceManager(BaseSourceManager):
    """
    Reddit signal collection using PRAW.

    Searches subreddits for keywords + monitors comments for intent.
    """

    def __init__(self):
        self._reddit = None

    def _get_client(self):
        if self._reddit is None:
            client_id = os.getenv("REDDIT_CLIENT_ID")
            client_secret = os.getenv("REDDIT_CLIENT_SECRET")
            if not client_id or not client_secret:
                return None
            self._reddit = praw.Reddit(
                client_id=client_id,
                client_secret=client_secret,
                user_agent=os.getenv("REDDIT_USER_AGENT", "CzeroBot/1.0"),
            )
        return self._reddit

    def name(self) -> str:
        return "reddit"

    async def collect(self, product: dict) -> list[Signal]:
        """Search Reddit for buying intent signals."""
        reddit = self._get_client()
        if not reddit:
            return []

        signals = []
        keywords = product.get("keywords", [])
        subreddits = product.get("subreddit_list", ["SaaS", "startups", "Entrepreneur"])

        for sub_name in subreddits:
            sub_name = sub_name.replace("r/", "")
            try:
                subreddit = reddit.subreddit(sub_name)

                for keyword in keywords:
                    for submission in subreddit.search(keyword, sort="new", time_filter="week", limit=15):
                        signal = Signal(
                            source="reddit",
                            source_url=f"https://reddit.com{submission.permalink}",
                            author_username=str(submission.author) or "deleted",
                            text=f"{submission.title}\n\n{submission.selftext}",
                            posted_at=datetime.fromtimestamp(submission.created_utc, tz=timezone.utc),
                            score_raw=submission.score,
                            subreddit=sub_name,
                            metadata={
                                "num_comments": submission.num_comments,
                                "upvote_ratio": submission.upvote_ratio,
                            }
                        )
                        signals.append(signal)

                        submission.comments.replace_more(limit=0)
                        for comment in submission.comments.list()[:5]:
                            if any(kw.lower() in comment.body.lower() for kw in ["looking for", "need", "recommend", "alternative"]):
                                comment_signal = Signal(
                                    source="reddit",
                                    source_url=f"https://reddit.com{comment.permalink}",
                                    author_username=str(comment.author) or "deleted",
                                    text=comment.body,
                                    posted_at=datetime.fromtimestamp(comment.created_utc, tz=timezone.utc),
                                    score_raw=comment.score,
                                    subreddit=sub_name,
                                    metadata={"parent_post": submission.title}
                                )
                                signals.append(comment_signal)

            except Exception as e:
                print(f"Reddit error for r/{sub_name}: {e}")
                continue

        return signals
