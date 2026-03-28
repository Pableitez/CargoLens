import { useEffect, useRef } from "react";

// Entrada al viewport (una vez); respeta prefers-reduced-motion por CSS.
export function RevealOnScroll({ children, className = "", delayMs = 0, as: Tag = "div" }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--reveal-delay", `${delayMs}ms`);

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      el.classList.add("reveal--visible");
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("reveal--visible");
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delayMs]);

  return (
    <Tag ref={ref} className={`reveal${className ? ` ${className}` : ""}`}>
      {children}
    </Tag>
  );
}
