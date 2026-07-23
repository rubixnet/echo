"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@/hooks/useUser";
import { Search as SearchIcon, History, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { LiquidContainer } from "@/components/LiquidUI/LiquidContainer";
import { LiquidPanel } from "@/components/LiquidUI/LiquidPanel";
import Sidebar  from "@/components/Sidebar";

export default function DashboardPage() {
  const user = useUser();
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const { theme, setTheme } = useTheme();

  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showHistoryPopover, setShowHistoryPopover] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const clearSearchHistory = useMutation(api.search.clearSearchHistory);
  const saveSearch = useMutation(api.search.saveSearch);
  const searchHistory = useQuery(api.search.getRecent, user?._id ? { userId: user._id } : "skip");

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSuggestions([]);
      setSelectedIndex(-1);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(`/api/youtube/suggest?q=${encodeURIComponent(searchTerm)}`);
        const data = await res.json();
        setSuggestions(data);
      } catch (err) {
        console.error(err);
      }
    }, 150);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowHistoryPopover(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const saveSearchQuery = async (query: string) => {
    if (user?._id) {
      await saveSearch({ userId: user._id, searchQuery: query });
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent, directQuery?: string) => {
    e?.preventDefault();
    const finalQuery = directQuery || searchTerm;
    if (!finalQuery.trim()) return;

    setSearchTerm(finalQuery);
    saveSearchQuery(finalQuery);

    setShowHistoryPopover(false);
    searchInputRef.current?.blur();

    router.push(`/dashboard/search?q=${encodeURIComponent(finalQuery)}`);
  };

  const changeTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const combinedList = useMemo(() => {
    const isTyping = searchTerm.trim().length > 0;

    const matchedHistory = isTyping
      ? (searchHistory || []).filter(h => h.searchQuery.toLowerCase().includes(searchTerm.toLowerCase()))
      : (searchHistory || []);

    const historyTextSet = new Set(matchedHistory.map(h => h.searchQuery.toLowerCase()));
    const filteredSuggestions = isTyping
      ? suggestions.filter(s => !historyTextSet.has(s.toLowerCase()))
      : [];

    return [
      ...matchedHistory.map(h => ({ text: h.searchQuery, type: "history", id: h._id })),
      ...filteredSuggestions.map(s => ({ text: s, type: "suggestion", id: s }))
    ];
  }, [searchTerm, searchHistory, suggestions]);

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    const listLength = combinedList.length;
    if (!showHistoryPopover || listLength === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev < listLength - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev > -1 ? prev - 1 : -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSearchSubmit(e as any, combinedList[selectedIndex].text);
    } else if (e.key === "Escape") {
      setShowHistoryPopover(false);
      searchInputRef.current?.blur();
    }
  };

  return (
    <section className="relative p-2 max-w-2xl mx-auto space-y-12 pb-32 text-foreground antialiased z-40">
      
    </section>
  );
}