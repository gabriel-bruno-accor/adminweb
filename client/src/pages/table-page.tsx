import { useState, useEffect } from "react";
import { HotelTable } from "@/components/tables/hotel-table";
import { SubcroTable } from "@/components/tables/subcro-table";
import { UserTable } from "@/components/tables/user-table";
import { useRoute } from "wouter";

export default function TablePage() {
  const [, params] = useRoute("/tables/:tableType");
  const [tableType, setTableType] = useState<string | null>(null);
  
  useEffect(() => {
    if (params && params.tableType) {
      setTableType(params.tableType);
    }
  }, [params]);
  
  // Render different table component based on tableType
  const renderTable = () => {
    switch (tableType) {
      case "hotel":
        return <HotelTable />;
      case "subcro":
        return <SubcroTable />;
      case "user":
        return <UserTable />;
      default:
        return (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-md">
            <h3 className="font-medium">Invalid Table Type</h3>
            <p>Please select a valid table from the sidebar.</p>
          </div>
        );
    }
  };
  
  return (
    <>
      {renderTable()}
    </>
  );
}
