FROM node:22.23.3-bookworm-slim

ENV NEXT_TELEMETRY_DISABLED=1
ENV PATH="/opt/yt-dlp-venv/bin:${PATH}"

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-venv ffmpeg \
  && python3 -m venv /opt/yt-dlp-venv \
  && /opt/yt-dlp-venv/bin/pip install --no-cache-dir --upgrade yt-dlp \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install --global npm@11.21.0
RUN npm ci

COPY . .

EXPOSE 3001

CMD ["npm", "run", "dev"]
