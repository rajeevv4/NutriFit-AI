import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Timeframe } from "@/utils/dataAggregation";

interface TimeframeSelectorProps {
  value: Timeframe;
  onChange: (timeframe: Timeframe) => void;
}

export function TimeframeSelector({ value, onChange }: TimeframeSelectorProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as Timeframe)} className="w-full">
      <TabsList className="grid w-full grid-cols-4 bg-secondary/50">
        <TabsTrigger 
          value="day"
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          24H
        </TabsTrigger>
        <TabsTrigger 
          value="week"
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          Week
        </TabsTrigger>
        <TabsTrigger 
          value="month"
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          Month
        </TabsTrigger>
        <TabsTrigger 
          value="year"
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          Year
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
