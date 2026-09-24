# FOCUS AI Advisor

FOCUS keeps deterministic calculations in the app and uses AI only to interpret those facts.

## Architecture

1. The browser calculates study facts from the user's local/cloud FOCUS data.
2. Raw session notes are not included in the AI payload.
3. The user explicitly presses **Ask FOCUS**.
4. The authenticated Supabase Edge Function calls Gemini.
5. The model returns structured JSON: headline, explanation, evidence, confidence, and one action.
6. The browser validates the returned subject against the user's real subjects before starting a session.
7. If AI is unavailable or not configured, FOCUS falls back to the deterministic advisor.

## Required Supabase secret

Configure this in Supabase Edge Function secrets, never in Vite or browser environment variables:

```
GEMINI_API_KEY=...
```

Optional:

```
GEMINI_MODEL=gemini-3.8-flash
```

Do not add a Gemini API key to `.env.local` as a `VITE_*` variable. Vite variables are shipped to the browser.

The ChatGPT/Gemini consumer subscription and Gemini API billing are separate products; use a Gemini API key from the developer platform and review its pricing/quota before enabling real AI.
