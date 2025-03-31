import { useState, useEffect } from "react";
import { HotelMaincroSubcroViewComponent } from "@/components/views/hotel-maincro-subcro-view";
import { UserMaincroSubcroViewComponent } from "@/components/views/user-maincro-subcro-view";
import { useRoute } from "wouter";

export default function ViewPage() {
  const [, params] = useRoute("/views/:viewType");
  const [viewType, setViewType] = useState<string | null>(null);
  
  useEffect(() => {
    if (params && params.viewType) {
      setViewType(params.viewType);
    }
  }, [params]);
  
  // Render different view component based on viewType
  const renderView = () => {
    switch (viewType) {
      case "hotel-maincro-subcro":
        return <HotelMaincroSubcroViewComponent />;
      case "user-maincro-subcro":
        return <UserMaincroSubcroViewComponent />;
      default:
        return (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-md">
            <h3 className="font-medium">Invalid View Type</h3>
            <p>Please select a valid view from the sidebar.</p>
          </div>
        );
    }
  };
  
  return (
    <>
      {renderView()}
    </>
  );
}
