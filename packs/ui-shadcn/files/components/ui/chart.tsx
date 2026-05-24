"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "@/lib/utils";

const THEMES = { light: "", dark: ".dark" } as const;

export type ChartConfig = Record<string, { label?: React.ReactNode; icon?: React.ComponentType<{ className?: string }>; color?: string; theme?: Record<keyof typeof THEMES, string> }>;
type PayloadItem = { name?: string; dataKey?: string; value?: React.ReactNode; color?: string; fill?: string; payload?: Record<string, unknown> };

const ChartContext = React.createContext<{ config: ChartConfig } | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) throw new Error("useChart must be used within a <ChartContainer />");
  return context;
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { config: ChartConfig; children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"] }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;
  return (
    <ChartContext.Provider value={{ config }}>
      <div data-chart={chartId} ref={ref} className={cn("flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-grid_line]:stroke-border/50 [&_.recharts-tooltip-cursor]:stroke-border", className)} {...props}>
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
});
ChartContainer.displayName = "Chart";

function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const colorConfig = Object.entries(config).filter(([, item]) => item.theme || item.color);
  if (!colorConfig.length) return null;
  return (
    <style dangerouslySetInnerHTML={{
      __html: Object.entries(THEMES).map(([theme, prefix]) => `${prefix} [data-chart=${id}] {\n${colorConfig.map(([key, item]) => {
        const color = item.theme?.[theme as keyof typeof item.theme] || item.color;
        return color ? `  --color-${key}: ${color};` : "";
      }).join("\n")}\n}`).join("\n"),
    }} />
  );
}

const ChartTooltip = RechartsPrimitive.Tooltip;
const ChartLegend = RechartsPrimitive.Legend;

function getPayloadConfig(config: ChartConfig, item: PayloadItem, key?: string) {
  const dataKey = `${key || item.dataKey || item.name || "value"}`;
  const nested = item.payload?.[dataKey];
  return config[dataKey] || (typeof nested === "object" && nested ? nested as ChartConfig[string] : {});
}

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { active?: boolean; payload?: PayloadItem[]; label?: React.ReactNode; hideLabel?: boolean; hideIndicator?: boolean; indicator?: "line" | "dot" | "dashed"; nameKey?: string; labelKey?: string }
>(({ active, payload, className, indicator = "dot", hideLabel = false, hideIndicator = false, label, nameKey, labelKey }, ref) => {
  const { config } = useChart();
  if (!active || !payload?.length) return null;
  const labelConfig = getPayloadConfig(config, payload[0], labelKey);
  return (
    <div ref={ref} className={cn("grid min-w-32 gap-1.5 rounded-lg border bg-background px-2.5 py-1.5 text-xs shadow-xl", className)}>
      {!hideLabel && <div className="font-medium">{labelConfig.label || label}</div>}
      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          const itemConfig = getPayloadConfig(config, item, nameKey);
          const color = item.color || item.fill || itemConfig.color;
          const Icon = itemConfig.icon;
          return (
            <div key={item.dataKey || index} className="flex min-w-0 items-center gap-2">
              {Icon && !hideIndicator ? <Icon className="h-2.5 w-2.5" /> : !hideIndicator && <span className={cn("h-2.5 w-2.5 shrink-0 rounded-[2px]", indicator === "line" && "w-1", indicator === "dashed" && "border border-dashed bg-transparent")} style={{ backgroundColor: color, borderColor: color }} />}
              <span className="flex flex-1 justify-between gap-4">
                <span className="text-muted-foreground">{itemConfig.label || item.name}</span>
                {item.value && <span className="font-mono font-medium text-foreground">{item.value}</span>}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
});
ChartTooltipContent.displayName = "ChartTooltip";

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { payload?: PayloadItem[]; hideIcon?: boolean; nameKey?: string }
>(({ className, payload, hideIcon = false, nameKey }, ref) => {
  const { config } = useChart();
  if (!payload?.length) return null;
  return (
    <div ref={ref} className={cn("flex items-center justify-center gap-4", className)}>
      {payload.map((item) => {
        const itemConfig = getPayloadConfig(config, item, nameKey);
        const Icon = itemConfig.icon;
        return (
          <div key={item.value as string} className="flex items-center gap-1.5">
            {Icon && !hideIcon ? <Icon className="h-3 w-3" /> : <span className="h-2 w-2 shrink-0 rounded-[2px]" style={{ backgroundColor: item.color || itemConfig.color }} />}
            {itemConfig.label || item.value}
          </div>
        );
      })}
    </div>
  );
});
ChartLegendContent.displayName = "ChartLegend";

export { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent };
