import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HotelMaincroSubcroView } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, FilterX } from "lucide-react";

export function HotelMaincroSubcroViewComponent() {
  const [maincroFilter, setMaincroFilter] = useState<string>("");
  const [subcroFilter, setSubcroFilter] = useState<string>("");
  
  // Get distinct maincros for dropdown options
  const {
    data: maincros = [],
    isLoading: isLoadingMaincros,
  } = useQuery<string[]>({
    queryKey: ["/api/maincro"],
  });
  
  // Get distinct subcros for the selected maincro
  const {
    data: subcros = [],
    isLoading: isLoadingSubcros,
  } = useQuery<{ id: number; subcro: string }[]>({
    queryKey: ["/api/subcro/list", maincroFilter],
    queryFn: async () => {
      if (!maincroFilter) return [];
      const res = await fetch(`/api/subcro/list?maincro=${maincroFilter}`, { credentials: "include" });
      if (!res.ok) {
        throw new Error(`Error fetching subcros: ${res.statusText}`);
      }
      return res.json();
    },
    enabled: !!maincroFilter,
  });
  
  // Fetch view data
  const {
    data: viewData = [],
    isLoading: isLoadingView,
    refetch: refetchView,
  } = useQuery<HotelMaincroSubcroView[]>({
    queryKey: ["/api/hotel-view", maincroFilter, subcroFilter],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (maincroFilter) queryParams.append("maincro", maincroFilter);
      if (subcroFilter) queryParams.append("subcro", subcroFilter);
      
      const res = await fetch(`/api/hotel-view?${queryParams}`, { credentials: "include" });
      if (!res.ok) {
        throw new Error(`Error fetching hotel view: ${res.statusText}`);
      }
      return res.json();
    },
  });
  
  const handleFilterApply = () => {
    refetchView();
  };
  
  const handleFilterReset = () => {
    setMaincroFilter("");
    setSubcroFilter("");
    setTimeout(() => {
      refetchView();
    }, 0);
  };
  
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Hotel MainCro SubCro View</h1>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Filter Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-grow-0 w-64">
              <label className="block text-sm font-medium text-slate-700 mb-1">Filter by MainCro</label>
              <Select
                value={maincroFilter}
                onValueChange={(value) => {
                  if (value === "all-maincros") {
                    setMaincroFilter("");
                  } else {
                    setMaincroFilter(value);
                  }
                  setSubcroFilter(""); // Reset subcro when maincro changes
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All MainCro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-maincros">All MainCro</SelectItem>
                  {isLoadingMaincros ? (
                    <div className="flex justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    maincros.map((maincro) => (
                      <SelectItem key={maincro} value={maincro}>
                        {maincro}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-grow-0 w-64">
              <label className="block text-sm font-medium text-slate-700 mb-1">Filter by SubCro</label>
              <Select
                value={subcroFilter}
                onValueChange={(value) => {
                  if (value === "all-subcros") {
                    setSubcroFilter("");
                  } else {
                    setSubcroFilter(value);
                  }
                }}
                disabled={!maincroFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All SubCro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-subcros">All SubCro</SelectItem>
                  {isLoadingSubcros ? (
                    <div className="flex justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    subcros.map((subcro) => (
                      <SelectItem key={subcro.id} value={subcro.subcro}>
                        {subcro.subcro}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-grow-0 flex items-end space-x-2">
              <Button onClick={handleFilterApply}>Apply Filters</Button>
              <Button 
                variant="outline" 
                onClick={handleFilterReset}
                className="flex items-center"
              >
                <FilterX className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {isLoadingView ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable
          data={viewData}
          columns={[
            { key: "codeHotel", header: "Hotel Code", sortable: true },
            { key: "subcroId", header: "SubCro ID", sortable: true },
            { key: "subcro", header: "SubCro", sortable: true },
            { key: "maincro", header: "MainCro", sortable: true },
          ]}
          primaryKey="codeHotel"
          tableName="Hotel MainCro SubCro View"
        />
      )}
    </>
  );
}
