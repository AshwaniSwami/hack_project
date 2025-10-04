import { Card, CardContent } from "@/components/ui/card";
import { FolderOpen, Mic, FileText, Radio, TrendingUp, Clock } from "lucide-react";

interface StatsCardsProps {
  stats: {
    activeHackathons: number;
    episodesThisMonth: number;
    scriptsPending: number;
    radioStations: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Active Hackathons",
      value: stats.activeHackathons,
      icon: FolderOpen,
      bgColor: "bg-gradient-to-br from-blue-50 to-blue-100",
      iconColor: "text-blue-600",
      borderColor: "border-l-blue-500",
      change: "+12%",
      trend: "up"
    },
    {
      title: "Teams This Month",
      value: stats.episodesThisMonth,
      icon: Mic,
      bgColor: "bg-gradient-to-br from-green-50 to-green-100",
      iconColor: "text-green-600",
      borderColor: "border-l-green-500",
      change: "+8%",
      trend: "up"
    },
    {
      title: "Submissions Pending",
      value: stats.scriptsPending,
      icon: FileText,
      bgColor: "bg-gradient-to-br from-orange-50 to-orange-100",
      iconColor: "text-orange-600",
      borderColor: "border-l-orange-500",
      change: "-5%",
      trend: "down"
    },
    {
      title: "Radio Stations",
      value: stats.radioStations,
      icon: Radio,
      bgColor: "bg-gradient-to-br from-purple-50 to-purple-100",
      iconColor: "text-purple-600",
      borderColor: "border-l-purple-500",
      change: "+3%",
      trend: "up"
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => (
        <Card key={index} className={`shadow-lg border-l-4 ${card.borderColor} hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white/80 backdrop-blur-sm`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${card.bgColor} shadow-lg`}>
                <card.icon className={`${card.iconColor} h-7 w-7`} />
              </div>
              <div className="flex items-center space-x-1">
                {card.trend === "up" ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <Clock className="h-4 w-4 text-orange-500" />
                )}
                <span className={`text-xs font-medium ${card.trend === "up" ? "text-green-600" : "text-orange-600"}`}>
                  {card.change}
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
              <p className="text-3xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-500 mt-1">vs last month</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
