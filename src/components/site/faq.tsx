"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: "Is QRI free to use?",
    a: "Yes - QRI is free to start. Sign up, choose your class, and begin asking questions right away. No card required.",
  },
  {
    q: "Which classes and subjects are covered?",
    a: "All major subjects for Class 6 through 12, plus dedicated content for NEET, IIT-JEE, and NDA preparation.",
  },
  {
    q: "Are the answers accurate, or can the AI get things wrong?",
    a: "Every question is first checked against the QRI library of verified answers. If there's no match, the AI generates a response - and AI-generated answers are always clearly labeled as such, so you know exactly where an answer came from.",
  },
  {
    q: "Is my data safe?",
    a: "Yes. Your personal data and chat history are private to your account and are not visible to other students.",
  },
  {
    q: "Does asking by photo, PDF, or voice cost extra?",
    a: "No - typing, photo, voice, document, and PDF are all included in the same plan.",
  },
  {
    q: "Is NEET/IIT-JEE/NDA prep different from regular Class 11-12 content?",
    a: "Yes - competitive exam preparation has its own dedicated section, with questions and explanations organized specifically around each exam's pattern.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="mx-auto max-w-3xl px-6 py-20">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Frequently asked questions
        </h2>
        <p className="mt-3 text-muted-foreground">The questions we hear most often.</p>
      </div>

      <div className="mt-10 space-y-3">
        {FAQS.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={item.q}
              className="overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur-sm"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                aria-expanded={isOpen}
              >
                <span className="font-semibold">{item.q}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-4 text-sm leading-relaxed text-muted-foreground">
                      {item.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}