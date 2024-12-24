---
'vad-web': patch
---

Fix a bug where any audio chunk that is about 30 seconds long would be discarded.

Tweak the configuration for Silero VAD model to reduce false negatives.
