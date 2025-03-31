import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { User, insertUserSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Upload } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/ui/file-upload";
import { z } from "zod";

export function UserTable() {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isBulkUploadDialogOpen, setIsBulkUploadDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Get distinct maincros for dropdown options
  const {
    data: unfilteredMaincros = [],
    isLoading: isLoadingMaincros,
  } = useQuery<string[]>({
    queryKey: ["/api/maincro"],
  });
  
  // Filter out empty strings
  const maincros = unfilteredMaincros.filter(maincro => maincro.trim() !== '');
  
  // Fetch users
  const {
    data: users = [],
    isLoading: isLoadingUsers,
    error: usersError,
  } = useQuery<User[]>({
    queryKey: ["/api/user/all"],
    queryFn: async () => {
      const res = await fetch("/api/user/all", { credentials: "include" });
      if (!res.ok) {
        throw new Error(`Error fetching users: ${res.statusText}`);
      }
      return res.json();
    },
  });
  
  // Create user schema with password confirmation
  const createUserSchema = insertUserSchema.extend({
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
  
  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createUserSchema>) => {
      // Remove confirmPassword before sending to server
      const { confirmPassword, ...userData } = data;
      const res = await apiRequest("POST", "/api/register", userData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/all"] });
      setIsAddDialogOpen(false);
      toast({
        title: "User Added",
        description: "The user was added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Add User",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Omit<User, "id"> }) => {
      const res = await apiRequest("PUT", `/api/user/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/all"] });
      setEditingUser(null);
      toast({
        title: "User Updated",
        description: "The user was updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Update User",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/user/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/all"] });
      setDeletingUser(null);
      toast({
        title: "User Deleted",
        description: "The user was deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Delete User",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Bulk upload mutation
  const bulkUploadMutation = useMutation({
    mutationFn: async (users: any[]) => {
      const res = await apiRequest("POST", "/api/user/bulk", users);
      return res.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/all"] });
      setIsBulkUploadDialogOpen(false);
      toast({
        title: "Bulk Upload Complete",
        description: `${result.success} users added successfully. ${result.failed} failed.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Bulk Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Add form
  const addForm = useForm<z.infer<typeof createUserSchema>>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      email: "",
      maincro: "",
    },
  });
  
  // Edit form
  const editForm = useForm<Omit<User, "id">>({
    resolver: zodResolver(insertUserSchema.omit({ password: true })),
    defaultValues: {
      username: "",
      email: "",
      maincro: "",
    },
  });
  
  // Update editForm when editingUser changes
  useEffect(() => {
    if (editingUser) {
      editForm.reset({
        username: editingUser.username,
        email: editingUser.email,
        maincro: editingUser.maincro,
      });
    }
  }, [editingUser, editForm]);
  
  const handleAddSubmit = (data: z.infer<typeof createUserSchema>) => {
    createMutation.mutate(data);
  };
  
  const handleEditSubmit = (data: Omit<User, "id">) => {
    if (editingUser) {
      updateMutation.mutate({
        id: editingUser.id,
        data,
      });
    }
  };
  
  const handleDelete = () => {
    if (deletingUser) {
      deleteMutation.mutate(deletingUser.id);
    }
  };
  
  const handleBulkUpload = async (data: any[]) => {
    try {
      // Ensure data has the required fields
      const validatedData = data.map(item => ({
        username: item.username || '',
        password: item.password || '',
        email: item.email || '',
        maincro: item.maincro || ''
      }));
      
      bulkUploadMutation.mutate(validatedData);
      return Promise.resolve();
    } catch (error) {
      console.error("Error processing bulk data:", error);
      toast({
        title: "Data Processing Error",
        description: error instanceof Error ? error.message : "Invalid data format",
        variant: "destructive",
      });
      return Promise.reject(error);
    }
  };
  
  if (isLoadingUsers) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (usersError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        Error loading users: {usersError.message}
      </div>
    );
  }
  
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsBulkUploadDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Bulk Upload
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>
      
      <DataTable
        data={users}
        columns={[
          { key: "id", header: "ID", sortable: true },
          { key: "username", header: "Username", sortable: true },
          { key: "email", header: "Email", sortable: true },
          { key: "maincro", header: "MainCro", sortable: true },
        ]}
        onEdit={(user) => setEditingUser(user)}
        onDelete={(user) => setDeletingUser(user)}
        primaryKey="id"
        tableName="User"
      />
      
      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(handleAddSubmit)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="username" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="user@example.com" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="maincro"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>MainCro</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a MainCro" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} value={field.value || ''} />
                    </FormControl>
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
                  Add User
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="username" {...field} value={field.value || ''} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="user@example.com" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="maincro"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>MainCro</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a MainCro" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
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
      <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user{" "}
              <span className="font-semibold">{deletingUser?.username}</span>. This action cannot be undone.
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
      
      {/* Bulk Upload Dialog */}
      <Dialog open={isBulkUploadDialogOpen} onOpenChange={setIsBulkUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Upload Users</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>Upload a CSV or JSON file containing user records.</p>
              <p className="mt-1">File should contain columns: <code className="bg-muted px-1 py-0.5 rounded">username</code>, <code className="bg-muted px-1 py-0.5 rounded">password</code>, <code className="bg-muted px-1 py-0.5 rounded">email</code>, and <code className="bg-muted px-1 py-0.5 rounded">maincro</code>.</p>
            </div>
            
            <div className="p-4 border border-border rounded-md">
              <FileUpload
                onDataReady={handleBulkUpload}
                buttonText="Upload Users File"
                accept=".csv,.json"
                disabled={bulkUploadMutation.isPending}
              />
            </div>
            
            <div className="bg-muted p-3 rounded-md text-xs mt-4">
              <p className="font-semibold mb-1">Example CSV format:</p>
              <pre className="whitespace-pre-wrap">
                username,password,email,maincro<br/>
                user1,password123,user1@example.com,YHO<br/>
                user2,securepass,user2@example.com,BXO<br/>
              </pre>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsBulkUploadDialogOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
