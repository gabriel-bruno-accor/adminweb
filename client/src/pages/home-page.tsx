import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Hotel, Subcro, UserMaincroSubcroView } from "@shared/schema";
import { Loader2, Database, Users, Home, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

export default function HomePage() {
  const [stats, setStats] = useState({
    hotelCount: 0,
    subcroCount: 0,
    userCount: 0,
    mainCroCount: 0
  });
  
  const [chartData, setChartData] = useState<any[]>([]);

  const { 
    data: hotels = [],
    isLoading: isLoadingHotels
  } = useQuery<Hotel[]>({
    queryKey: ["/api/hotel"],
  });
  
  const { 
    data: subcros = [],
    isLoading: isLoadingSubcros
  } = useQuery<Subcro[]>({
    queryKey: ["/api/subcro"],
  });
  
  const { 
    data: userView = [],
    isLoading: isLoadingUserView
  } = useQuery<UserMaincroSubcroView[]>({
    queryKey: ["/api/user-view"],
  });

  useEffect(() => {
    if (hotels.length && subcros.length && userView.length) {
      // Calculate stats
      const uniqueMainCros = new Set(subcros.map(s => s.maincro));
      
      setStats({
        hotelCount: hotels.length,
        subcroCount: subcros.length,
        userCount: Array.from(new Set(userView.map(u => u.id))).length,
        mainCroCount: uniqueMainCros.size
      });
      
      // Prepare chart data
      const mainCroData: Record<string, number> = {};
      hotels.forEach(hotel => {
        const subcro = subcros.find(s => s.id === hotel.subcroId);
        if (subcro) {
          mainCroData[subcro.maincro] = (mainCroData[subcro.maincro] || 0) + 1;
        }
      });
      
      const chartItems = Object.entries(mainCroData)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      
      setChartData(chartItems);
    }
  }, [hotels, subcros, userView]);

  const isLoading = isLoadingHotels || isLoadingSubcros || isLoadingUserView;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Hotels</p>
                <h3 className="text-3xl font-bold mt-1">{stats.hotelCount}</h3>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                <Home className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total SubCROs</p>
                <h3 className="text-3xl font-bold mt-1">{stats.subcroCount}</h3>
              </div>
              <div className="h-12 w-12 bg-violet-100 rounded-full flex items-center justify-center text-violet-600">
                <Database className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Users</p>
                <h3 className="text-3xl font-bold mt-1">{stats.userCount}</h3>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Main CROs</p>
                <h3 className="text-3xl font-bold mt-1">{stats.mainCroCount}</h3>
              </div>
              <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                <BarChart3 className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Hotels by MainCRO</CardTitle>
            <CardDescription>Distribution of hotels across main CRO categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={60}
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>MainCRO Distribution</CardTitle>
            <CardDescription>Available MainCRO identifiers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(subcros.map(s => s.maincro))).sort().map(maincro => (
                <Badge key={maincro} variant="outline" className="text-xs px-2.5 py-1">
                  {maincro}
                </Badge>
              ))}
            </div>
            
            <div className="mt-8">
              <h4 className="text-sm font-semibold mb-3">Recent Subcros:</h4>
              <table className="w-full text-sm">
                <thead className="bg-slate-100 text-xs text-slate-600">
                  <tr>
                    <th className="py-2 pl-2 text-left font-medium">Subcro</th>
                    <th className="py-2 text-left font-medium">Label</th>
                    <th className="py-2 pr-2 text-right font-medium">MainCro</th>
                  </tr>
                </thead>
                <tbody>
                  {subcros.slice(0, 5).map(subcro => (
                    <tr key={subcro.id} className="border-b border-slate-100">
                      <td className="py-2 pl-2 font-medium">{subcro.subcro}</td>
                      <td className="py-2 text-slate-500">{subcro.label || 'No label'}</td>
                      <td className="py-2 pr-2 text-right">
                        <Badge variant="outline" className="ml-auto">{subcro.maincro}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
