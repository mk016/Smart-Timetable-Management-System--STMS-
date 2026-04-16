"use client";

import { useEffect } from "react";

export function RevealEffects() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
          }
        });
      },
      { threshold: 0.15 }
    );

    const elements = Array.from(document.querySelectorAll(".reveal"));
    elements.forEach((element) => observer.observe(element));

    const progressBar = document.getElementById("scroll-progress");

    const handleScroll = () => {
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = height <= 0 ? 0 : scrollTop / height;
      if (progressBar) {
        progressBar.style.transform = `scaleX(${progress})`;
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return null;
}
