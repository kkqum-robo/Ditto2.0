# ditto — same here

**A safe, anonymous space for people dealing with addiction, trauma, stigma, and anything they feel they can't say out loud.**

Ditto means *same here*. The loneliest part of struggling is believing no one else feels this way. Ditto lets people find out they're not alone, without anyone knowing who they are.

> Prototype built for a hackathon. Ditto is not therapy and not a replacement for professional help or emergency services.

---

## The problem

Many people stay silent about addiction, mental health, or who they love because they fear being judged. Existing social apps reward performance. Clinical tools feel cold. Ditto is built to feel like a warm place to land.

## What it does

- **Incognito by default.** One tap switches to a random alias with a friendly cartoon avatar. No face, no real name.
- **Feed.** People share small wins and hard moments. Posts that mention sensitive topics are blurred first, with a "View anyway" option, so nobody is surprised.
- **Reactions that mean something.** *Proud*, *Stay strong*, and *Inspired* instead of likes.
- **Horizon.** Milestone-only posts (for example *1 Year Free*) that unlock as your journey days grow.
- **Mood board.** 16 moods. Pick how you feel, then find people feeling the same in **Allies**. Moods also show as emoji next to names in Chat.
- **Allies.** Peers, doctors, and rehab centres you can message (demo profiles for now).
- **Chat.** Private conversations with simulated replies for the demo.
- **Skylight.** Every small step (checking in, posting, encouraging someone, taking a breath) lights a star in your own night sky.

### Calm Space (for panic moments, any time of day)

A floating **Calm** button is always one tap away. It also opens automatically when someone types panic or crisis words in chat, a post, or a comment.

1. **It asks what helps:** a sound (rain, ocean, soft hum, silence) and the words you want to hear, or your own.
2. **It breathes with you:** a guided circle (4 seconds in, 6 out) with ambient sound and a voice affirmation. After 9 pm it opens in night mode.
3. **It checks in:** *A little calmer*, *About the same*, or *Still struggling*. The last one shows the support card with a helpline.

The voice comes from an **ElevenLabs** recording. If the recording file is missing, it falls back to live ElevenLabs (if a key is set), then to the browser's built-in voice, so it never fails silently.

### Safety by design

- Crisis and panic words in posts, comments, and chat trigger the support card (Tele-MANAS **14416** and local emergency numbers) and Calm Space.
- A message that triggers the crisis check is not shown to other users as a reaction to it.
- Sensitive posts are blurred by default.
- Everything is anonymous by design: no phone number, no email, no real name.

## How it's built

- React + TypeScript (Vite), single-page app, no backend yet
- Plain CSS, original SVG cartoon avatars (no copyrighted characters)
- Web Audio API for ambient sound, so no music files are needed
- ElevenLabs text-to-speech for the voice affirmation
- Built in Bolt.new

## Run it

```bash
git clone https://github.com/kkqum-robo/Ditto.git
cd Ditto
npm install
npm run dev
```

Then open the local link it prints.

### Files that go in `public/`

| File | Purpose |
| --- | --- |
| `affirmation.mp3` | Your ElevenLabs recording (the "You matter" option) |
| `calm.mp3` | Optional recording for "You are safe right now" |
| `pride.jpg`, `field.jpg`, `hands.jpg`, `hike.jpg`, `tree.jpg`, `beach.jpg` | Demo post pictures |

If an audio file is missing, the app uses a fallback voice instead.



## Honest limitations

- Chat replies are **simulated** for the demo.
- Crisis detection is **keyword-based**, not a model. It will miss some cases and catch some harmless ones.
- Doctors and rehab centres are **fictional demo profiles**.
- Nothing is saved after a refresh yet.
- Demo pictures should be replaced with licensed images before any public launch.

## What's next

- Replace keyword matching with an open-weight safety classifier (for example Gemma) that runs without sending text to a closed service
- Alerts to a human moderator or volunteer when someone is in crisis
- Verified doctors and rehab partners
- Real accounts and storage with privacy-first defaults
- Hindi and regional-language support

## Credits

- Voice: ElevenLabs


