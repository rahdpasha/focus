const DIGIT_MAP: Record<string, string> = {
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9',
  '۰': '0',
  '۱': '1',
  '۲': '2',
  '۳': '3',
  '۴': '4',
  '۵': '5',
  '۶': '6',
  '۷': '7',
  '۸': '8',
  '۹': '9',
}

function normalizeDigits(
  text: string,
): string {
  return Array.from(text)
    .map(
      (character) =>
        DIGIT_MAP[
          character
        ] ?? character,
    )
    .join('')
}

function clampBudget(
  minutes: number,
): number | undefined {
  if (
    !Number.isFinite(minutes) ||
    minutes <= 0
  ) {
    return undefined
  }

  return Math.max(
    10,
    Math.min(
      240,
      Math.round(minutes),
    ),
  )
}

export function extractStudyTimeBudget(
  question: string,
): number | undefined {
  const normalized =
    normalizeDigits(
      question,
    ).toLowerCase()

  const hourMatch =
    normalized.match(
      /(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|hr|h|کاتژمێر)/,
    )

  const minuteMatch =
    normalized.match(
      /(\d+)\s*(?:minutes?|mins?|min|m|خولەک)/,
    )

  if (
    hourMatch &&
    minuteMatch
  ) {
    return clampBudget(
      Number(
        hourMatch[1],
      ) *
        60 +
        Number(
          minuteMatch[1],
        ),
    )
  }

  if (hourMatch) {
    return clampBudget(
      Number(
        hourMatch[1],
      ) * 60,
    )
  }

  if (minuteMatch) {
    return clampBudget(
      Number(
        minuteMatch[1],
      ),
    )
  }

  return undefined
}
