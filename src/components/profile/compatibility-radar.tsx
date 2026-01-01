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
  PolarRadiusAxis,
} from 'recharts';
import type { PersonalityTrait } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

type CompatibilityRadarProps = {
  currentUserTraits: PersonalityTrait[];
  viewerProfileTraits: PersonalityTrait[];
};

const chartConfig = {
  userScore: {
    label: 'Sen',
    color: 'hsl(var(--primary))',
  },
  viewerScore: {
    label: 'O',
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

  const totalScore = data.reduce((acc, item) => acc + (item.userScore + item.viewerScore) / 2, 0);
  const averageScore = Math.round((totalScore / data.length / 100) * 100);

  return (
      <Card className="bg-transparent border-none shadow-none">
        <CardHeader className="items-center pb-4">
            <CardTitle>Eşleşme Potansiyeli</CardTitle>
            <CardDescription className="text-center">
                Genel uyumunuz: <span className="text-primary font-bold text-lg">{averageScore}%</span>
            </CardDescription>
        </CardHeader>
        <CardContent>
            <ChartContainer 
                config={chartConfig} 
                className="mx-auto aspect-square w-full max-w-[300px]"
            >
            <RadarChart 
                data={data}
                margin={{
                    top: 20,
                    bottom: 20,
                }}
            >
                <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
                />
                <PolarAngleAxis dataKey="trait" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} />
                 <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <PolarGrid gridType='polygon' />
                <Radar
                name="Sen"
                dataKey="userScore"
                fill="var(--color-userScore)"
                fillOpacity={0.6}
                stroke="var(--color-userScore)"
                />
                <Radar
                name="O"
                dataKey="viewerScore"
                fill="var(--color-viewerScore)"
                fillOpacity={0.6}
                stroke="var(--color-viewerScore)"
                />
            </RadarChart>
            </ChartContainer>
        </CardContent>
    </Card>

  );
}
