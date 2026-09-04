import { Mail, Phone, MapPin } from "lucide-react";
import { Logo } from "./logo";
import { siteConfig } from "@/lib/site-config";
import { LinkedinIcon, XIcon, FacebookIcon, InstagramIcon } from "./social-icons";

const QUICK_LINKS = [
  { label: "Home", href: "#" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "Log in", href: "/login" },
];

// Placeholder hrefs - swap for real profiles once the foundation sets them up.
const SOCIALS = [
  { icon: LinkedinIcon, href: "#", label: "LinkedIn" },
  { icon: XIcon, href: "#", label: "X (Twitter)" },
  { icon: FacebookIcon, href: "#", label: "Facebook" },
  { icon: InstagramIcon, href: "#", label: "Instagram" },
];

export function Footer() {
  const { contact } = siteConfig;
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    contact.address,
  )}`;

  return (
    <footer className="bg-slate-950 text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-slate-400">{siteConfig.mission}</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-teal)]">
            Quick Links
          </p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {QUICK_LINKS.map((l) => (
              <li key={l.label}>
                <a href={l.href} className="transition-colors hover:text-white">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-teal)]">
            Contact
          </p>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <a
                href={`mailto:${contact.email}`}
                className="flex items-center gap-2 transition-colors hover:text-white"
              >
                <Mail className="h-4 w-4 shrink-0" /> {contact.email}
              </a>
            </li>
            <li>
              <a
                href={`tel:${contact.phone}`}
                className="flex items-center gap-2 transition-colors hover:text-white"
              >
                <Phone className="h-4 w-4 shrink-0" /> {contact.phone}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              <a
                href={mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-white"
              >
                {contact.address}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-teal)]">
            Follow Us
          </p>
          <div className="mt-4 flex gap-3">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-[var(--brand-blue)]"
              >
                <s.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-5 text-xs text-slate-500 sm:flex-row">
          <p>(c) {new Date().getFullYear()} QRI. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="/terms" className="transition-colors hover:text-slate-300">
              Terms of Service
            </a>
            <a href="/privacy" className="transition-colors hover:text-slate-300">
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}