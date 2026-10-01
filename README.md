# Echo - experimental music player

video demo

https://youtu.be/-PLmuoUYjb0

P.S - added demo songs today if song do not play from youtube to test all the functions that echo has, though all song request for past week has hit 100 percent success rates for song

### Note: this is for educational purposes only

Echo is an experimental music streaming platform which i make to learn live and music streaming along with some stuff, this project is for educational purpose

I got the idea for this project when i play badminton with friend together and play song outside, as sound is low i think if any app which i can use so both play same song together for louder output volume. so this is where the idea come for, the current and from start homepage idea come from tryklack.com/ site which i like and use it here, the login page is same as from the badminton project i have.

For ui of this project all the credit goes to this creator on youtube - https://www.youtube.com/@juxtopposed who redesigned apple music from this video https://www.youtube.com/watch?v=yT_aFozeDc8 and shared a figma link to file as well https://www.figma.com/community/file/1622299389536274468/apple-music-redesign. after this video i decid it better to make a whole music platform and better than apple music as Juxt design new better apple music, it has lot of stuff.

this application uses convex, workos, tailwind, yt dlp, nextjs, hugging face (for lyrics), modal (for backend deployment) and vercel (frontend deployment) 

## running locally

you need node 20.9 or newer, bun, and python if you go with the yt-dlp option.

1. clone the repo and install dependencies

```
git clone https://github.com/rubixnet/echo
cd echo
bun install
```

2. get your workos keys

sign up at [dashboard.workos.com](https://dashboard.workos.com), create an environment, then open the **API Keys** page and copy the **Client ID** (`client_...`) and the **Secret Key** (`sk_...`).

3. connect google sign in (this is the only sign in option on the login page, so you need it to log in at all)

**first grab the redirect uri from workos**

go to **Authentication → OAuth providers → Google → Manage** and copy the **Redirect URI** shown there, it looks like

```
https://api.workos.com/user_management/<YOUR_CLIENT_ID>/oauth/callback
```

**then create the oauth client in google cloud**

1. open the [Google Cloud Console](https://console.cloud.google.com/) and pick a project
2. **APIs & Services → OAuth consent screen**
   - app name anything, user support email yours
   - audience **External**
   - add your own email under **Test users**, only listed accounts can log in while the app is in testing
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**
   - application type **Web application**
   - paste the redirect uri from workos into **Authorized redirect URIs**
   - create it and copy the **Client ID** and **Client secret**

**then paste it back into workos**

open the same google oauth dialog → **Your app's credentials** → paste the client id and secret → **Test Google Redirect URI** → **Save**

> you don't add localhost to google. workos handles the google side, so only workos's own redirect uri goes into google's authorized redirect uris.

4. register your app's redirect uri in workos

go to **Redirects** and add both

```
http://localhost:3001/api/auth/callback
http://127.0.0.1:3001/api/auth/callback
```

> the port is **3001** not 3000, because `dev` runs `next dev -p 3001`. and `localhost` and `127.0.0.1` are different origins so add both. if this isn't registered you just bounce back to `/login` forever.

5. set up convex

create a project at [dashboard.convex.dev](https://dashboard.convex.dev), then put the deployment line in a `.env.local` file in the root

```
# Deployment used by `npx convex dev`
CONVEX_DEPLOYMENT=dev:your-project-name
```

> keep it in `.env.local` and not `.env` because `npx convex dev` reads that file first and rewrites it. don't put a comment on the same line as `CONVEX_DEPLOYMENT`.

then create the deployment, this pushes your schema and writes `NEXT_PUBLIC_CONVEX_URL` for you

```
npx convex dev --once
```

6. create a `.env` file in the root with the following env variables from workos and convex!

```
WORKOS_API_KEY=sk_...
WORKOS_CLIENT_ID=client_...

# signs the session cookie, generate with: openssl rand -base64 48
JWT_SECRET=

# must be 32+ characters
WORKOS_COOKIE_PASSWORD=

# Deployment used by `npx convex dev`
# this one is already in .env.local from step 5, dont copy it here
# CONVEX_DEPLOYMENT=dev:

NEXT_PUBLIC_CONVEX_URL=CLOUD_URL_HERE
NEXT_PUBLIC_CONVEX_SITE_URL=SITE_URL_HERE

STREAM_BACKEND=
```

> `CONVEX_DEPLOYMENT` and the `NEXT_PUBLIC_CONVEX_*` values live in `.env.local` because the convex cli puts them there itself. `.env.local` is read first, so if you keep a copy in `.env` you can end up pointed at a different deployment.

7. set the env variables on the convex deployment

these are read by the convex runtime not by nextjs, so they go here instead of `.env`

```
npx convex env set WORKOS_CLIENT_ID=client_...
npx convex env set WORKOS_API_KEY=sk_...
```

> convex will not deploy without these two, `convex/auth.ts` throws on import without them.

then the two optional ones, `YOUTUBE_API_KEY` for the playlist sync crons and `WORKOS_WEBHOOK_SECRET` for verifying webhook signatures

```
npx convex env set YOUTUBE_API_KEY=AIza...
npx convex env set WORKOS_WEBHOOK_SECRET=whsec_...
```

**where to get the youtube api key** - this one is only for the charts and genres shelves, not for logging in. go to the [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services → Library** → enable **YouTube Data API v3** → **Credentials → Create credentials → API key**. restrict it to YouTube Data API v3, and leave the application restriction on none since the calls run from convex's servers.

> its a different credential from the oauth client in step 3, you need both.

8. you have two options to run this locally one with using modal app url to get music or to use yt dlp.

**option 1: Modal (defaul)**

if you leave `STREAM_BACKEND` unset it defaults to modal, or set it explicitly:

```
STREAM_BACKEND=modal
MODAL_STREAM_URL=https://rubixnet--music-streamer-web-app.modal.run
```

this uses my deployed Modal runner instance to extract the stream URLs. downside: if you get ratelimited on my runner instance, playback can fail. also `streamer.py` only has `/health`, `/audio` and `/stream`, so the `/search` and `/playlist` fallbacks in the api routes point at endpoints that dont exist there and rely on the `ytmusic-api` path working first.

### 

**option 2: yt-dlp (fully local, uses your own machine)**

if you don't want to use my runner instance or you get ratelimited, run everything through yt-dlp on your own machine. 

**install python + yt-dlp (must be on your PATH):**

```
pip install -U "yt-dlp[default]"
```

then set in `.env`:

```
STREAM_BACKEND=ytdlp
```

in this mode the nextjs api routes use yt-dlp directly:
- `src/app/api/youtube/stream/route.ts` extracts the direct audio URL with `yt-dlp -g` and proxies the audio (with range + 403 retry caching)
- `src/app/api/youtube/search/route.ts` falls back to `yt-dlp -j "ytsearch..."` when ytmusic fails
- `src/app/api/youtube/playlist/route.ts` extracts playlists locally with `--flat-playlist`

> note: keep yt-dlp up to date (`yt-dlp -U`) since youtube breaks older versions often. you can switch between the two options anytime by just changing `STREAM_BACKEND` and restarting the app.

9. start the app

```
bun run dev
```

then open http://localhost:3001 and log in with google. first login lands you on `/onboarding`, after that it's `/dashboard`.

10. if you are using convex, also run `npx convex dev` in a second terminal to keep the database synced.



