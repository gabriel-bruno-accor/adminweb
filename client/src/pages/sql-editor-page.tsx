import { SqlEditor } from "@/components/ui/sql-editor";
import { Card, CardContent } from "@/components/ui/card";

export default function SqlEditorPage() {
  // Default example queries that users can start with
  const initialQuery = `-- Example: Query the hotel_maincro_subcro view
SELECT h."codeHotel", h."subcroId", s.subcro, s.maincro
FROM public.hotel h
JOIN public.subcro s ON h."subcroId" = s.id
LIMIT 10;

-- Uncomment to try other queries:
-- SELECT * FROM public.subcro WHERE maincro = 'ACCOR';
-- SELECT * FROM public.user_maincro_subcro WHERE maincro = 'ACCOR';`;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">SQL Query Editor</h1>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-slate-500 mb-6">
            Run SQL queries directly against the PostgreSQL database. Use this interface for complex queries, 
            data exploration, or operations not available through the standard interface.
          </p>
          
          <SqlEditor initialQuery={initialQuery} />
        </CardContent>
      </Card>
    </div>
  );
}
