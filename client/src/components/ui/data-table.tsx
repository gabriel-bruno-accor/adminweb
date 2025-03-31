import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Info, ChevronLeft, ChevronRight, Filter, X } from "lucide-react";
import { ExportButtons } from "@/components/ui/export-buttons";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type SortDirection = "asc" | "desc";

interface SortConfig {
  key: string;
  direction: SortDirection;
}

interface DataTableProps<T> {
  data: T[];
  columns: {
    key: keyof T;
    header: string;
    sortable?: boolean;
    render?: (row: T) => React.ReactNode;
  }[];
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onInfo?: (row: T) => void;
  primaryKey: keyof T;
  tableName: string;
}

export function DataTable<T>({
  data,
  columns,
  onEdit,
  onDelete,
  onInfo,
  primaryKey,
  tableName,
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Apply filters to data
  const filteredData = [...data].filter(row => {
    return Object.entries(filters).every(([key, value]) => {
      if (!value) return true;
      
      const cellValue = String(row[key as keyof T] || '').toLowerCase();
      return cellValue.includes(value.toLowerCase());
    });
  });

  // Apply sorting to filtered data
  const sortedData = [...filteredData];
  if (sortConfig) {
    sortedData.sort((a, b) => {
      const aValue = a[sortConfig.key as keyof T];
      const bValue = b[sortConfig.key as keyof T];
      
      if (aValue === bValue) return 0;
      
      if (sortConfig.direction === "asc") {
        return aValue < bValue ? -1 : 1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }
  
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      
      // Update active filters list
      const newActiveFilters = Object.entries(newFilters)
        .filter(([_, v]) => v !== '')
        .map(([k, _]) => k);
      
      setActiveFilters(newActiveFilters);
      
      return newFilters;
    });
  };

  const handleSort = (key: keyof T) => {
    let direction: SortDirection = "asc";
    
    if (sortConfig && sortConfig.key === key) {
      direction = sortConfig.direction === "asc" ? "desc" : "asc";
    }
    
    setSortConfig({ key: key as string, direction });
  };

  // Calculate pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handleExport = (format: 'csv' | 'json') => {
    let output = '';
    const filename = `${tableName}_export_${new Date().toISOString().split('T')[0]}.${format}`;
    
    if (format === 'csv') {
      // Headers
      output = columns.map(col => col.header).join(',') + '\n';
      
      // Rows
      data.forEach(row => {
        output += columns.map(col => {
          const value = row[col.key];
          // Wrap in quotes if it's a string and might contain commas
          return typeof value === 'string' ? `"${value}"` : value;
        }).join(',') + '\n';
      });
    } else {
      // JSON format
      output = JSON.stringify(data, null, 2);
    }
    
    // Create and trigger download
    const blob = new Blob([output], { type: format === 'csv' ? 'text/csv' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="flex flex-col gap-2 px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">{tableName} Data</h2>
          <ExportButtons onExport={handleExport} />
        </div>
        
        {activeFilters.length > 0 && (
          <div className="flex items-center text-sm">
            <span className="text-muted-foreground">
              <span className="font-medium text-primary">{activeFilters.length}</span> filter{activeFilters.length > 1 ? 's' : ''} active, 
              showing <span className="font-medium text-primary">{filteredData.length}</span> of <span className="font-medium">{data.length}</span> records
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-2 h-7 px-2 text-xs"
              onClick={() => {
                setFilters({});
                setActiveFilters([]);
              }}
            >
              <X className="h-3 w-3 mr-1" />
              Clear All
            </Button>
          </div>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key as string} className="px-6 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      {column.sortable ? (
                        <div 
                          className="flex items-center space-x-1 cursor-pointer"
                          onClick={() => handleSort(column.key)}
                        >
                          <span>{column.header}</span>
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-4 w-4" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth="2" 
                              d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                            />
                          </svg>
                        </div>
                      ) : (
                        <span>{column.header}</span>
                      )}
                    </div>
                    
                    {/* Filter Popover */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className={activeFilters.includes(column.key as string) 
                            ? "text-primary" 
                            : "text-muted-foreground hover:text-primary"
                          }
                        >
                          <Filter className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0" align="start">
                        <div className="p-4 space-y-2">
                          <h4 className="font-medium text-sm">Filter {column.header}</h4>
                          <div className="flex items-center space-x-2">
                            <Input
                              placeholder={`Filter by ${column.header.toLowerCase()}...`}
                              value={filters[column.key as string] || ''}
                              onChange={(e) => handleFilterChange(column.key as string, e.target.value)}
                              className="text-sm"
                            />
                            {filters[column.key as string] && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleFilterChange(column.key as string, '')}
                                className="flex-shrink-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </TableHead>
              ))}
              {(onEdit || onDelete || onInfo) && (
                <TableHead className="px-6 py-3 text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((row) => (
              <TableRow 
                key={String(row[primaryKey])} 
                className="hover:bg-slate-50"
              >
                {columns.map((column) => (
                  <TableCell 
                    key={`${String(row[primaryKey])}-${column.key as string}`}
                    className="px-6 py-4 whitespace-nowrap"
                  >
                    {column.render ? column.render(row) : String(row[column.key] ?? '')}
                  </TableCell>
                ))}
                {(onEdit || onDelete || onInfo) && (
                  <TableCell className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(row)}
                          className="text-primary hover:text-primary/80 transition"
                        >
                          <Pencil className="h-5 w-5" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(row)}
                          className="text-red-500 hover:text-red-700 transition"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      )}
                      {onInfo && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onInfo(row)}
                          className="text-slate-500 hover:text-slate-700 transition"
                        >
                          <Info className="h-5 w-5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="px-6 py-4 bg-white border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-700">
            Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
            <span className="font-medium">
              {Math.min(startIndex + itemsPerPage, sortedData.length)}
            </span>{" "}
            of <span className="font-medium">{sortedData.length}</span> results
            {activeFilters.length > 0 && (
              <> (filtered from <span className="font-medium">{data.length}</span> total)</>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                
                // Adjust visible range of page numbers for large datasets
                if (totalPages > 5) {
                  if (currentPage > 3) {
                    if (i === 0) {
                      pageNum = 1;
                    } else if (i === 1) {
                      return (
                        <span
                          key="ellipsis-start"
                          className="w-8 h-8 flex items-center justify-center text-sm text-slate-700"
                        >
                          ...
                        </span>
                      );
                    } else if (i === 2) {
                      pageNum = currentPage;
                    } else if (i === 3) {
                      if (currentPage + 1 <= totalPages) {
                        pageNum = currentPage + 1;
                      } else {
                        return null;
                      }
                    } else {
                      if (totalPages > currentPage + 1) {
                        return (
                          <span
                            key="ellipsis-end"
                            className="w-8 h-8 flex items-center justify-center text-sm text-slate-700"
                          >
                            ...
                          </span>
                        );
                      } else {
                        pageNum = totalPages;
                      }
                    }
                  }
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="icon"
                    className="w-8 h-8"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <>
                  <span className="w-8 h-8 flex items-center justify-center text-sm text-slate-700">
                    ...
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-8 h-8"
                    onClick={() => setCurrentPage(totalPages)}
                  >
                    {totalPages}
                  </Button>
                </>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
