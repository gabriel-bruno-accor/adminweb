import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Hotel, Subcro, insertHotelSchema, insertSubcroSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { z } from "zod";

// SubCro form schema with some fields made optional with defaults
const subcroFormSchema = insertSubcroSchema.extend({
  flagcro: z.coerce.number().default(0),
  webcallback: z.coerce.number().default(0),
});

export function HotelTable() {
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [deletingHotel, setDeletingHotel] = useState<Hotel | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAddSubcroDialogOpen, setIsAddSubcroDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Fetch hotels
  const {
    data: hotels = [],
    isLoading: isLoadingHotels,
    error: hotelsError,
  } = useQuery<Hotel[]>({
    queryKey: ["/api/hotel"],
  });
  
  // Fetch subcros for dropdowns
  const {
    data: subcros = [],
    isLoading: isLoadingSubcros,
  } = useQuery<Subcro[]>({
    queryKey: ["/api/subcro"],
  });
  
  // Fetch hotel codes for dropdown
  const {
    data: hotelCodes = [],
    isLoading: isLoadingHotelCodes,
  } = useQuery<string[]>({
    queryKey: ["/api/hotel/codes"],
  });
  
  // SubCro creation mutation
  const createSubcroMutation = useMutation({
    mutationFn: async (data: z.infer<typeof subcroFormSchema>) => {
      const res = await apiRequest("POST", "/api/subcro", data);
      return res.json();
    },
    onSuccess: (newSubcro) => {
      queryClient.invalidateQueries({ queryKey: ["/api/subcro"] });
      setIsAddSubcroDialogOpen(false);
      
      // After creating the subcro, update the hotel form to use this new subcro
      addForm.setValue("subcroId", newSubcro.id);
      
      toast({
        title: "SubCro Added",
        description: "The subcro was added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Add SubCro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // SubCro add form
  const addSubcroForm = useForm<z.infer<typeof subcroFormSchema>>({
    resolver: zodResolver(subcroFormSchema),
    defaultValues: {
      maincro: "",
      subcro: "",
      label: "",
      flagcro: 0,
      webcallback: 0,
    },
  });
  
  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertHotelSchema>) => {
      const res = await apiRequest("POST", "/api/hotel", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hotel"] });
      setIsAddDialogOpen(false);
      toast({
        title: "Hotel Added",
        description: "The hotel was added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Add Hotel",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ codeHotel, data }: { codeHotel: string; data: z.infer<typeof insertHotelSchema> }) => {
      const res = await apiRequest("PUT", `/api/hotel/${codeHotel}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hotel"] });
      setEditingHotel(null);
      toast({
        title: "Hotel Updated",
        description: "The hotel was updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Update Hotel",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (codeHotel: string) => {
      await apiRequest("DELETE", `/api/hotel/${codeHotel}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hotel"] });
      setDeletingHotel(null);
      toast({
        title: "Hotel Deleted",
        description: "The hotel was deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Delete Hotel",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Add form
  const addForm = useForm<z.infer<typeof insertHotelSchema>>({
    resolver: zodResolver(insertHotelSchema),
    defaultValues: {
      codeHotel: "",
      subcroId: undefined,
    },
  });
  
  // Edit form
  const editForm = useForm<z.infer<typeof insertHotelSchema>>({
    resolver: zodResolver(insertHotelSchema),
    defaultValues: {
      codeHotel: "",
      subcroId: 0,
    },
  });
  
  // Update editForm when editingHotel changes
  useEffect(() => {
    if (editingHotel) {
      editForm.reset({
        codeHotel: editingHotel.codeHotel,
        subcroId: editingHotel.subcroId,
      });
    }
  }, [editingHotel, editForm]);
  
  const handleAddSubmit = (data: z.infer<typeof insertHotelSchema>) => {
    createMutation.mutate(data);
  };
  
  const handleEditSubmit = (data: z.infer<typeof insertHotelSchema>) => {
    if (editingHotel) {
      updateMutation.mutate({
        codeHotel: editingHotel.codeHotel,
        data,
      });
    }
  };
  
  const handleDelete = () => {
    if (deletingHotel) {
      deleteMutation.mutate(deletingHotel.codeHotel);
    }
  };
  
  const handleAddSubcroSubmit = (data: z.infer<typeof subcroFormSchema>) => {
    createSubcroMutation.mutate(data);
  };
  
  if (isLoadingHotels) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (hotelsError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        Error loading hotels: {hotelsError.message}
      </div>
    );
  }
  
  // Find associated subcro data
  const getSubcroInfo = (subcroId: number) => {
    const subcro = subcros.find(s => s.id === subcroId);
    return subcro ? {
      subcro: subcro.subcro,
      maincro: subcro.maincro,
      label: subcro.label || 'N/A',
      flagcro: subcro.flagcro || 0,
      webcallback: subcro.webcallback || 0
    } : null;
  };
  
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Hotel Management</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Hotel
        </Button>
      </div>
      
      <DataTable
        data={hotels}
        columns={[
          { key: "codeHotel", header: "Hotel Code", sortable: true },
          { key: "subcroId", header: "SubCro ID", sortable: true },
          { 
            key: "subcroId", 
            header: "SubCro", 
            render: (row) => {
              const subcroInfo = getSubcroInfo(row.subcroId);
              return subcroInfo ? subcroInfo.subcro : 'N/A';
            }
          },
          { 
            key: "subcroId", 
            header: "MainCro", 
            render: (row) => {
              const subcroInfo = getSubcroInfo(row.subcroId);
              return subcroInfo ? subcroInfo.maincro : 'N/A';
            }
          },
        ]}
        onEdit={(hotel) => setEditingHotel(hotel)}
        onDelete={(hotel) => setDeletingHotel(hotel)}
        primaryKey="codeHotel"
        tableName="Hotel"
      />
      
      {/* Add Hotel Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Hotel</DialogTitle>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(handleAddSubmit)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="codeHotel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hotel Code</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value)}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a Hotel Code" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingHotelCodes ? (
                          <div className="flex justify-center p-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        ) : hotelCodes.length === 0 ? (
                          <div className="p-2 text-sm text-slate-500 text-center">No hotel codes available</div>
                        ) : (
                          hotelCodes.map((code) => (
                            <SelectItem key={code} value={code}>
                              {code}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="subcroId"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>SubCro</FormLabel>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setIsAddSubcroDialogOpen(true)}
                        className="h-8 px-2 text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Create New SubCro
                      </Button>
                    </div>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a SubCro" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingSubcros ? (
                          <div className="flex justify-center p-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        ) : (
                          subcros.map((subcro) => (
                            <SelectItem key={subcro.id} value={subcro.id.toString()}>
                              {subcro.id} - {subcro.subcro} ({subcro.maincro})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Hotel
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Hotel Dialog */}
      <Dialog open={!!editingHotel} onOpenChange={(open) => !open && setEditingHotel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Hotel</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="codeHotel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hotel Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 0666" {...field} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="subcroId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SubCro</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a SubCro" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingSubcros ? (
                          <div className="flex justify-center p-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        ) : (
                          subcros.map((subcro) => (
                            <SelectItem key={subcro.id} value={subcro.id.toString()}>
                              {subcro.id} - {subcro.subcro} ({subcro.maincro})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {editingHotel && (
                <div className="bg-slate-50 rounded-md p-4 space-y-3">
                  <div className="text-sm font-medium text-slate-700 mb-2">Associated Data</div>
                  {(() => {
                    const subcroInfo = getSubcroInfo(editingHotel.subcroId);
                    if (!subcroInfo) return <div className="text-sm text-slate-500">No associated data available</div>;
                    
                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">MainCro:</span>
                          <span className="text-sm font-medium text-slate-800">{subcroInfo.maincro}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">SubCro:</span>
                          <span className="text-sm font-medium text-slate-800">{subcroInfo.subcro}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Label:</span>
                          <span className="text-sm font-medium text-slate-800">{subcroInfo.label}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Flag CRO:</span>
                          <span className="text-sm font-medium text-slate-800">{subcroInfo.flagcro}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Web Callback:</span>
                          <span className="text-sm font-medium text-slate-800">{subcroInfo.webcallback}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingHotel(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingHotel} onOpenChange={(open) => !open && setDeletingHotel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the hotel with code{" "}
              <span className="font-semibold">{deletingHotel?.codeHotel}</span>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Add SubCro Dialog */}
      <Dialog open={isAddSubcroDialogOpen} onOpenChange={setIsAddSubcroDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New SubCro</DialogTitle>
          </DialogHeader>
          <Form {...addSubcroForm}>
            <form onSubmit={addSubcroForm.handleSubmit(handleAddSubcroSubmit)} className="space-y-4">

              
              <FormField
                control={addSubcroForm.control}
                name="maincro"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>MainCro</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. ACCOR" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addSubcroForm.control}
                name="subcro"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SubCro</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. IBH" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addSubcroForm.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Label</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Ibis Hotels" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addSubcroForm.control}
                name="flagcro"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Flag CRO</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value === 1}
                        onCheckedChange={(checked) => field.onChange(checked ? 1 : 0)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={addSubcroForm.control}
                name="webcallback"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Web Callback</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value === 1}
                        onCheckedChange={(checked) => field.onChange(checked ? 1 : 0)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddSubcroDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createSubcroMutation.isPending}>
                  {createSubcroMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create SubCro
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
