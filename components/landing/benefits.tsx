"use client";

import { Code2, Zap, Link2, Users, BarChart3, Shield } from "lucide-react";

const benefits = [
  {
    icon: Code2,
    title: "No code required",
    description:
      "Point, click, and create. No developers needed to build stunning product demos.",
  },
  {
    icon: Zap,
    title: "Lightning fast setup",
    description:
      "Install the extension and create your first demo in under 5 minutes.",
  },
  {
    icon: Link2,
    title: "Shareable links",
    description:
      "Generate unique links for each prospect or embed demos on your website.",
  },
  {
    icon: Users,
    title: "Team collaboration",
    description:
      "Work together on demos with your sales and marketing teams in real-time.",
  },
  {
    icon: BarChart3,
    title: "Analytics & insights",
    description:
      "Track views, engagement, and drop-off points to optimize your demos.",
  },
  {
    icon: Shield,
    title: "Enterprise ready",
    description:
      "SSO, custom domains, and advanced permissions for security-conscious teams.",
  },
];

export function Benefits() {
  return (
    <section className="section-padding bg-card border-border border-y">
      <div className="container-landing">
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left content */}
          <div className="lg:sticky lg:top-32">
            <h2 className="text-foreground animate-fade-up opacity-0">
              Everything you need to create demos that convert
            </h2>
            <p className="text-muted-foreground animate-fade-up mt-4 text-lg opacity-0 delay-100">
              Navio combines powerful features with an intuitive interface,
              giving your team the tools to showcase your product at its best.
            </p>
          </div>

          {/* Right - Benefits cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            {benefits.map((benefit, index) => (
              <div
                key={benefit.title}
                className="group border-border bg-background hover:border-primary/20 hover:bg-primary/5 animate-fade-up rounded-xl border p-6 opacity-0 transition-all"
                style={{ animationDelay: `${(index + 2) * 100}ms` }}
              >
                <div className="bg-primary/10 text-primary mb-3 flex h-10 w-10 items-center justify-center rounded-lg">
                  <benefit.icon className="h-5 w-5" />
                </div>
                <h3 className="text-foreground font-semibold">
                  {benefit.title}
                </h3>
                <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
