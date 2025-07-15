import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Users, FileText, TrendingUp, MapPin } from "lucide-react";

interface OnboardingResponse {
  id: number;
  userId: number;
  questionId: string;
  response: string;
  createdAt: string;
}

interface OnboardingAnalyticsData {
  totalResponses: number;
  responsesByQuestion: Record<string, OnboardingResponse[]>;
  completionRate: number;
  demographics: {
    byLocation: Record<string, number>;
    totalUsers: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function OnboardingAnalytics() {
  const { data: analytics, isLoading, error } = useQuery<OnboardingAnalyticsData>({
    queryKey: ["/api/onboarding/analytics"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <CardContent className="p-6 text-center">
            <p className="text-red-800 dark:text-red-200">
              Failed to load analytics: {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const {
    totalResponses = 0,
    responsesByQuestion = {},
    completionRate = 0,
    demographics = { byLocation: {}, totalUsers: 0 }
  } = analytics || {};

  // Prepare data for charts
  const questionData = Object.entries(responsesByQuestion).map(([questionId, responses]) => ({
    question: questionId,
    responses: responses?.length || 0,
  }));

  const locationData = Object.entries(demographics.byLocation || {}).map(([location, count]) => ({
    name: location || 'Unknown',
    value: count || 0,
  }));

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-2">Onboarding Analytics</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Insights into user onboarding completion and responses
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Responses</p>
                <p className="text-2xl font-bold">{totalResponses}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completion Rate</p>
                <p className="text-2xl font-bold">{completionRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                <p className="text-2xl font-bold">{demographics.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Locations</p>
                <p className="text-2xl font-bold">{Object.keys(demographics.byLocation || {}).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Responses by Question */}
        <Card>
          <CardHeader>
            <CardTitle>Responses by Question</CardTitle>
          </CardHeader>
          <CardContent>
            {questionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={questionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="question" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="responses" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-gray-500">
                No response data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Demographics by Location */}
        <Card>
          <CardHeader>
            <CardTitle>User Distribution by Location</CardTitle>
          </CardHeader>
          <CardContent>
            {locationData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={locationData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {locationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-gray-500">
                No location data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Responses */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Responses</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(responsesByQuestion).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(responsesByQuestion).map(([questionId, responses]) => (
                <div key={questionId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{questionId}</h4>
                    <Badge variant="secondary">{responses?.length || 0} responses</Badge>
                  </div>
                  <div className="space-y-2">
                    {(responses || []).slice(0, 5).map((response, index) => (
                      <div key={index} className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded">
                        <span className="font-medium">User {response.userId}:</span> {response.response}
                        <span className="text-gray-500 text-xs ml-2">
                          {new Date(response.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                    {(responses?.length || 0) > 5 && (
                      <p className="text-sm text-gray-500">
                        +{(responses?.length || 0) - 5} more responses
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No form responses yet</p>
              <p className="text-sm text-gray-400">Responses will appear here once users start submitting the onboarding form</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}