# JourNote𓂃🖊 | CS Girlies Annual Hackathon - Technology For Wellness

JourNote is a journaling web app that turns emotional vents into organized, actionable notes.

Built for **CS Girlies Annual Hackathon - Technology For Wellness** as a solo project and submission under Wellness Track and Best Use of AI Track.

## What does it do?

You write a journal entry like normal and the AI sorts it into 3 cognitive structure:

- 🌱 **Today** : things within your control you could act on right now
- ☁️ **Let go** : things genuinely outside your control, named so you can release them
- 🕰️ **Revisit** : real, important thoughts that don't need solving today

It also generates a **personal affirmation** written specifically to an entry and not just a generic motivational quote, but something that reflects what you actually shared. If it doesn't suit to your liking, you can generate it again from a different angle.

Thoughts in the Revisit pile **resurface automatically after 3 days**. The app shows you one at a time and asks: are you ready to act on it, let it go, or set it aside again?

If an entry contains signs of mental health crisis, the app surfaces a **crisis care card** with direct link to an 24-hour helpline.

## What inspired it?
I grew up journaling a lot. Let it be in notebooks, apps, on a scraps of paper, you name it. But I kept running into the same wall: I'd finish an entry and still feel just as heavy as when I started. Even after expressing everything, nothing was untangled. The thoughts were all still there, just on paper instead of my mind for a bit.
Journaling is widely recommended for mental wellness, and it genuinely help, but no one tells you what to do with what you wrote after. The blank page is only half the problem. The harder part is knowing what each thought is actually asking of you. Which ones need action? Which ones you're holding onto for no reason? Which ones are real and important but just not today's problem?
Hence, with those in mind, I had an idea to make JourNote. A web app that you shouldn't need a therapist of a perfect mindset to sort through your thoughts. With just a little structure, and something that meets you where you are, JourNote helps rewriting your journal entry into something cleaner, or telling you how to feel about it in a gentler way, without judging the mess.
With the collaboration of AI, it doesn't give advice, nor does it diagnose. It just reads what you wrote and organises it using your own words, so you can see it more clearly than you could when it was all tangled inside.

## What technology did I use?
| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| AI | Google Gemini 3.5 Flash (free tier), Claude Sonnet|
| Local server | Browser local server |
| Storage | Browser localStorage |

No frameworks. No build step. No database. No accounts.

## AI Model

**Google Gemini 3.5 Flash**

| Detail | Value |
|---|---|
| Provider | Google AI Studio |
| Tier | Free |
| Rate limit | 15 requests / minute, 1,500 requests / day |
| API | Gemini REST API (`generativelanguage.googleapis.com`) |
| Frameworks | None (raw REST API calls only) |

---

## How AI is used

The AI is called in exactly two situations:

**1. Sorting the journal entry**
When the user clicks "I'm done", their full entry is sent to Gemini with a system prompt that instructs it to return a structured JSON object with five fields: `today`, `letGo`, `revisit`, `affirmation`, and `concern`.

**2. Regenerating the affirmation**
If the user clicks "This doesn't feel right", the original entry and the missed affirmation are sent back and Gemini tries again from a different angle.

That is the entire scope of AI use in this project.

## The prompt
This is the full system prompt used for sorting:

```
You are the sorting engine inside a journaling app called JourNote.
Someone has just written a vent. Do NOT give advice, do NOT diagnose,
do NOT open with sympathy. Your job is to SORT what they wrote, using
their own words where you can, and then write one affirmation.

Return ONLY a valid JSON object matching this schema:
{"today":["..."],"letGo":["..."],"revisit":["..."],"affirmation":"...","concern":false}

Rules:
- "today": up to 3. Things inside their control that could plausibly
  be done today. Concrete. Start with a verb.
- "letGo": 2-3. Things genuinely outside their control: other people's
  opinions, the past, decisions already made by someone else, outcomes
  not yet decided. Name the thing itself, do not phrase it as an
  instruction.
- "revisit": 1-3. Real, important things that do not need solving
  today: big decisions, unresolved feelings, conversations that need
  more time.
- Every item: one line, max 12 words, second person, plain language,
  no therapy jargon.
- Never invent details they did not write. If they wrote very little,
  return fewer items rather than padding.
- "affirmation": 1-2 sentences, max 25 words, written as if THEY
  wrote it to themselves about this specific entry. No "you've got
  this", no "everything happens for a reason", no exclamation marks,
  no emoji.
- "concern": true only if they describe wanting to hurt themselves or
  end their life. Otherwise false.
```

Simply, the prompt explicitly instructs the model to:
### sort and not prescribe
### name what was written, not what it means
### use the user's own words wherever possible, so nothing feels fabricated
### flags crisis language if entry contains signs of self-harm or suicidal ideation , `concern: true` is returned and the care card is shown before going to sorting again

The affirmation is constrained to 25 words max, written in first person as if the user wrote it to themselves, with no clichés, no exclamation marks, and no emoji.

## What the AI does not do
- ✗ Does not store anything between sessions
- ✗ Does not learn from previous entries
- ✗ Does not build a psychological profile
- ✗ Does not predict mood or suggest patterns
- ✗ Does not recommend resources, therapists, or techniques
- ✗ Does not respond conversationally
- ✗ Does not have a persona or a name

Every one of these was a deliberate choice. The moment the AI starts offering more than sorting and one affirmation, it starts positioning itself as a mental health tool, which it is not, and should not claim to be. The restraint is the design.
---
## Getting started locally

### Requirements

- A Gemini API key (https://aistudio.google.com/app/apikey)

### Setup

1. Clone or download this repository
2. Make sure all four files are in the same folder:
   ```
   journote/
   ├── journote.html
   ├── index.js
   ├── styles.css
   └── server.js
   ```
3. Run the code using live browser extension on Visual Studio Code
4. Enter Gemini API key in Setup & Demo drawer on the first screen (should be at the bottom on the journal page)

## Privacy

-All journal data is stored in 'localStorage' in your own browser
-Nothing is sent to any server except Gemini API call (journal entry text)
-Google's data handling is governed by the [Gemini API Terms of Service](https://ai.google.dev/gemini-api/terms)
- No analytics, no tracking, no accounts
  
## Crisis Support

If you or someone you know is struggling:
- **Malaysia** — Befrienders KL: **+603-76272929** (24 hours)
- **International** — [findahelpline.com](https://findahelpline.com)

## Liscense

MIT

 ## Contributor
*Built solo within 48 hours for the CS Girlies Annual Hackathon - Technology For Wellness.*

