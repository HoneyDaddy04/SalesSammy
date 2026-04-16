import { useEffect, useCallback } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const TOUR_KEY = "vaigence_tour_done";

export function useOnboardingTour() {
  const startTour = useCallback(() => {
    const d = driver({
      showProgress: true,
      animate: true,
      overlayColor: "rgba(0,0,0,0.6)",
      popoverClass: "vaigence-tour",
      steps: [
        {
          element: '[data-tour="teammate-card"]',
          popover: {
            title: "Meet Sammy",
            description: "This is your AI sales teammate. Sammy researches leads, drafts messages, and follows up automatically.",
            side: "right",
            align: "start",
          },
        },
        {
          element: '[data-tour="nav-messages"]',
          popover: {
            title: "Review Messages",
            description: "Every message Sammy drafts shows up here for your approval. You can edit, approve, or skip any message before it goes out.",
            side: "right",
            align: "start",
          },
        },
        {
          element: '[data-tour="nav-chat"]',
          popover: {
            title: "Talk to Sammy",
            description: "This is the magic. Tell Sammy how to work in plain English — change timing, add guardrails, adjust tone. You'll see a visual preview of every change.",
            side: "right",
            align: "start",
          },
        },
        {
          element: '[data-tour="nav-leads"]',
          popover: {
            title: "Your Leads",
            description: "Import your leads here. Sammy will automatically assign them to sequences and start reaching out.",
            side: "right",
            align: "start",
          },
        },
        {
          element: '[data-tour="nav-knowledge"]',
          popover: {
            title: "Knowledge Base",
            description: "Add your product info, FAQs, and objection handlers. Sammy uses this to write informed, accurate messages.",
            side: "right",
            align: "start",
          },
        },
        {
          element: '[data-tour="shadow-mode"]',
          popover: {
            title: "Shadow Mode",
            description: "Sammy starts in Shadow Mode — every message needs your approval. As you build trust, Sammy gradually earns more autonomy.",
            side: "top",
            align: "start",
          },
        },
      ],
      onDestroyed: () => {
        localStorage.setItem(TOUR_KEY, "true");
      },
    });

    d.drive();
  }, []);

  useEffect(() => {
    const done = localStorage.getItem(TOUR_KEY);
    if (!done) {
      // Delay to let the page render first
      const timer = setTimeout(startTour, 1500);
      return () => clearTimeout(timer);
    }
  }, [startTour]);

  return { startTour };
}
