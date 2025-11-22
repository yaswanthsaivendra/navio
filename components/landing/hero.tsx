"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Layers, Zap, Monitor } from "lucide-react";
import Link from "next/link";

export function Hero() {
  return (
    <section className="bg-background relative overflow-hidden pt-16 pb-16 md:pt-24 lg:pt-32">
      {/* Background Gradients */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 h-full w-full max-w-7xl -translate-x-1/2 opacity-40">
          <div className="bg-primary/20 absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full blur-[120px]" />
          <div className="bg-accent/20 absolute right-[-10%] bottom-[-10%] h-[40%] w-[40%] rounded-full blur-[120px]" />
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="border-primary/20 bg-primary/5 text-primary mb-6 inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium">
              <span className="bg-primary mr-2 flex h-2 w-2 animate-pulse rounded-full"></span>
              Now in Public Beta
            </div>
            <h1 className="text-foreground text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Deliver Flawless{" "}
              <span className="text-primary relative whitespace-nowrap">
                Live Demos
                <svg
                  className="text-accent absolute -bottom-1 left-0 h-3 w-full opacity-60"
                  viewBox="0 0 100 10"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0 5 Q 50 10 100 5"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                </svg>
              </span>
              , Every Time.
            </h1>
            <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg leading-relaxed sm:text-xl md:text-2xl">
              The lightweight overlay tool that guides your sales team through
              the perfect demo on your real product. No sandboxes, no scripts,
              just confidence.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link href="/login">
              <Button
                size="lg"
                className="shadow-primary/20 hover:shadow-primary/30 h-12 w-full rounded-full px-8 text-base shadow-lg transition-all sm:w-auto"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              className="border-primary/20 hover:bg-primary/5 hover:text-primary h-12 w-full rounded-full px-8 text-base sm:w-auto"
            >
              View Demo
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-muted-foreground mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="text-primary h-4 w-4" />
              <span>Consistent Storytelling</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="text-primary h-4 w-4" />
              <span>Fast Onboarding</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="text-primary h-4 w-4" />
              <span>Real-time Guidance</span>
            </div>
          </motion.div>
        </div>

        {/* Abstract Visual / Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="relative mx-auto mt-16 max-w-5xl sm:mt-24"
        >
          <div className="border-border/50 bg-card/50 aspect-[16/9] w-full rounded-2xl border p-2 shadow-2xl ring-1 ring-white/20 backdrop-blur-sm">
            <div className="from-secondary/30 to-background relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br">
              {/* Mock UI Elements - Representing an Overlay */}
              <div className="bg-background border-border/50 absolute top-8 right-8 bottom-0 left-8 rounded-t-xl border p-6 opacity-50 shadow-lg grayscale">
                {/* Background App (Faded) */}
                <div className="mb-8 flex items-center justify-between">
                  <div className="bg-secondary/50 h-8 w-32 rounded-md"></div>
                  <div className="flex gap-4">
                    <div className="bg-secondary/50 h-8 w-8 rounded-full"></div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-secondary/30 col-span-2 h-32 rounded-lg"></div>
                  <div className="bg-secondary/30 col-span-1 h-32 rounded-lg"></div>
                </div>
              </div>

              {/* The Overlay Card */}
              <div className="bg-card border-primary/20 absolute top-1/4 right-1/4 left-1/4 z-10 rounded-lg border p-6 shadow-2xl">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                    1
                  </div>
                  <div>
                    <h4 className="text-foreground text-lg font-semibold">
                      Explain the Dashboard
                    </h4>
                    <p className="text-muted-foreground mt-1">
                      &ldquo;Here you can see a high-level overview of all your
                      metrics. Notice the uptick in Q3...&rdquo;
                    </p>
                    <div className="mt-4 flex gap-2">
                      <div className="bg-primary/20 h-2 w-16 rounded-full"></div>
                      <div className="bg-secondary h-2 w-8 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Features Grid */}
        <div className="mx-auto mt-24 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-3">
          <div className="bg-secondary/10 hover:bg-secondary/20 flex flex-col items-center rounded-2xl p-6 text-center transition-colors">
            <div className="bg-primary/10 text-primary mb-4 flex h-12 w-12 items-center justify-center rounded-full">
              <Layers className="h-6 w-6" />
            </div>
            <h3 className="text-foreground text-lg font-semibold">
              Perfect Consistency
            </h3>
            <p className="text-muted-foreground mt-2">
              Every rep tells the same winning story, every single time.
            </p>
          </div>
          <div className="bg-secondary/10 hover:bg-secondary/20 flex flex-col items-center rounded-2xl p-6 text-center transition-colors">
            <div className="bg-primary/10 text-primary mb-4 flex h-12 w-12 items-center justify-center rounded-full">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-foreground text-lg font-semibold">
              Instant Onboarding
            </h3>
            <p className="text-muted-foreground mt-2">
              Ramp up new reps in days, not months. Learn by doing.
            </p>
          </div>
          <div className="bg-secondary/10 hover:bg-secondary/20 flex flex-col items-center rounded-2xl p-6 text-center transition-colors">
            <div className="bg-primary/10 text-primary mb-4 flex h-12 w-12 items-center justify-center rounded-full">
              <Monitor className="h-6 w-6" />
            </div>
            <h3 className="text-foreground text-lg font-semibold">
              Real Product Magic
            </h3>
            <p className="text-muted-foreground mt-2">
              Demo on your actual app, not a clone or a sandbox.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
