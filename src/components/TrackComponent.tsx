import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropodown-menu";
import { Play, Pause, Loader2, PlaySquare, ListEnd, ListPlus, Share2, Trash2, Heart, EllipsisVertical } from "lucide-react";
import { useGlobalPlayback } from "@/hooks/useGlobalPlayback";
import { useAudioEngine } from "@/components/AudioProvider";
import { useUser } from "@/hooks/useUser";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { cn } from "@/lib/utils";

interface TrackProps {
  track: any;
  index?: number;
  variant: "grid" | "row";
  loadingId: string | null;
  setLoadingId: (id: string | null) => void;
  onOpenPlaylistModal?: (track: any) => void;
  playlistId?: string;
}

export function Track({
  track,
  index = 0,
  variant,
  loadingId,
  setLoadingId,
  onOpenPlaylistModal,
  playlistId,
}:  TrackProps) {
  const { playTrack, playNextPriority, addToQueue } = useGlobalPlayback();
  const { currentTrackUrl, isPlaying } = useAudioEngine();
  const user = useUser();

  const removeTrackFromPlaylist = useMutation(api.playlists.removeTrack);
  const toggleLikeMutation = useMutation(api.likes.toggleLike);

  const isLiked = useQuery(
    api.tracks.checkLiked,
    user?._id && track?._id ? { userId: user._id, trackId: track._id as any } : "skip"
  );

  if (!track) return null;

  const videoId = track.youtubeId || track.url?.split("?v=")[1] || track.audioUrl?.split("id=")[1] || track.id;
  const coverUrl = track.thumbnail || track.coverUrl || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=256";
  const title = track.title || "Unknown Track";
  const artist = track.uploaderName || track.artist || "Unknown Artist";
  
  const durationStr = typeof track.duration === "number"
    ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, "0")}`
    : track.duration || "0:00";

  const isLoading = loadingId === videoId;
  const isCurrent = currentTrackUrl?.includes(videoId) && isPlaying;

  const handlePlay = () => playTrack(track, setLoadingId);
  const handlePlayNext = () => playNextPriority({ ...track, youtubeId: videoId, coverUrl, title, artist });
  const handleAddToQueue = () => addToQueue({ ...track, youtubeId: videoId, coverUrl, title, artist });

  const handleShare = () => {
    const url = track.url || `https://youtube.com/watch?v=${videoId}`;
    navigator.clipboard.writeText(url);
  };

  const handleLike = async () => {
    if (!user?._id || !track._id) return;
    await toggleLikeMutation({
      userId: user._id as any,
      trackId: track._id as any,
      title,
      artist,
      coverUrl,
      duration: durationStr,
      audioUrl: track.audioUrl || track.url || `/api/youtube/stream?id=${videoId}`,
    });
  };


  const handleRemoveFromPlaylist = async () => {
    if (!playlistId || !track._id) return;
    await removeTrackFromPlaylist({ playlistId: playlistId as any, trackId: track._id });
  };

  const renderMenuItems = (Item: any, Separator: any) => (
    <>
      <Item onClick={(e: any) => { e.stopPropagation(); handlePlayNext(); }} className="gap-3 cursor-pointer rounded-xl font-bold text-neutral-600 text-sm focus:bg-neutral-100 focus:text-neutral-900 py-2.5">
        <PlaySquare size={18} /> Play Next
      </Item>
      
      <Item onClick={handleAddToQueue} className="gap-3 cursor-pointer rounded-xl font-bold text-neutral-600 text-sm focus:bg-neutral-100 focus:text-neutral-900 py-2.5">
        <ListEnd size={18} /> Add to Queue
      </Item>

      <Separator className="my-1.5 bg-neutral-100" />

      <Item
        onClick={(e: any) => { e.stopPropagation(); if (onOpenPlaylistModal) onOpenPlaylistModal(track); }}
        className="gap-3 cursor-pointer rounded-xl font-bold text-neutral-600 text-sm focus:bg-neutral-100 focus:text-neutral-900 py-2.5"
      >
        <ListPlus size={18} /> Add to Playlist...
      </Item>

      {track._id && (
        <Item
          onClick={(e: any) => { e.stopPropagation(); handleLike(); }}
          className={cn(
            "gap-3 cursor-pointer rounded-xl font-bold text-sm py-2.5",
            isLiked ? "text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700" : "text-neutral-600 focus:bg-neutral-100 focus:text-neutral-900"
          )}
        >
          <Heart size={18} className={cn(isLiked && "fill-emerald-600")} />
          {isLiked ? "Remove from Liked Songs" : "Save to Liked Songs"}
        </Item>
      )}

      <Item onClick={(e: any) => { e.stopPropagation(); handleShare(); }} className="gap-3 cursor-pointer rounded-xl font-bold text-neutral-600 text-sm focus:bg-neutral-100 focus:text-neutral-900 py-2.5">
        <Share2 size={18} /> Share Link
      </Item>

      {playlistId && track._id && (
        <>
          <Separator className="my-1.5 bg-neutral-100" />
          <Item
            onClick={handleRemoveFromPlaylist}
            className="gap-3 cursor-pointer rounded-xl font-bold text-rose-600 text-sm focus:bg-rose-50 focus:text-rose-700 py-2.5"
          >
            <Trash2 size={18} /> Remove from this Playlist
          </Item>
        </>
      )}
    </>
  );


  return (
    <ContextMenu> 
      <ContextMenuTrigger asChild>
        {variant === "grid" ? (
          <div onClick={handlePlay} className="group relative flex flex-col gap-3 p-4 rounded-3xl hover:bg-neutral-100/50 transition-all cursor-pointer border border-transparent hover:border-neutral-200/50">
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-neutral-100 shadow-sm">
              <img src={coverUrl} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=256"; }} />
              <div className={cn("absolute inset-0 flex items-center justify-center transition-all duration-300", isCurrent ? "bg-black/40 opacity-100" : "bg-black/0 opacity-0 group-hover:bg-black/20 group-hover:opacity-100")}>
                <div className={cn("w-12 h-12 flex items-center justify-center rounded-full bg-emerald-500 text-white shadow-xl transform transition-transform duration-300", isCurrent || isLoading ? "scale-100" : "scale-75 translate-y-4 group-hover:scale-100 group-hover:translate-y-0")}>
                  {isLoading ? <Loader2 size={24} className="animate-spin" /> : isCurrent ? <Pause size={24} className="fill-white" /> : <Play size={24} className="fill-white ml-1" />}
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h3 className={cn("font-bold text-base truncate tracking-tight flex-1", isCurrent ? "text-emerald-600" : "text-neutral-900")}>{title}</h3>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button onClick={(e) => e.stopPropagation()} className="p-1 -mr-1 text-neutral-400 hover:text-neutral-900 transition-colors">
                      <EllipsisVertical size={16} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 rounded-2xl shadow-xl border-neutral-100 p-1.5 z-[9999]">
                    {renderMenuItems(DropdownMenuItem, DropdownMenuSeparator)}
                  </DropdownMenuContent>
                </DropdownMenu>

              </div>
              <p className="text-sm font-medium text-neutral-500 truncate">{artist}</p>
            </div>
          </div>
        ) : (
          <div onClick={handlePlay} className="flex items-center justify-between py-2.5 group cursor-pointer hover:bg-neutral-100/40 px-2 -mx-2 rounded-xl transition-all">
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              {index > 0 && (
                <span className="w-4 text-xs font-mono font-bold text-neutral-300 group-hover:text-neutral-400 shrink-0 text-center">
                  {index.toString().padStart(2, "0")}
                </span>
              )}
              <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-neutral-200/40 shadow-sm bg-neutral-50 p-0.5">
                <img src={coverUrl} className="w-full h-full object-cover rounded-[10px] select-none" alt={title} onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=256"; }} />
                <div className={cn("absolute inset-0 flex items-center justify-center transition-all duration-200 rounded-xl", isCurrent ? "bg-black/30 opacity-100" : "bg-neutral-950/20 opacity-0 group-hover:opacity-100")}>
                  {isLoading ? <Loader2 size={14} className="text-white animate-spin" /> : isCurrent ? <Pause size={14} className="text-white fill-white" /> : <Play size={14} className="text-white fill-white ml-0.5" />}
                </div>
              </div>
              <div className="min-w-0 flex-1 pr-4">
                <p className={cn("text-sm font-bold truncate tracking-tight leading-snug", isCurrent ? "text-emerald-600" : "text-neutral-900")}>{title}</p>
                <p className="text-xs font-medium text-neutral-400 truncate mt-0.5 leading-none">{artist}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-xs font-mono font-bold text-neutral-400 shrink-0 pr-1 group-hover:text-neutral-600 transition-colors">
                {durationStr}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 text-neutral-400 hover:text-neutral-900 transition-colors p-1">
                    <EllipsisVertical size={14} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 rounded-2xl shadow-xl border-neutral-100 p-1.5 z-[9999]">
                  {renderMenuItems(DropdownMenuItem, DropdownMenuSeparator)}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
      </ContextMenuTrigger>

      <ContextMenuContent className="w-64 rounded-2xl shadow-xl border-neutral-100 p-1.5 z-[9999]">
        {renderMenuItems(ContextMenuItem, ContextMenuSeparator)}
      </ContextMenuContent>
    </ContextMenu>
  );
}