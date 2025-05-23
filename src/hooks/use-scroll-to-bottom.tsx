import useSWR from "swr";
import { useRef, useEffect, useCallback } from "react";

type ScrollFlag = ScrollBehavior | false;

export function useScrollToBottom() {
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const { data: isAtBottom = false, mutate: setIsAtBottom } = useSWR(
    "messages:is-at-bottom",
    null,
    { fallbackData: false }
  );

  const { data: scrollBehavior = false, mutate: setScrollBehavior } =
    useSWR<ScrollFlag>("messages:should-scroll", null, { fallbackData: false });

  useEffect(() => {
    if (scrollBehavior) {
      // Use manual scroll instead of scrollIntoView to prevent iframe issues
      const container = containerRef.current;
      const endElement = endRef.current;

      if (container && endElement) {
        const scrollToPosition = () => {
          const containerHeight = container.clientHeight;
          const scrollHeight = container.scrollHeight;
          const targetScrollTop = scrollHeight - containerHeight;

          if (scrollBehavior === "smooth") {
            container.scrollTo({
              top: targetScrollTop,
              behavior: "smooth",
            });
          } else {
            container.scrollTop = targetScrollTop;
          }
        };

        // Use requestAnimationFrame to ensure DOM is updated
        requestAnimationFrame(scrollToPosition);
      }

      setScrollBehavior(false);
    }
  }, [setScrollBehavior, scrollBehavior]);

  // Add intersection observer as fallback for better bottom detection
  useEffect(() => {
    const element = endRef.current;
    const container = containerRef.current;

    if (!element || !container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setIsAtBottom(true);
        } else {
          setIsAtBottom(false);
        }
      },
      {
        root: container,
        threshold: 0.1,
      }
    );

    observer.observe(element);

    // Prevent scroll events from bubbling to parent when in iframe
    const preventScrollPropagation = (e: Event) => {
      const target = e.target as HTMLElement;
      if (container.contains(target)) {
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    };

    // Check if we're in an iframe
    const isInIframe = window !== window.parent;
    if (isInIframe) {
      // Prevent all scroll-related events
      const events = ["wheel", "scroll", "touchmove", "touchstart", "touchend"];
      events.forEach((eventType) => {
        document.addEventListener(eventType, preventScrollPropagation, {
          passive: false,
          capture: true,
        });
        container.addEventListener(
          eventType,
          (e) => {
            e.stopPropagation();
            e.stopImmediatePropagation();
          },
          { passive: false, capture: true }
        );
      });
    }

    return () => {
      observer.disconnect();
      if (isInIframe) {
        const events = [
          "wheel",
          "scroll",
          "touchmove",
          "touchstart",
          "touchend",
        ];
        events.forEach((eventType) => {
          document.removeEventListener(eventType, preventScrollPropagation);
          container.removeEventListener(eventType, (e) => {
            e.stopPropagation();
            e.stopImmediatePropagation();
          });
        });
      }
    };
  }, [setIsAtBottom]);

  const scrollToBottom = useCallback(
    (scrollBehavior: ScrollBehavior = "smooth") => {
      setScrollBehavior(scrollBehavior);
    },
    [setScrollBehavior]
  );

  function onViewportEnter() {
    setIsAtBottom(true);
  }

  function onViewportLeave() {
    setIsAtBottom(false);
  }

  return {
    containerRef,
    endRef,
    isAtBottom,
    scrollToBottom,
    onViewportEnter,
    onViewportLeave,
  };
}
