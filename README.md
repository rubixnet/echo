# Echo - experimental music player

### Note: this is for educational purposes only
Echo is an experimental music streaming platform which i make to learn live and music streaming along with some stuff, this project is for educational purpose

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

