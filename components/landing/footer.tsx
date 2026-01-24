"use client";

import Link from "next/link";
import { Separator } from "@/components/ui/separator";

const footerLinks = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Contact", href: "mailto:hello@navio.io" },
];

export function Footer() {
  return (
    <footer className="bg-card border-border border-t">
      <div className="container-landing py-12 md:py-16">
        <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
          {/* Logo & Description */}
          <div className="flex flex-col items-center md:items-start">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
                <svg
                  className="text-primary-foreground h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                  <polyline points="2 17 12 22 22 17" />
                  <polyline points="2 12 12 17 22 12" />
                </svg>
              </div>
              <span className="text-foreground text-lg font-semibold">
                Navio
              </span>
            </Link>
            <p className="text-muted-foreground mt-3 max-w-xs text-center text-sm md:text-left">
              Create interactive product demos in minutes. Engage prospects,
              close deals faster.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-6">
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} Navio. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
