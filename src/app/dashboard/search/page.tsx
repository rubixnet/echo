"use client";

import { useState } from "react";
import { Search, Play, Clock, MoreHorizontal, ArrowUpRight } from "lucide-react";

export default function SearchPage() {
  const [query, setQuery] = useState("");

  const categories = [
    { title: "Indie Pop", tracks: "124k tracks", bg: "bg-neutral-900 text-white" },
    { title: "Late Night Focus", tracks: "85k tracks", bg: "bg-neutral-100 text-neutral-900 border border-neutral-200" },
    { title: "Electronic Sync", tracks: "210k tracks", bg: "bg-emerald-50 text-emerald-900 border border-emerald-200/60" },
    { title: "Melancholy", tracks: "43k tracks", bg: "bg-neutral-900 text-white" },
  ];

  const mockResults = [
    { title: "We fell in love in october", artist: "girl in red", album: "if i could make it go quiet", duration: "3:04" },
    { title: "Bad Idea!", artist: "girl in red", album: "chapter 2", duration: "3:39" },
    { title: "Serotonin", artist: "girl in red", album: "if i could make it go quiet", duration: "3:02" },
  ];

  return (
    <div className="p-8 md:p-12 pb-32 max-w-7xl w-full mx-auto">
      <div className="relative mb-10 max-w-2xl">
        <Search className="absolute left-4 top-3.5 h-5 w-5 text-neutral-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search songs, artists, or live jam rooms..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full h-12 pl-12 pr-4 bg-neutral-100/80 focus:bg-white border border-neutral-200/50 focus:border-neutral-300 rounded-2xl text-sm font-medium text-neutral-900 placeholder-neutral-400 outline-none transition-all shadow-inner shadow-neutral-100"
        />
      </div>


      {!query ? (
        <div>
          <h3 className="text-lg font-black text-neutral-900 mb-6 tracking-tight">Browse Categories</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((cat, i) => (
              <div key={i} className={`p-6 rounded-2xl flex flex-col justify-between aspect-[4/3] relative overflow-hidden group cursor-pointer shadow-sm ${cat.bg}`}>
                <div>
                  <h4 className="font-extrabold text-lg tracking-tight mb-1">{cat.title}</h4>
                  <p className="text-xs font-medium opacity-70">{cat.tracks}</p>
                </div>
                <div className="flex justify-end">
                  <span className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ArrowUpRight size={16} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <h3 className="text-lg font-black text-neutral-900 mb-6 tracking-tight">Search Results</h3>
          <div className="bg-white rounded-2xl border border-neutral-200/50 overflow-hidden shadow-sm">
            <div className="grid grid-cols-12 px-6 py-3 border-b border-neutral-100 text-xs font-bold text-neutral-400 uppercase tracking-wider">
              <div className="col-span-6">Title</div>
              <div className="col-span-5">Album</div>
              <div className="col-span-1 text-right"><Clock size={14} className="inline-block" /></div>
            </div>
            <div className="divide-y divide-neutral-50">
              {mockResults.map((track, idx) => (
                <div key={idx} className="grid grid-cols-12 px-6 py-4 items-center hover:bg-neutral-50/80 group cursor-pointer transition-colors">
                  <div className="col-span-6 flex items-center gap-4">
                    <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center relative overflow-hidden shrink-0">
                      <div className="absolute inset-0 bg-neutral-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Play size={14} fill="currentColor" className="text-white ml-0.5" />
                      </div>
                      <span className="text-xs font-bold text-neutral-400 group-hover:opacity-0">{idx + 1}</span>
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-bold text-neutral-900 truncate">{track.title}</p>
                      <p className="text-xs font-medium text-neutral-500 truncate">{track.artist}</p>
                    </div>
                  </div>
                  <div className="col-span-5 text-sm font-medium text-neutral-500 truncate pr-4">{track.album}</div>
                  <div className="col-span-1 flex items-center justify-end gap-4 text-right">
                    <span className="text-xs font-bold text-neutral-400 font-mono">{track.duration}</span>
                    <button className="text-neutral-400 hover:text-neutral-900 opacity-0 group-hover:opacity-100 transition-all">
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}