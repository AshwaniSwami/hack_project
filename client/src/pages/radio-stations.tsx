import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/api";
import { colors, getCardStyle, getGradientStyle } from "@/lib/colors";
import { Plus, Edit, Trash2, Radio, Phone, Mail, MapPin, Sparkles, Waves, Antenna, Clock, CheckCircle, XCircle, Search, Eye, MoreHorizontal, Filter } from "lucide-react";
import type { RadioStation } from "@shared/schema";

const radioStationFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contactPerson: z.string().optional(),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
  isActive: z.boolean().default(true),
});

type RadioStationFormData = z.infer<typeof radioStationFormSchema>;

export default function RadioStations() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<RadioStation | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: radioStations = [], isLoading } = useQuery<RadioStation[]>({
    queryKey: ["/api/radio-stations"],
  });

  const form = useForm<RadioStationFormData>({
    resolver: zodResolver(radioStationFormSchema),
    defaultValues: {
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: RadioStationFormData) => {
      const payload = {
        ...data,
        contactPerson: data.contactPerson || undefined,
        phone: data.phone || undefined,  
        address: data.address || undefined,
      };
      return apiRequest("POST", "/api/radio-stations", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/radio-stations"] });
      toast({
        title: "Success",
        description: "Radio station created successfully",
      });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create radio station",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: RadioStationFormData) => {
      if (!editingStation) throw new Error("No station selected for editing");
      const payload = {
        ...data,
        contactPerson: data.contactPerson || undefined,
        phone: data.phone || undefined,  
        address: data.address || undefined,
      };
      return apiRequest("PUT", `/api/radio-stations/${editingStation.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/radio-stations"] });
      toast({
        title: "Success",
        description: "Radio station updated successfully",
      });
      setEditingStation(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update radio station",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/radio-stations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/radio-stations"] });
      toast({
        title: "Success",
        description: "Radio station deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete radio station",
        variant: "destructive",
      });
    },
  });

  const filteredStations = radioStations.filter(station => {
    const matchesSearch = station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      station.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (station.contactPerson && station.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && station.isActive) ||
      (statusFilter === "inactive" && !station.isActive);
    
    return matchesSearch && matchesStatus;
  });

  const onSubmit = (data: RadioStationFormData) => {
    if (editingStation) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (station: RadioStation) => {
    setEditingStation(station);
    form.reset({
      name: station.name,
      contactPerson: station.contactPerson || "",
      email: station.email,
      phone: station.phone || "",
      address: station.address || "",
      isActive: station.isActive || true,
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this radio station?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className={`min-h-screen ${getGradientStyle('main')} relative`}>
      <div className="floating-bg"></div>
      {/* Enhanced Header */}
      <div className={`relative overflow-hidden ${getCardStyle('accent')} backdrop-blur-sm shadow-lg border-b ${colors.border.accent}`}>
        <div className={`absolute inset-0 ${getGradientStyle('header')}`}></div>
        <div className="relative px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-sky-400 to-rose-400 rounded-xl blur opacity-20"></div>
                  <div className="relative p-3 bg-sky-50 dark:bg-gray-700 backdrop-blur-sm rounded-xl border border-sky-200/50 dark:border-gray-600/50">
                    <Radio className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                  </div>
                </div>
                <div>
                  <h1 className={`text-2xl font-bold ${colors.text.primary} mb-1 ${colors.gradients.text}`}>
                    Radio Stations
                  </h1>
                  <p className="text-slate-600 dark:text-gray-400 text-sm">Manage your radio station partnerships and contacts</p>
                </div>
              </div>
              
              {(user?.role === "admin" || user?.role === "editor") && (
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className={colors.button.primary}>
                      <Plus className="h-5 w-5 mr-3" />
                      New Station
                    </Button>
                  </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
                      {editingStation ? "Edit Radio Station" : "Create New Radio Station"}
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Station Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter station name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="contactPerson"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Person</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter contact person" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter email address" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter phone number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Enter station address" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Active Status
                              </FormLabel>
                              <div className="text-sm text-muted-foreground">
                                Enable this station for content distribution
                              </div>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end space-x-3 pt-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setIsCreateDialogOpen(false);
                            setEditingStation(null);
                            form.reset();
                          }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createMutation.isPending || updateMutation.isPending}
                          className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-lg"
                        >
                          {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Station"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Filter Bar */}
        <div className="mb-8">
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-3 h-5 w-5 text-gray-400 dark:text-gray-500" />
                  <Input
                    placeholder="Search stations by name, contact, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-11 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-sky-500 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <Badge variant="outline" className="bg-gray-50">
                    {filteredStations.length} stations
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Radio Stations Table */}
        {isLoading ? (
          <Card className="bg-white/80 backdrop-blur-md border border-gray-200/50 shadow-xl">
            <CardContent className="p-8">
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex space-x-4">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : filteredStations.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-md border-0 shadow-2xl">
            <CardContent className="text-center py-20">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full blur-lg opacity-25 w-32 h-32 mx-auto"></div>
                <div className="relative p-6 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-full w-32 h-32 mx-auto flex items-center justify-center border border-blue-100">
                  <Radio className="h-16 w-16 text-blue-600" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-3">
                {searchTerm ? "No stations found" : "No radio stations yet"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 text-xl max-w-md mx-auto">
                {searchTerm 
                  ? "Try adjusting your search terms to find stations" 
                  : "Start building your network by adding your first radio station partner"
                }
              </p>
              {!searchTerm && (user?.role === "admin" || user?.role === "editor") && (
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105 px-8 py-3"
                >
                  <Plus className="h-6 w-6 mr-3" />
                  Add Your First Station
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white/80 backdrop-blur-md border border-gray-200/50 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Station</TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Contact</TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Email</TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Phone</TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Created</TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-300 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStations.map((station) => (
                    <TableRow 
                      key={station.id} 
                      className="hover:bg-blue-50/50 transition-colors duration-200 border-b border-gray-100"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg blur opacity-50"></div>
                            <div className="relative p-2 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg">
                              <Radio className="h-4 w-4 text-white" />
                            </div>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-gray-100">{station.name}</div>
                            {station.address && (
                              <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-1">
                                <MapPin className="h-3 w-3 mr-1" />
                                {station.address.length > 30 ? `${station.address.substring(0, 30)}...` : station.address}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {station.contactPerson ? (
                          <div className="flex items-center space-x-2">
                            <Antenna className="h-4 w-4 text-blue-600" />
                            <span className="text-gray-700 dark:text-gray-300">{station.contactPerson}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-emerald-600" />
                          <span className="text-gray-700 dark:text-gray-300">{station.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {station.phone ? (
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-purple-600" />
                            <span className="text-gray-700 dark:text-gray-300">{station.phone}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${
                          station.isActive 
                            ? "bg-green-100 text-green-700 border border-green-200" 
                            : "bg-gray-100 text-gray-700 border border-gray-200"
                        }`}>
                          {station.isActive ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(station.createdAt!).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {(user?.role === "admin" || user?.role === "editor") ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => handleEdit(station)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Station
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(station.id)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Station
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled>
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingStation} onOpenChange={() => setEditingStation(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg">
                <Edit className="h-5 w-5 text-white" />
              </div>
              Edit Radio Station
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Station Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter station name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="contactPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter contact person" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter station address" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Active Status
                      </FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Enable this station for content distribution
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditingStation(null)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                  className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-lg"
                >
                  {updateMutation.isPending ? "Updating..." : "Update Station"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}