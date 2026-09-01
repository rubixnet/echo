# Echo - experimental music player

Echo is an experimental music streaming platform which i make to learn live and music streaming along with some stuff, this project is for educational purpose only. 

I got the idea for this project when i play badminton with friend together and play song outside, as sound is low i think if any app which i can use so both play same song together for louder output volume. so this is where the idea come for, the current and from start homepage idea come from tryklack.com/ site which i like and use it here, the login page is same as from the badminton project i have. 

For ui of this project all the credit goes to this creator on youtube - https://www.youtube.com/@juxtopposed who redesigned apple music from this video https://www.youtube.com/watch?v=yT_aFozeDc8 and shared a figma link to file as well https://www.figma.com/community/file/1622299389536274468/apple-music-redesign. after this video i decid it better to make a whole music platform and better than apple music as Juxt design new better apple music, it has lot of stuff. 

this application uses convex, workos, tailwind, yt dlp, nextjs, hugging face (for lyrics), modal (for backend deployment) and vercel (frontend deployment) 

to run this application locally clone the repo first 
```
git clone https://github.com/rubixnet/echo
```
then run 
```
bun install
```
this will install all the related files.

you can also install yt dlp if you don't want to get the music files from my runner instance or if you get ratelimited! 
```
pip install yt-dlp
```

after this you will need the following env variables from workos and convex! 

```
WORKOS_API_KEY=
WORKOS_CLIENT_ID=
WORKOS_COOKIE_PASSWORD=
JWT_SECRET=

# Deployment used by `npx convex dev`
you get this by signing up on convex or you can also choose to run convex locally without this variables! 
CONVEX_DEPLOYMENT=dev: #followed by your project path 

NEXT_PUBLIC_CONVEX_URL=CLOUD_URL_HERE

NEXT_PUBLIC_CONVEX_SITE=SITE_URL_HERE
```

you will need to change the below files to how are they present at the link! 
- adding this a bit after commiting please wait! 


later! 
- personalized home page ?
- creating users mix playlist as well
- setting up lyrics
- adding cron job to update yt dlp
- playlists covers, mix playlist, text on top of playlist covers etc 
- browser or yt dlp script to get the playlist songs and info from browser itself!
- fix algo more! 
- create og image for that particular song with particular link for that use. 
- make buttons consistent
- adding popups
- on close test play mobile, onboarding page.
- update playing from source in desktop drawer and mobile drawer
- testing swipe and sliding down the player on mobile! 
- increase surface area of buttons / menus or stuff on mobile like track component dot menu,
- bad looking focus ring color for global player / dark mode
- consistent text inside inputs
- loop shuffle work 
- sidebar scroll 
- onboarding smooth and blur in out like elvenlabs, crafted images for the genre section
- bentos for further
- slowly animating or opacity for the bentos!
- onboarding of user like drawn ui!
- controls bento grid for the user, showing navbar options, track component grid ui idea figma
- simple change or layout animation for expanded friends profile! 
