from collections import defaultdict
from .sources.base import Signal


class SignalMerger:
    """
    Merge signals from all sources and remove duplicates.

    Three levels:
    1. Content hash dedup (same post on multiple platforms)
    2. Cross-platform author matching (same person, different platforms)
    3. Keep richest version (most metadata)
    """

    def merge_and_dedup(self, all_signals: list[list[Signal]]) -> list[Signal]:
        flat = [s for source_signals in all_signals for s in source_signals]

        seen = {}
        for signal in flat:
            key = signal.dedup_key
            if key not in seen:
                seen[key] = signal
            else:
                existing = seen[key]
                if len(signal.text) > len(existing.text):
                    seen[key] = signal

        return list(seen.values())
