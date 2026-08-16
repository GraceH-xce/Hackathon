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

## How the AI works

The prompt explicitly instructs the model to:
-Sort and not prescribe
-It names what was written, not what it means
-Use the user's own words wherever possible, so nothing feels fabricated
-Flags crisis language if entry contains signs of self-harm or suicidal ideation , `concern: true` is returned and the care card is shown before going to sorting again

The affirmation is constrained to 25 words max, written in first person as if the user wrote it to themselves, with no clichés, no exclamation marks, and no emoji.

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

*Built solo within 48 hours for the CS Girlies Annual Hackathon - Technology For Wellness.**

