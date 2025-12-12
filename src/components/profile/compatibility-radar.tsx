'use client';

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  PolarGrid,
  PolarAngleAxis,
  Radar,
  RadarChart,
} from 'recharts';
import type { PersonalityTrait } from '@/lib/data';

type CompatibilityRadarProps = {
  currentUserTraits: PersonalityTrait[];
  viewerProfileTraits: PersonalityTrait[];
};

const chartConfig = {
  userScore: {
    label: 'You',
    color: 'hsl(var(--chart-1))',
  },
  viewerScore: {
    label: 'Them',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

export default function CompatibilityRadar({
  currentUserTraits,
  viewerProfileTraits,
}: CompatibilityRadarProps) {
  const data = currentUserTraits.map((trait, index) => ({
    trait: trait.trait,
    userScore: trait.userScore,
    viewerScore: viewerProfileTraits[index]?.userScore ?? 0,
  }));

  return (
    <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[400px]">
      <RadarChart data={data}>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dot" />}
        />
        <PolarAngleAxis dataKey="trait" />
        <PolarGrid />
        <Radar
          name="You"
          dataKey="userScore"
          fill="var(--color-userScore)"
          fillOpacity={0.6}
          stroke="var(--color-userScore)"
        />
        <Radar
          name="Them"
          dataKey="viewerScore"
          fill="var(--color-viewerScore)"
          fillOpacity={0.6}
          stroke="var(--color-viewerScore)"
        />
      </RadarChart>
    </ChartContainer>
  );
}
