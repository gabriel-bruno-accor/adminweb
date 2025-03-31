import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Subcro, insertSubcroSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { Switch } from "@/components/ui/switch";

// The schema should match what's in the shared schema (without ID)
const subcroFormSchema = insertSubcroSchema.extend({
  flagcro: z.coerce.number().optional(),
  webcallback: z.coerce.number().optional(),
});

export function SubcroTable() {
  const [editingSubcro, setEditingSubcro] = useState<Subcro | null>(null);
  const [deletingSubcro, setDeletingSubcro] = useState<Subcro | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Fetch subcros
  const {
    data: subcros = [],
    isLoading: isLoadingSubcros,
    error: subcrosError,
  } = useQuery<Subcro[]>({
    queryKey: ["/api/subcro"],
  });
  
  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof subcroFormSchema>) => {
      const res = await apiRequest("POST", "/api/subcro", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subcro"] });
      setIsAddDialogOpen(false);
      toast({
        title: "Subcro Added",
        description: "The subcro was added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Add Subcro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof subcroFormSchema> }) => {
      const res = await apiRequest("PUT", `/api/subcro/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subcro"] });
      setEditingSubcro(null);
      toast({
        title: "Subcro Updated",
        description: "The subcro was updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Update Subcro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/subcro/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subcro"] });
      setDeletingSubcro(null);
      toast({
        title: "Subcro Deleted",
        description: "The subcro was deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Delete Subcro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Add form
  const addForm = useForm<z.infer<typeof subcroFormSchema>>({
    resolver: zodResolver(subcroFormSchema),
    defaultValues: {
      maincro: "",
      subcro: "",
      label: "",
      flagcro: 0,
      webcallback: 0,
    },
  });
  
  // Edit form
  const editForm = useForm<z.infer<typeof subcroFormSchema>>({
    resolver: zodResolver(subcroFormSchema),
    defaultValues: {
      maincro: "",
      subcro: "",
      label: "",
      flagcro: 0,
      webcallback: 0,
    },
  });
  
  // Update editForm when editingSubcro changes
  useEffect(() => {
    if (editingSubcro) {
      editForm.reset({
        maincro: editingSubcro.maincro,
        subcro: editingSubcro.subcro,
        label: editingSubcro.label || "",
        flagcro: editingSubcro.flagcro ?? 0,
        webcallback: editingSubcro.webcallback ?? 0,
      });
    }
  }, [editingSubcro, editForm]);
  
  const handleAddSubmit = (data: z.infer<typeof subcroFormSchema>) => {
    createMutation.mutate(data);
  };
  
  const handleEditSubmit = (data: z.infer<typeof subcroFormSchema>) => {
    if (editingSubcro) {
      updateMutation.mutate({
        id: editingSubcro.id,
        data,
      });
    }
  };
  
  const handleDelete = () => {
    if (deletingSubcro) {
      deleteMutation.mutate(deletingSubcro.id);
    }
  };
  
  if (isLoadingSubcros) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (subcrosError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        Error loading subcros: {subcrosError.message}
      </div>
    );
  }
  
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Subcro Management</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Subcro
        </Button>
      </div>
      
      <DataTable
        data={subcros}
        columns={[
          { key: "id", header: "ID", sortable: true },
          { key: "maincro", header: "MainCro", sortable: true },
          { key: "subcro", header: "SubCro", sortable: true },
          { key: "label", header: "Label", sortable: true },
          { 
            key: "flagcro", 
            header: "Flag CRO", 
            sortable: true,
            render: (row) => (
              <span className={row.flagcro === 1 ? "text-green-600" : "text-red-600"}>
                {row.flagcro === 1 ? "Enabled" : "Disabled"}
              </span>
            )
          },
          { 
            key: "webcallback", 
            header: "Web Callback", 
            sortable: true,
            render: (row) => (
              <span className={row.webcallback === 1 ? "text-green-600" : "text-red-600"}>
                {row.webcallback === 1 ? "Enabled" : "Disabled"}
              </span>
            )
          },
        ]}
        onEdit={(subcro) => setEditingSubcro(subcro)}
        onDelete={(subcro) => setDeletingSubcro(subcro)}
        primaryKey="id"
        tableName="Subcro"
      />
      
      {/* Add Subcro Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Subcro</DialogTitle>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(handleAddSubmit)} className="space-y-4">
              {/* ID is auto-generated on the server */}
              
              <FormField
                control={addForm.control}
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
                control={addForm.control}
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
                control={addForm.control}
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
                control={addForm.control}
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
                control={addForm.control}
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
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Subcro
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Subcro Dialog */}
      <Dialog open={!!editingSubcro} onOpenChange={(open) => !open && setEditingSubcro(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subcro</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              {/* Display ID (read-only) */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">ID</label>
                <div className="p-2 border rounded-md bg-gray-50">
                  {editingSubcro?.id}
                </div>
              </div>
              
              <FormField
                control={editForm.control}
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
                control={editForm.control}
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
                control={editForm.control}
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
                control={editForm.control}
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
                control={editForm.control}
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
                <Button type="button" variant="outline" onClick={() => setEditingSubcro(null)}>
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
      <AlertDialog open={!!deletingSubcro} onOpenChange={(open) => !open && setDeletingSubcro(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the subcro with ID{" "}
              <span className="font-semibold">{deletingSubcro?.id}</span> and name{" "}
              <span className="font-semibold">{deletingSubcro?.subcro}</span>. This action cannot be undone.
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
    </>
  );
}
