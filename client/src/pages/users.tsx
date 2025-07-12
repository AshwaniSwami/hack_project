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
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Edit, 
  Trash2, 
  User, 
  Search, 
  Mail, 
  Users as UsersIcon, 
  Sparkles, 
  Shield, 
  Crown, 
  Clock, 
  MoreHorizontal, 
  CheckCircle, 
  XCircle, 
  UserCheck, 
  UserX, 
  AlertTriangle 
} from "lucide-react";
import type { User as UserType } from "@shared/schema";

const userFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").optional(),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(["admin", "editor", "member"]),
});

type UserFormData = z.infer<typeof userFormSchema>;

export default function Users() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const { data: pendingUsers = [], isLoading: isPendingLoading } = useQuery<UserType[]>({
    queryKey: ["/api/admin/users/pending"],
  });

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      role: "member" as const,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      return apiRequest("POST", "/api/users", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User created successfully",
      });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      if (!editingUser) throw new Error("No user selected for editing");
      return apiRequest("PUT", `/api/users/${editingUser.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User updated successfully",
      });
      setEditingUser(null);
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const verifyUserMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/admin/users/${id}/verify`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users/pending"] });
      toast({
        title: "Success",
        description: "User verified successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to verify user",
        variant: "destructive",
      });
    },
  });

  const suspendUserMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/admin/users/${id}/suspend`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User suspended successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to suspend user",
        variant: "destructive",
      });
    },
  });

  const activateUserMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/admin/users/${id}/activate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User activated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to activate user",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UserFormData) => {
    if (editingUser) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (user: UserType) => {
    setEditingUser(user);
    setIsCreateDialogOpen(true);
    form.reset({
      username: user.username || "",
      email: user.email || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      role: (user.role || "member") as "admin" | "editor" | "member",
    });
  };

  const handleCreateNew = () => {
    setEditingUser(null);
    setIsCreateDialogOpen(true);
    form.reset({
      username: "",
      email: "",
      firstName: "",
      lastName: "",
      role: "member" as const,
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleVerifyUser = (id: string) => {
    if (window.confirm("Are you sure you want to verify this user? They will be able to log in.")) {
      verifyUserMutation.mutate(id);
    }
  };

  const handleSuspendUser = (id: string) => {
    if (window.confirm("Are you sure you want to suspend this user? They will not be able to log in.")) {
      suspendUserMutation.mutate(id);
    }
  };

  const handleActivateUser = (id: string) => {
    if (window.confirm("Are you sure you want to activate this user? They will be able to log in.")) {
      activateUserMutation.mutate(id);
    }
  };

  const filteredUsers = users.filter((user) =>
    (user.username?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (user.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (user.firstName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (user.lastName?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

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
                    <UsersIcon className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                  </div>
                </div>
                <div>
                  <h1 className={`text-2xl font-bold ${colors.text.primary} mb-1 ${colors.gradients.text}`}>
                    Users
                  </h1>
                  <p className="text-slate-600 dark:text-gray-400 text-sm">Manage user accounts and permissions</p>
                </div>
              </div>
              
              <Button 
                onClick={handleCreateNew}
                size="lg" 
                className="bg-blue-600 text-white hover:bg-blue-700 shadow-lg transition-all duration-300 hover:scale-105 border-0"
              >
                <Plus className="h-5 w-5 mr-3" />
                New User
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <CardContent className="p-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-3 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-11 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-sky-500 text-gray-900 dark:text-gray-100"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for User Management */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50">
            <TabsTrigger value="all" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-500 data-[state=active]:to-rose-500 data-[state=active]:text-white transition-all duration-300 text-gray-700 dark:text-gray-300">
              <UsersIcon className="h-4 w-4" />
              All Users ({filteredUsers.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-500 data-[state=active]:to-rose-500 data-[state=active]:text-white transition-all duration-300 text-gray-700 dark:text-gray-300">
              <Clock className="h-4 w-4" />
              Pending Verification ({pendingUsers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <Card className="bg-white/80 backdrop-blur-md border border-gray-200/50 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UsersIcon className="h-5 w-5" />
                    All Users
                  </div>
                  <Badge variant="outline" className="bg-gray-50">
                    {filteredUsers.length} users
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="animate-pulse space-y-4 p-8">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex space-x-4">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                      </div>
                    ))}
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="relative mb-8">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full blur-lg opacity-25 w-32 h-32 mx-auto"></div>
                      <div className="relative p-6 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-full w-32 h-32 mx-auto flex items-center justify-center border border-blue-100">
                        <UsersIcon className="h-16 w-16 text-blue-600" />
                      </div>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-3">
                      {searchTerm ? "No users found" : "No users yet"}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-8 text-xl max-w-md mx-auto">
                      {searchTerm 
                        ? "Try adjusting your search terms to find users" 
                        : "Start managing your team by adding the first user"
                      }
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                          <TableHead className="font-semibold text-gray-700 dark:text-gray-300">User</TableHead>
                          <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Email</TableHead>
                          <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Role</TableHead>
                          <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Status</TableHead>
                          <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Created</TableHead>
                          <TableHead className="font-semibold text-gray-700 dark:text-gray-300 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow 
                            key={user.id} 
                            className="hover:bg-blue-50/50 transition-colors duration-200 border-b border-gray-100"
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center space-x-3">
                                <div className="relative">
                                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg blur opacity-50"></div>
                                  <div className="relative p-2 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg">
                                    <User className="h-4 w-4 text-white" />
                                  </div>
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                                    {user.firstName && user.lastName 
                                      ? `${user.firstName} ${user.lastName}` 
                                      : user.username || user.email?.split("@")[0] || "User"}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {user.username && `@${user.username}`} • ID: {user.id.substring(0, 8)}...
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Mail className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-900 dark:text-gray-100">{user.email}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={user.role === 'admin' ? 'default' : user.role === 'editor' ? 'secondary' : 'outline'}
                                className={`
                                  ${user.role === 'admin' ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white' : 
                                    user.role === 'editor' ? 'bg-gradient-to-r from-blue-500 to-emerald-500 text-white' :
                                    'bg-gray-100 text-gray-700'
                                  } text-xs font-medium px-3 py-1
                                `}
                              >
                                {user.role === 'admin' && <Crown className="h-3 w-3 mr-1" />}
                                {user.role === 'editor' && <Edit className="h-3 w-3 mr-1" />}
                                {user.role === 'member' && <User className="h-3 w-3 mr-1" />}
                                {user.role || 'member'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {user.isVerified ? (
                                  <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Verified
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Pending
                                  </Badge>
                                )}
                                {!user.isActive && (
                                  <Badge variant="destructive" className="ml-1">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Suspended
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-600 dark:text-gray-400">
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                <span>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-blue-50">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem onClick={() => handleEdit(user)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit User
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {!user.isVerified && (
                                    <DropdownMenuItem 
                                      onClick={() => handleVerifyUser(user.id)}
                                      className="text-green-600"
                                    >
                                      <UserCheck className="h-4 w-4 mr-2" />
                                      Verify User
                                    </DropdownMenuItem>
                                  )}
                                  {user.isActive ? (
                                    <DropdownMenuItem 
                                      onClick={() => handleSuspendUser(user.id)}
                                      className="text-orange-600"
                                    >
                                      <UserX className="h-4 w-4 mr-2" />
                                      Suspend User
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem 
                                      onClick={() => handleActivateUser(user.id)}
                                      className="text-green-600"
                                    >
                                      <UserCheck className="h-4 w-4 mr-2" />
                                      Activate User
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleDelete(user.id)}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete User
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending">
            <Card className="bg-white/80 backdrop-blur-md border border-gray-200/50 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Pending Verification
                  </div>
                  <Badge variant="outline" className="bg-orange-50 text-orange-700">
                    {pendingUsers.length} pending
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isPendingLoading ? (
                  <div className="animate-pulse space-y-4 p-8">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex space-x-4">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                      </div>
                    ))}
                  </div>
                ) : pendingUsers.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="relative mb-8">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-blue-500 rounded-full blur-lg opacity-25 w-32 h-32 mx-auto"></div>
                      <div className="relative p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-full w-32 h-32 mx-auto flex items-center justify-center border border-green-100">
                        <CheckCircle className="h-16 w-16 text-green-600" />
                      </div>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-800 mb-3">All Users Verified</h3>
                    <p className="text-gray-600 mb-8 text-xl max-w-md mx-auto">
                      No users are waiting for verification. All accounts are active and ready to use.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingUsers.map((user) => (
                      <Card key={user.id} className="border border-orange-200 bg-orange-50/50">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-lg blur opacity-50"></div>
                                <div className="relative p-2 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-lg">
                                  <User className="h-4 w-4 text-white" />
                                </div>
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {user.firstName && user.lastName 
                                    ? `${user.firstName} ${user.lastName}` 
                                    : user.username || user.email?.split("@")[0] || "User"}
                                </div>
                                <div className="text-sm text-gray-600">{user.email}</div>
                                <div className="text-xs text-gray-500">
                                  Registered: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                onClick={() => handleVerifyUser(user.id)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <UserCheck className="h-4 w-4 mr-2" />
                                Verify
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(user.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* User Form Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              {editingUser ? "Edit User" : "Create New User"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter first name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter last name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter email address"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter username"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {!editingUser && (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select user role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="member">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Member
                          </div>
                        </SelectItem>
                        <SelectItem value="editor">
                          <div className="flex items-center gap-2">
                            <Edit className="h-4 w-4" />
                            Editor
                          </div>
                        </SelectItem>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Administrator
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setEditingUser(null);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    "Processing..."
                  ) : (
                    editingUser ? "Update User" : "Create User"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}