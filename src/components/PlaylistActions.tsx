"use client";

import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@/hooks/useUser";
import {
  Pin,
  PenLine,
  X,
} from "@/components/icons";
import {
  Trash2,
  Loader2,
  Globe,
  Lock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Doc } from "../../convex/_generated/dataModel";
import { LiquidPanel } from "@/components/LiquidUI/LiquidPanel";
import { LiquidContainer } from "@/components/LiquidUI/LiquidContainer";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

type PlaylistSummary = Doc<"playlists"> & { coverUrl?: string | null };

export function usePlaylistActions(
  playlist: PlaylistSummary | null | undefined,
  options?: { onDeleteSuccess?: () => void },
) {
  const user = useUser();
  const [isPending, setIsPending] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editName, setEditName] = useState("");

  const togglePinned = useMutation(api.playlists.togglePinned);
  const togglePrivacy = useMutation(api.playlists.togglePlaylistPrivacy);
  const deletePlaylist = useMutation(api.playlists.deletePlaylist);
  const updatePlaylistName = useMutation(api.playlists.updatePlaylistInfo);

  const handleTogglePin = async () => {
    if (!playlist) return;
    try {
      setIsPending(true);
      await togglePinned({ playlistId: playlist._id });
    } catch (error) {
      console.error("Failed to pin:", error);
    } finally {
      setIsPending(false);
    }
  };

  const handleTogglePrivacy = async () => {
    if (!playlist || !user?._id) return;
    try {
      setIsPending(true);
      await togglePrivacy({ playlistId: playlist._id, userId: user._id });
    } catch (error) {
      console.error("Failed to toggle privacy:", error);
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async () => {
    if (!user?._id || !playlist) return;
    try {
      setIsPending(true);
      await deletePlaylist({ playlistId: playlist._id, userId: user._id });
      setShowDeleteDialog(false);
      if (options?.onDeleteSuccess) options.onDeleteSuccess();
    } catch (error) {
      console.error("Failed to delete:", error);
    } finally {
      setIsPending(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlist) return;
    if (!editName.trim() || editName === playlist.name) return;
    try {
      setIsPending(true);
      await updatePlaylistName({ playlistId: playlist._id, name: editName });
      setShowEditDialog(false);
    } catch (error) {
      console.error("Failed to edit:", error);
    } finally {
      setIsPending(false);
    }
  };

  const openEdit = () => {
    if (playlist) {
      setEditName(playlist.name);
      setShowEditDialog(true);
    }
  };

  const openDelete = () => setShowDeleteDialog(true);

  const modals = (
    <>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete playlist?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{playlist?.name}&quot;? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isPending}
              onClick={(e) => e.stopPropagation()}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showEditDialog && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="absolute inset-0"
            onClick={() => !isPending && setShowEditDialog(false)}
          />
          <div className="relative  w-full max-w-sm overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300">
            <LiquidPanel radius="24px">
              <div className="px-6 pt-6 pb-5">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-foreground/70 bg-foreground/5">
                      <PenLine size={16} strokeWidth={2} />
                    </div>
                    <h3 className="font-semibold text-lg text-foreground tracking-tight">
                      Edit Playlist
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowEditDialog(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-foreground/5 hover:bg-foreground/10 text-foreground/50 hover:text-foreground transition-colors"
                  >
                    <X size={16} strokeWidth={2.5} />
                  </button>
                </div>

                <form
                  onSubmit={handleEditSubmit}
                  className="flex flex-col gap-4"
                >
                  <LiquidContainer radius="12px" className="w-full">
                    <input
                      type="text"
                      placeholder="Playlist name..."
                      value={editName}
                      autoFocus
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 h-11 text-sm font-medium text-foreground focus:outline-none focus:border-foreground/30 transition-colors"
                    />
                  </LiquidContainer>

                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setShowEditDialog(false)}
                      className="h-10 px-5 text-sm font-semibold text-foreground/70 hover:text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                    <LiquidContainer radius="12px">
                      <button
                        type="submit"
                        disabled={
                          !editName.trim() ||
                          isPending ||
                          editName === playlist?.name
                        }
                        className="h-10 px-6 text-sm font-semibold text-primary focus:outline-none disabled:opacity-50 transition-opacity min-w-[120px] flex items-center justify-center"
                      >
                        {isPending ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          "Save Changes"
                        )}
                      </button>
                    </LiquidContainer>
                  </div>
                </form>
              </div>
            </LiquidPanel>
          </div>
        </div>
      )}
    </>
  );

  return {
    isPinned: playlist?.isPinned,
    isPublic: playlist?.isPublic !== false,
    isPending,
    handleTogglePin,
    handleTogglePrivacy,
    openEdit,
    openDelete,
    modals,
  };
}

export function PlaylistContextMenu({
  playlist,
  children,
  onOpenChange,
}: {
  playlist: PlaylistSummary;
  children: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
}) {
  const isMobile = useIsMobile();
  const {
    handleTogglePin,
    handleTogglePrivacy,
    openEdit,
    openDelete,
    modals,
    isPinned,
    isPublic,
    isPending,
  } = usePlaylistActions(playlist);

  return (
    <>
      <DropdownMenu onOpenChange={onOpenChange}>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className={cn(
            "z-[9999]",
            isMobile ? "w-56 p-4 px-4 rounded-2xl" : "w-44 p-1",
          )}
        >
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              handleTogglePin();
            }}
            disabled={isPending}
            className={cn(
              "cursor-pointer focus:bg-foreground/10",
              isMobile
                ? "gap-3 rounded-lg text-[15px] py-2.5 px-3"
                : "gap-2 rounded-md text-[13px] py-1.5 px-2",
            )}
          >
            <Pin
              size={isMobile ? 18 : 14}
              className={isPinned ? "fill-current" : ""}
            />
            <span>{isPinned ? "Unpin Playlist" : "Pin Playlist"}</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              openEdit();
            }}
            disabled={isPending}
            className={cn(
              "cursor-pointer focus:bg-foreground/10",
              isMobile
                ? "gap-3 rounded-lg text-[15px] py-2.5 px-3"
                : "gap-2 rounded-md text-[13px] py-1.5 px-2",
            )}
          >
            <PenLine size={isMobile ? 18 : 14} />
            <span>Edit Name</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              handleTogglePrivacy();
            }}
            disabled={isPending}
            className={cn(
              "cursor-pointer focus:bg-foreground/10",
              isMobile
                ? "gap-3 rounded-lg text-[15px] py-2.5 px-3"
                : "gap-2 rounded-md text-[13px] py-1.5 px-2",
            )}
          >
            {isPublic ? (
              <Lock size={isMobile ? 18 : 14} />
            ) : (
              <Globe size={isMobile ? 18 : 14} />
            )}
            <span>{isPublic ? "Make Private" : "Make Public"}</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator className={isMobile ? "my-1.5" : "my-1"} />

          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              openDelete();
            }}
            disabled={isPending}
            className={cn(
              "cursor-pointer text-primary bg-destructive/20 px-2 focus:bg-destructive/30",
              isMobile
                ? "gap-3 rounded-lg text-[15px] py-2.5 px-3"
                : "gap-2 rounded-md text-[13px] py-1.5 px-2",
            )}
          >
            <Trash2 size={isMobile ? 18 : 14} />
            <span>Delete Playlist</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {modals}
    </>
  );
}
