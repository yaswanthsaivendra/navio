"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import { useState } from "react";

export function HeroSection() {
  const [email, setEmail] = useState("");

  return (
    <section
      className="relative overflow-hidden pt-28 pb-8 md:pt-36 md:pb-16"
      id="waitlist"
    >
      {/* Subtle background */}
      <div className="absolute inset-0 -z-10">
        <div className="bg-primary/5 absolute top-20 left-1/4 h-[400px] w-[400px] rounded-full blur-[120px]" />
        <div className="bg-accent/10 absolute top-40 right-1/4 h-[300px] w-[300px] rounded-full blur-[100px]" />
      </div>

      <div className="container-landing relative">
        {/* Floating UI Elements - Left Side */}
        <div className="absolute top-20 left-0 hidden lg:block">
          {/* Floating Card 1 */}
          <div className="animate-fade-up relative -translate-x-1/4 opacity-0 delay-300">
            <div className="border-border bg-card card-shadow w-[200px] rotate-[-8deg] rounded-xl border p-3">
              <div className="mb-2 flex items-center gap-2">
                <div className="bg-primary/10 h-6 w-6 rounded-lg" />
                <div className="bg-muted h-3 w-20 rounded" />
              </div>
              <div className="space-y-1.5">
                <div className="bg-muted h-2 w-full rounded" />
                <div className="bg-muted h-2 w-3/4 rounded" />
              </div>
            </div>
          </div>

          {/* Floating Card 2 */}
          <div className="animate-fade-up relative mt-8 translate-x-8 opacity-0 delay-400">
            <div className="border-border bg-card card-shadow w-[180px] rotate-[4deg] rounded-xl border p-3">
              <div className="text-muted-foreground mb-2 text-xs font-medium">
                Colors and Gradients
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  "bg-gray-800",
                  "bg-gray-400",
                  "bg-orange-400",
                  "bg-yellow-400",
                  "bg-green-400",
                ].map((color, i) => (
                  <div key={i} className={`h-6 w-6 rounded-full ${color}`} />
                ))}
                {[
                  "bg-gray-700",
                  "bg-gray-300",
                  "bg-orange-300",
                  "bg-yellow-300",
                  "bg-green-300",
                ].map((color, i) => (
                  <div key={i} className={`h-6 w-6 rounded-full ${color}`} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Floating UI Elements - Right Side */}
        <div className="absolute top-16 right-0 hidden lg:block">
          {/* Analytics Card */}
          <div className="animate-fade-up relative translate-x-1/4 opacity-0 delay-300">
            <div className="border-border bg-card card-shadow w-[220px] rotate-6 rounded-xl border p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-muted-foreground text-xs font-medium">
                  Analytics
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold text-green-500">
                    +38.56%
                  </span>
                </div>
              </div>
              <div className="flex h-12 items-end justify-between gap-1">
                {[40, 60, 45, 80, 55, 70, 90].map((h, i) => (
                  <div
                    key={i}
                    className="bg-primary/20 w-4 rounded-sm"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <div className="text-muted-foreground mt-2 flex justify-between text-[10px]">
                <span>2,347</span>
                <span>72.87%</span>
              </div>
            </div>
          </div>

          {/* Demo Card */}
          <div className="animate-fade-up relative mt-6 -translate-x-4 opacity-0 delay-400">
            <div className="border-border bg-card card-shadow w-[200px] rotate-[-4deg] overflow-hidden rounded-xl border">
              <div className="from-primary/20 to-accent/20 relative h-24 bg-linear-to-br">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-card/90 flex h-10 w-10 items-center justify-center rounded-full">
                    <Play className="text-primary ml-0.5 h-4 w-4" />
                  </div>
                </div>
              </div>
              <div className="p-3">
                <div className="bg-muted mb-1.5 h-2.5 w-24 rounded" />
                <div className="bg-muted/60 h-2 w-16 rounded" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Hero Content - Centered */}
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="animate-fade-up opacity-0">
            <Badge
              variant="outline"
              className="border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 mb-6 rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
            >
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              Now in Early Access
            </Badge>
          </div>

          {/* Headline */}
          <h1 className="text-foreground animate-fade-up text-4xl leading-[1.1] font-bold tracking-tight opacity-0 delay-100 sm:text-5xl md:text-6xl lg:text-[64px]">
            Turn your product into{" "}
            <span className="text-primary">self-selling</span> demos
          </h1>

          {/* Subheadline */}
          <p className="text-muted-foreground animate-fade-up mx-auto mt-6 max-w-2xl text-lg opacity-0 delay-200 md:text-xl">
            Capture, customize, and share{" "}
            <span className="text-primary font-medium">
              click-through walkthroughs
            </span>{" "}
            that let prospects experience your product before they ever talk to
            sales.
          </p>

          {/* Waitlist CTA */}
          <div className="animate-fade-up mt-10 opacity-0 delay-300">
            <form
              onSubmit={(e) => e.preventDefault()}
              className="mx-auto flex max-w-md flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <Input
                type="email"
                placeholder="Enter your work email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 w-full flex-1 rounded-xl px-4 text-base"
              />
              <Button
                size="lg"
                className="h-12 w-full rounded-xl px-6 text-base font-medium sm:w-auto"
              >
                Join Waitlist
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
            <p className="text-muted-foreground mt-3 text-sm">
              Free early access · No credit card required
            </p>
          </div>
        </div>

        {/* Product Demo Screenshot */}
        <div className="animate-fade-up mt-16 opacity-0 delay-400 md:mt-24">
          <div className="relative mx-auto max-w-5xl">
            {/* Browser Frame */}
            <div className="border-border bg-card card-shadow overflow-hidden rounded-xl border">
              {/* Browser Chrome */}
              <div className="border-border bg-muted/30 flex items-center gap-2 border-b px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                </div>
                <div className="ml-2 flex items-center gap-2">
                  <div className="text-muted-foreground flex h-5 w-5 items-center justify-center rounded">
                    ←
                  </div>
                  <div className="text-muted-foreground flex h-5 w-5 items-center justify-center rounded">
                    →
                  </div>
                </div>
                <div className="mx-4 flex-1">
                  <div className="bg-muted text-muted-foreground mx-auto flex max-w-md items-center justify-center rounded-lg px-4 py-1.5 text-xs">
                    <span className="truncate">
                      Interactive Overview of Navio
                    </span>
                    <span className="ml-2">↻</span>
                  </div>
                </div>
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <span>⚡</span>
                  <span>🔊</span>
                  <span>↗</span>
                  <span>⛶</span>
                </div>
              </div>

              {/* Demo Content */}
              <div className="relative">
                <Image
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80"
                  alt="Navio product demo showing analytics dashboard"
                  width={1200}
                  height={675}
                  className="w-full"
                  priority
                />

                {/* Overlay UI Elements */}
                <div className="from-background/20 absolute inset-0 bg-linear-to-t to-transparent" />

                {/* Top Bar Overlay */}
                <div className="bg-card/95 border-border absolute top-0 right-0 left-0 flex items-center justify-between border-b px-4 py-2 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary flex h-7 w-7 items-center justify-center rounded-lg">
                      <span className="text-primary-foreground text-xs font-bold">
                        N
                      </span>
                    </div>
                    <span className="text-foreground text-sm font-medium">
                      Explore the Mercury Demo
                    </span>
                    <span className="text-primary cursor-pointer text-xs hover:underline">
                      Customize your experience
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      navio
                    </Badge>
                    <Button size="sm" variant="outline" className="h-7 text-xs">
                      Login
                    </Button>
                    <Button size="sm" className="bg-primary h-7 text-xs">
                      Open Account
                    </Button>
                  </div>
                </div>

                {/* Floating Tooltip */}
                <div className="bg-secondary text-secondary-foreground card-shadow animate-fade-up absolute right-1/4 bottom-1/4 max-w-[280px] rounded-xl p-4">
                  <p className="mb-1 text-sm font-medium">
                    Navio helps you create{" "}
                    <span className="text-primary font-semibold">
                      engaging interactive demos
                    </span>{" "}
                    in minutes.
                  </p>
                  <p className="text-secondary-foreground/80 mb-3 text-xs">
                    Let&apos;s create a demo by hitting &quot;Record&quot; via
                    the extension.
                  </p>
                  <Button size="sm" className="h-8 w-full text-xs">
                    Next
                  </Button>
                </div>

                {/* Recording Popup */}
                <div className="bg-card border-border card-shadow absolute top-1/3 right-1/3 w-[200px] rounded-xl border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-medium">navio</span>
                    <div className="flex gap-1">
                      <div className="bg-muted h-4 w-4 rounded" />
                      <div className="bg-muted h-4 w-4 rounded" />
                      <div className="bg-muted h-4 w-4 rounded" />
                    </div>
                  </div>
                  <div className="text-muted-foreground mb-2 text-xs">
                    Set Recording Dimensions
                  </div>
                  <Button
                    size="sm"
                    className="bg-primary mb-2 h-8 w-full text-xs"
                  >
                    <span className="mr-1">✨</span> Record Navio
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 flex-1 text-xs"
                    >
                      Screenshot
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 flex-1 text-xs"
                    >
                      Screen Record
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Demo Type Tabs */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {[
                { icon: "📱", label: "Mobile demo" },
                { icon: "✨", label: "Interactive", active: true },
                { icon: "🎯", label: "Guided tour" },
                { icon: "📦", label: "Sandbox" },
                { icon: "🏠", label: "Demo hub" },
              ].map((tab) => (
                <button
                  key={tab.label}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    tab.active
                      ? "bg-card border-border card-shadow text-foreground border"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
