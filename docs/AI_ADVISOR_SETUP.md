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


## Grounding and personalization

The advisor context can include:
- daily and weekly progress
- subject balance
- consistency trend
- strongest recent study window
- recent session duration/interruption/checklist metrics
- active deadline goals and their deterministic progress

Session-note text is still excluded from the model payload.

Gemini 3.8 Flash is the default model. Sampling parameters such as `temperature` are intentionally omitted because the current Gemini 3.8 migration guidance requires removing deprecated sampling parameters for this model.


The context also includes deterministic 7-day, 30-day, and 90-day summaries (minutes, sessions, active days, average session length, interruptions, and top subject) so the model can distinguish short-term noise from longer study patterns.


## Safety and cost guardrails

The Edge Function now treats all study fact strings as untrusted data, caps request/context size, validates the model's returned subject against the supplied subject IDs, derives the returned subject name from trusted context, clamps action duration to 10–120 minutes, and limits response field sizes. These checks reduce prompt-injection surface and prevent unexpectedly large provider requests.

Before enabling Gemini for a public release, configure provider-side quotas/budgets and add a per-user rate limit if FOCUS will be opened beyond a small trusted user group.
