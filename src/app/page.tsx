import { Navbar } from "@/components/site/navbar";
import { Hero } from "@/components/site/hero";
import { Pillars } from "@/components/site/pillars";
import { Modalities } from "@/components/site/modalities";
import { HowItWorks } from "@/components/site/how-it-works";
import { ValueProps } from "@/components/site/value-props";
import { FAQ } from "@/components/site/faq";
import { Footer } from "@/components/site/footer";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Pillars />
        <Modalities />
        <HowItWorks />
        <ValueProps />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}