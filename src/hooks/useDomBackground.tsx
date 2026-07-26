import { useEffect, useRef } from "react";
import { toPng } from "html-to-image"; 

export function useDomBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  const captureBackground = async () => {
    if (!containerRef.current) return;
    try {
      const dataUrl = await toPng(containerRef.current, {
        filter: (node) => !node.classList?.contains("lens-refraction"),
      });
      document.documentElement.style.setProperty("--app-dom-bg", `url('${dataUrl}')`);
    } catch (err) {
      console.error("Failed to capture DOM background:", err);
    }
  };

  useEffect(() => {
    captureBackground();
    window.addEventListener("resize", captureBackground);
    return () => window.removeEventListener("resize", captureBackground);
  }, []);

  return { containerRef, refreshBackground: captureBackground };
}