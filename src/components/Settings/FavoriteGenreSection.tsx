import { useUser } from "@/hooks/useUser";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function FavoriteGenresSection() {
  const user = useUser();

  const userData = useQuery(
    api.users.getUserData,
    user?._id ? { userId: user._id } : "skip"
  );

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground">Favorite Genres</h2>

      {userData?.favoriteGenres && userData.favoriteGenres.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {userData.favoriteGenres.map((genre: string, idx: number) => (
            <span
              key={idx}
              className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-medium border border-foreground/10 bg-foreground/[0.03] text-foreground/80 capitalize"
            >
              {genre}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-foreground/40">No favorite genres selected.</p>
      )}
    </div>
  );
}