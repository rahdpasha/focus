# FOCUS League Celebration — Final Test Checklist

Use this checklist on the PR preview before merging PR #8.

## Champion announcement
- Previous week's winner is announced to every signed-in League user.
- Winner sees the stronger personal congratulations message.
- Losing/challenging users see the new-week motivation message.
- Winning points and focused time match the previous week's leaderboard.
- Tied winners render without breaking the banner.

## Championship history
- Weekly winner receives one permanent crown title.
- Crown count remains attached after changing the public display name.
- Consecutive wins show Back-to-back Champion and 3× League Champion correctly.
- Crown tiers render correctly:
  - 1–2 League Champion
  - 3–4 Proven Champion
  - 5–9 Elite Champion
  - 10+ Legendary Champion
- Hall of Champions orders users by total weekly titles.
- Recent title history shows the correct winner, week, and points.

## Current competition
- Defending Champion badge appears only for the previous week's winner(s).
- Live Title Race shows the current weekly top three.
- “If the week ended now” does not imply the week is already final.
- Point gaps match the current weekly leaderboard.
- Champion Profile shows title count, tier, last title, and next milestone.

## Season leaderboard
- Season uses the current three-month quarter.
- Top five season standings match saved League scores.
- Current user rank is correct.
- Scored days and focused time are correct.
- Gap to the season leader is correct.

## Responsive / visual
- Desktop: no overlapping cards, clipped text, or horizontal overflow.
- Mobile: champion banner, title race, season board, champion profile, and hall remain readable.
- English and Sorani both fit without broken alignment.
- Black, White, Soft Light, and other supported themes remain legible.
- Crown/trophy icons remain visible with sufficient contrast.

## Data safety
- No study session, subject, profile score, or historical user data is modified by opening the League page.
- League history and season functions are read-only for authenticated users.
- Existing weekly and monthly leaderboard behavior remains unchanged.

## Final release gate
- GitHub Quality passes on the final head commit.
- Preview smoke test passes on desktop and mobile.
- PR #8 stays draft/unmerged until the visual smoke test is approved.
