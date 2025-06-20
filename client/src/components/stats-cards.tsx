import { Card, CardContent } from "@/components/ui/card";
import { FolderOpen, Mic, FileText, Radio } from "lucide-react";

interface StatsCardsProps {
  stats: {
    activeProjects: number;
    episodesThisMonth: number;
    scriptsPending: number;
    radioStations: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Active Projects",
      value: stats.activeProjects,
      icon: FolderOpen,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "Episodes This Month",
      value: stats.episodesThisMonth,
      icon: Mic,
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      title: "Scripts Pending",
      value: stats.scriptsPending,
      icon: FileText,
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
    },
    {
      title: "Radio Stations",
      value: stats.radioStations,
      icon: Radio,
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => (
        <Card key={index} className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                <card.icon className={`${card.iconColor} h-6 w-6`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
