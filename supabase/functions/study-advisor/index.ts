import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods':
    'POST, OPTIONS',
}

type AdvisorRequest = {
  question?: unknown
  context?: unknown
}

function json(
  body: unknown,
  status = 200,
) {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type':
          'application/json',
      },
    },
  )
}

Deno.serve(async (request) => {
  if (
    request.method === 'OPTIONS'
  ) {
    return new Response(
      'ok',
      {
        headers:
          corsHeaders,
      },
    )
  }

  if (
    request.method !== 'POST'
  ) {
    return json(
      {
        error:
          'Method not allowed',
      },
      405,
    )
  }

  const apiKey =
    Deno.env.get(
      'GEMINI_API_KEY',
    )

  if (!apiKey) {
    return json(
      {
        error:
          'AI provider is not configured.',
      },
      503,
    )
  }

  let body: AdvisorRequest

  try {
    body =
      await request.json()
  } catch {
    return json(
      {
        error:
          'Invalid JSON body.',
      },
      400,
    )
  }

  const question =
    typeof body.question ===
    'string'
      ? body.question
          .trim()
          .slice(0, 500)
      : ''

  if (
    !question ||
    !body.context ||
    typeof body.context !==
      'object'
  ) {
    return json(
      {
        error:
          'Question and context are required.',
      },
      400,
    )
  }

  const model =
    Deno.env.get(
      'GEMINI_MODEL',
    ) ||
    'gemini-3.8-flash'

  const systemInstruction =
    [
      'You are FOCUS Study Advisor.',
      'The supplied JSON facts are authoritative.',
      'Never invent study statistics, subjects, goals, or history.',
      'Separate observation from interpretation from recommendation.',
      'Be concise, calm, practical, and specific.',
      'Recommend one next action only.',
      'Action subjectId must be one of the supplied subject IDs, or null.',
      'Action duration must be between 10 and 120 minutes.',
      'Do not provide generic motivational filler.',
    ].join(' ')

  const prompt = JSON.stringify(
    {
      question,
      facts:
        body.context,
    },
  )

  const response =
    await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/json',
        },
        body: JSON.stringify(
          {
            systemInstruction: {
              parts: [
                {
                  text:
                    systemInstruction,
                },
              ],
            },
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text:
                      prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.25,
              responseMimeType:
                'application/json',
              responseSchema: {
                type: 'OBJECT',
                required: [
                  'headline',
                  'answer',
                  'reasons',
                  'confidence',
                  'action',
                ],
                properties: {
                  headline: {
                    type: 'STRING',
                  },
                  answer: {
                    type: 'STRING',
                  },
                  reasons: {
                    type: 'ARRAY',
                    items: {
                      type: 'STRING',
                    },
                  },
                  confidence: {
                    type: 'STRING',
                    enum: [
                      'high',
                      'medium',
                      'low',
                    ],
                  },
                  action: {
                    type: 'OBJECT',
                    required: [
                      'subjectId',
                      'subjectName',
                      'minutes',
                    ],
                    properties: {
                      subjectId: {
                        type: [
                          'STRING',
                          'NULL',
                        ],
                      },
                      subjectName: {
                        type: [
                          'STRING',
                          'NULL',
                        ],
                      },
                      minutes: {
                        type:
                          'INTEGER',
                      },
                    },
                  },
                },
              },
            },
          },
        ),
      },
    )

  if (!response.ok) {
    const providerText =
      await response.text()

    console.error(
      'Gemini advisor error:',
      response.status,
      providerText.slice(
        0,
        500,
      ),
    )

    return json(
      {
        error:
          'AI provider request failed.',
      },
      502,
    )
  }

  const providerData =
    await response.json()

  const text =
    providerData
      ?.candidates?.[0]
      ?.content?.parts?.[0]
      ?.text

  if (
    typeof text !== 'string'
  ) {
    return json(
      {
        error:
          'AI provider returned no answer.',
      },
      502,
    )
  }

  try {
    const result =
      JSON.parse(text)

    return json(result)
  } catch {
    return json(
      {
        error:
          'AI provider returned invalid structured output.',
      },
      502,
    )
  }
})
