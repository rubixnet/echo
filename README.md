- hover effect to shrink the cover url bit when the user scrolls and show the name beside it! 
- work on my library, adding songs to the library, liked music, add to playlist option. 
- show playlists in library, option to create new playlist in library, 

- searching from history should updaet teh search at, and add cleara history back again


- remember the state of sidebar! 

- live rooms will be removed if host closes the room, leaves the site, if offline, and if host starts another room. 
- fix need for the bug here, bug not good closes the room automatically in between if we stop sonog

- updated music player with menu, like button, save to library etc.! 
- use users avatar


- swipe option to swipe song back and forth on mobile mini player. 
- song playing from which playlist, (if from playlist / library) keep index of it and then show up the following 4 to 5 songs in it. (rather than loading up the full playlist!) 

- to save the users playlists info in site's local storage (so that is loads instantly on refresh as well )

- only music video 

- responsive on mobile, recommendation algorithm,

- option to loop song, one at a time, shuffle, repeat, random play order. 
- option to connect and check what song are my friends listening to. 

- fixing player ons mall screen, introducing being screen play of song to show title, artist, cover, duration and play and other options for mobile or desktop. adding lycrics options, songs options and more stuff. 

- play a song automatically 

- now liking song works, metadata is only passed from the search page, no other page shares it like the library and liked and homepage. 

- we have same home page recommendations for everyone.
- later share playlists option with friends, import playlists and more

- revamping sidebar, adding playlist and forming queues with songs on search page and from library as well. 
- also adding songs to playlist and likes from the search page. 

- make info consistent, playlist name in bold, description in sub bold and count in uppercase nujmber bad!

- option to control audioplayer with keyboard keys.

- fix scroll if the user moves with arrow keys scroll below as well! 

Because your architecture uses Convex for the database and real-time state, your deployment strategy is actually incredibly streamlined. You don't have to worry about hosting or scaling a database on your Oracle server — Convex handles all the heavy lifting for the multiplayer room sync.Your Oracle server only has one job: Host the Next.js frontend and run the heavy Node.js API routes that proxy the audio.Here is the exact blueprint for deploying this stack to an Oracle Cloud VPS.1.Provision the Oracle Instance:Ubuntu ARM Ampere A1.When you create the instance in Oracle Cloud, select the Always Free Ampere A1 Compute shape. Max it out with 4 OCPUs and 24GB of RAM. Choose Ubuntu as the operating system.Critical: You must configure the Oracle Virtual Cloud Network (VCN) Ingress Rules to open ports 80 (HTTP) and 443 (HTTPS) so the outside world can reach your app.2.Install Server Dependencies:Node, Git, and yt-dlp.SSH into your new server and install the core environment. If you decided to keep yt-dlp instead of pure JS, install it here.Bash# Update packages
sudo apt update && sudo apt upgrade -y

# Install Node.js (v20)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git

# Optional: Install yt-dlp (if you kept the child_process route)
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp
3.Clone and Build Your Next.js App:Pull your code from GitHub and build the production version of the app.Bashgit clone https://github.com/yourusername/your-repo.git
cd your-repo

# Add your Convex and YouTube API keys
nano .env.local 

npm install
npm run build
4.Keep It Alive with PM2:Process Management.If your server reboots or the Next.js process crashes, it needs to restart automatically. PM2 is the industry standard for this.Bashsudo npm install -g pm2

# Start the Next.js production server
pm2 start npm --name "music-app" -- start

# Tell PM2 to start on server boot
pm2 startup
pm2 save
Your app is now running on http://localhost:3000 internally.5.Expose to the Web with Caddy:Automatic SSL/HTTPS.You need a reverse proxy to route internet traffic (Port 80/443) to your Next.js app (Port 3000). While Nginx is common, Caddy is much better because it automatically provisions and renews free SSL certificates via Let's Encrypt with zero configuration.Bash# Install Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy

# Configure Caddy
sudo nano /etc/caddy/Caddyfile
Replace everything in the Caddyfile with this block (swap in your actual domain):Plaintextyourdomain.com {
    reverse_proxy localhost:3000
}
Restart Caddy (sudo systemctl restart caddy) and point your domain's DNS A-record to the Oracle server's public IP.The Developer WorkflowOnce this is set up, your update process is incredibly simple. When you push new code to GitHub, you just SSH in and run:git pullnpm run buildpm2 restart music-appThis setup completely bypasses Vercel's timeouts, gives you massive bandwidth for streaming, handles the intense CPU load of proxying byte chunks, and ensures Convex can seamlessly handle all the real-time multiplayer room logic.