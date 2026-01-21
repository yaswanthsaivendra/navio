"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check } from "lucide-react";

type EmbedCodeGeneratorProps = {
  token: string;
  flowName?: string;
};

export default function EmbedCodeGenerator({
  token,
  flowName = "Interactive Demo",
}: EmbedCodeGeneratorProps) {
  const [copied, setCopied] = useState(false);
  const [embedMode, setEmbedMode] = useState<"responsive" | "fixed">(
    "responsive"
  );
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);

  // Get base URL (use environment variable or fallback to window.location.origin)
  const getBaseUrl = () => {
    if (typeof window === "undefined") return "";
    return process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  };

  const embedUrl = `${getBaseUrl()}/embed/${token}`;

  // Generate responsive embed code
  const getResponsiveEmbedCode = () => {
    return `<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%;">
  <iframe
    src="${embedUrl}"
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"
    allowfullscreen
    loading="lazy"
    title="Interactive Demo: ${flowName}"
  ></iframe>
</div>`;
  };

  // Generate fixed size embed code
  const getFixedEmbedCode = () => {
    return `<iframe
  src="${embedUrl}"
  width="${width}"
  height="${height}"
  frameborder="0"
  allowfullscreen
  loading="lazy"
  title="Interactive Demo: ${flowName}"
></iframe>`;
  };

  const getEmbedCode = () => {
    return embedMode === "responsive"
      ? getResponsiveEmbedCode()
      : getFixedEmbedCode();
  };

  const handleCopy = async () => {
    const code = getEmbedCode();
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <Tabs
        value={embedMode}
        onValueChange={(v) => setEmbedMode(v as "responsive" | "fixed")}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="responsive">Responsive</TabsTrigger>
          <TabsTrigger value="fixed">Fixed Size</TabsTrigger>
        </TabsList>

        <TabsContent value="responsive" className="mt-3 space-y-3">
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">
              Responsive embed automatically adapts to container width while
              maintaining a 16:9 aspect ratio. Perfect for most websites.
            </p>
            <div className="bg-muted overflow-hidden rounded-md border p-3">
              <pre className="max-h-48 overflow-x-auto text-xs">
                <code className="whitespace-pre-wrap">
                  {getResponsiveEmbedCode()}
                </code>
              </pre>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="fixed" className="mt-3 space-y-3">
          <div className="space-y-3">
            <p className="text-muted-foreground text-sm">
              Fixed size embed with custom dimensions. Useful for specific
              layouts or email clients.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="width">Width (px)</Label>
                <Input
                  id="width"
                  type="number"
                  min="300"
                  max="2000"
                  value={width}
                  onChange={(e) => setWidth(parseInt(e.target.value) || 800)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height (px)</Label>
                <Input
                  id="height"
                  type="number"
                  min="300"
                  max="2000"
                  value={height}
                  onChange={(e) => setHeight(parseInt(e.target.value) || 600)}
                />
              </div>
            </div>
            <div className="bg-muted overflow-hidden rounded-md border p-3">
              <pre className="max-h-48 overflow-x-auto text-xs">
                <code className="whitespace-pre-wrap">
                  {getFixedEmbedCode()}
                </code>
              </pre>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Button
        onClick={handleCopy}
        className="w-full"
        variant="outline"
        disabled={copied}
      >
        {copied ? (
          <>
            <Check className="mr-2 h-4 w-4" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="mr-2 h-4 w-4" />
            Copy Embed Code
          </>
        )}
      </Button>
    </div>
  );
}
