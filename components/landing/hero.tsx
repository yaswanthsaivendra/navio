"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import { useState } from "react";

export function HeroSection() {
  const [email, setEmail] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);

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

        {/* Video Demo */}
        <div className="animate-fade-up mt-16 opacity-0 delay-400 md:mt-24">
          <div className="relative mx-auto max-w-4xl">
            {/* Browser Frame */}
            <div className="border-border bg-card card-shadow overflow-hidden rounded-2xl border">
              {/* Browser Chrome */}
              <div className="border-border bg-muted/30 flex items-center gap-2 border-b px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                </div>
                <div className="mx-4 flex-1">
                  <div className="bg-muted text-muted-foreground mx-auto flex max-w-sm items-center justify-center rounded-lg px-4 py-1.5 text-xs">
                    <span className="truncate">
                      app.navio.io/demo/product-tour
                    </span>
                  </div>
                </div>
              </div>

              {/* Video Container */}
              <div className="relative aspect-video bg-linear-to-br from-slate-900 to-slate-800">
                {!isPlaying ? (
                  /* Play Button Overlay */
                  <div
                    className="absolute inset-0 flex cursor-pointer items-center justify-center transition-opacity hover:opacity-90"
                    onClick={() => setIsPlaying(true)}
                  >
                    {/* Thumbnail gradient overlay */}
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-black/20" />

                    {/* Play Button */}
                    <div className="relative z-10 flex flex-col items-center gap-4">
                      <div className="bg-primary shadow-primary/30 flex h-20 w-20 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105">
                        <Play
                          className="ml-1 h-8 w-8 text-white"
                          fill="white"
                        />
                      </div>
                      <span className="text-sm font-medium text-white/90">
                        Watch how Navio works
                      </span>
                    </div>

                    {/* Demo preview elements */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-30">
                      <div className="grid w-full max-w-2xl grid-cols-3 gap-4 p-8">
                        <div className="h-32 rounded-lg bg-white/10" />
                        <div className="col-span-2 h-32 rounded-lg bg-white/10" />
                        <div className="col-span-2 h-24 rounded-lg bg-white/10" />
                        <div className="h-24 rounded-lg bg-white/10" />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Video Player */
                  <iframe
                    className="absolute inset-0 h-full w-full"
                    src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0&modestbranding=1"
                    title="Navio Product Demo"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                )}
              </div>
            </div>

            {/* Video duration badge */}
            <div className="mt-4 flex items-center justify-center gap-4">
              <span className="text-muted-foreground text-sm">
                🎬 2 min demo
              </span>
              <span className="text-muted-foreground text-sm">•</span>
              <span className="text-muted-foreground text-sm">
                No signup required
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
