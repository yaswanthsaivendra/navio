"use client";

import { WaitlistForm } from "./waitlist-form";

export function CTASection() {
  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      {/* Dark background */}
      <div className="bg-secondary absolute inset-0" />

      {/* Gradient overlay */}
      <div className="absolute inset-0">
        <div className="bg-primary/10 absolute top-0 left-1/4 h-[400px] w-[400px] rounded-full blur-[100px]" />
        <div className="bg-accent/10 absolute right-1/4 bottom-0 h-[300px] w-[300px] rounded-full blur-[100px]" />
      </div>

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="container-landing relative z-10">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="animate-fade-up text-3xl font-semibold text-white opacity-0 sm:text-4xl md:text-5xl">
            Ready to transform how you demo your product?
          </h2>
          <p className="animate-fade-up mt-6 text-lg text-white/70 opacity-0 delay-100">
            Join forward-thinking teams who are already using Navio to close
            deals faster with interactive product demos.
          </p>

          <div className="animate-fade-up mx-auto mt-10 max-w-md opacity-0 delay-200">
            <WaitlistForm variant="dark" />
          </div>
        </div>
      </div>
    </section>
  );
}
