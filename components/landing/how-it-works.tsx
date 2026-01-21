"use client";

import { Camera, MousePointer2, Share2 } from "lucide-react";

const steps = [
  {
    icon: Camera,
    title: "Capture your product",
    description:
      "Install our browser extension and capture screenshots of your product with a single click. We automatically detect and highlight interactive elements.",
  },
  {
    icon: MousePointer2,
    title: "Add interactive steps",
    description:
      "Annotate each screenshot with hotspots, tooltips, and guided instructions. Create a narrative that guides viewers through your product.",
  },
  {
    icon: Share2,
    title: "Share anywhere",
    description:
      "Generate a shareable link or embed your demo directly on your website. Track engagement and see how prospects interact with your content.",
  },
];

export function HowItWorks() {
  return (
    <section className="section-padding" id="product">
      <div className="container-landing">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-foreground animate-fade-up opacity-0">
            How it works
          </h2>
          <p className="text-muted-foreground animate-fade-up mt-4 text-lg opacity-0 delay-100">
            Go from idea to shareable demo in under 10 minutes. No technical
            skills required.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="group border-border bg-card card-shadow hover:card-shadow-hover animate-fade-up relative rounded-2xl border p-8 opacity-0 transition-all hover:-translate-y-1"
              style={{ animationDelay: `${(index + 2) * 100}ms` }}
            >
              {/* Step number */}
              <div className="bg-primary text-primary-foreground absolute -top-3 -left-3 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold">
                {index + 1}
              </div>

              <div className="bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground mb-4 flex h-14 w-14 items-center justify-center rounded-xl transition-colors">
                <step.icon className="h-7 w-7" />
              </div>

              <h3 className="text-foreground text-xl font-semibold">
                {step.title}
              </h3>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
