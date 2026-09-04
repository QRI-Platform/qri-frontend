"use client";

import { motion } from "framer-motion";

const PROPS = [
  { en: "From Curiosity to Success.", hi: "Jigyasa se safalta tak." },
  { en: "Every Question, A Smart Answer.", hi: "Har sawal ka smart jawab." },
  { en: "Ask Anything, Learn Everything.", hi: "Kuch bhi poocho, sab kuch seekho." },
];

export function ValueProps() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--brand-blue)] via-[var(--brand-navy)] to-[var(--brand-teal)] px-6 py-14 text-center sm:px-12"
      >
        <div className="mx-auto max-w-2xl space-y-6">
          {PROPS.map((p, i) => (
            <motion.div
              key={p.en}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
            >
              <p className="text-2xl font-bold text-white sm:text-3xl">{p.en}</p>
              <p className="text-base text-white/75">{p.hi}</p>
            </motion.div>
          ))}

          <div className="pt-4">
            <a
              href="/signup"
              className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 font-semibold text-[var(--brand-navy)] shadow-lg transition hover:bg-white/90"
            >
              Get started free
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  );
}