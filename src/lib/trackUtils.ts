export function cleanYoutubeTitle(rawTitle: string, channelName: string) {
    let clean = rawTitle;

    clean = clean.replace(/\[.*?\]|\(.*?\)/g, '');

    if (clean.includes('-')) {
        const parts = clean.split('-')

        clean = parts.slice(1).join('-').trim()

        return clean || rawTitle
    }
}