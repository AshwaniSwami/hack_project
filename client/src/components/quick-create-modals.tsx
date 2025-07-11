import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FileText, Radio, Clapperboard, Loader2 } from "lucide-react";
import type { Project } from "@shared/schema";

// Schemas for form validation
const projectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  themeId: z.string().optional().transform(val => val === "" ? undefined : val),
});

const episodeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  projectId: z.string().min(1, "Project is required"),
  status: z.enum(["Draft", "Published", "Archived"]).default("Draft"),
});

const scriptSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().optional(),
  projectId: z.string().min(1, "Project is required"),
  status: z.enum(["Draft", "Under Review", "Approved", "Needs Revision"]).default("Draft"),
});

interface QuickCreateModalsProps {
  isProjectOpen: boolean;
  isEpisodeOpen: boolean;
  isScriptOpen: boolean;
  onProjectClose: () => void;
  onEpisodeClose: () => void;
  onScriptClose: () => void;
}

export function QuickCreateModals({
  isProjectOpen,
  isEpisodeOpen,
  isScriptOpen,
  onProjectClose,
  onEpisodeClose,
  onScriptClose,
}: QuickCreateModalsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: themes = [] } = useQuery({
    queryKey: ["/api/themes"],
  });

  // Project form
  const projectForm = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      themeId: "",
    },
  });

  // Episode form
  const episodeForm = useForm<z.infer<typeof episodeSchema>>({
    resolver: zodResolver(episodeSchema),
    defaultValues: {
      title: "",
      description: "",
      projectId: "",
      status: "Draft",
    },
  });

  // Script form
  const scriptForm = useForm<z.infer<typeof scriptSchema>>({
    resolver: zodResolver(scriptSchema),
    defaultValues: {
      title: "",
      content: "",
      projectId: "",
      status: "Draft",
    },
  });

  // Mutations
  const createProjectMutation = useMutation({
    mutationFn: (data: z.infer<typeof projectSchema>) => 
      apiRequest("POST", "/api/projects", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      projectForm.reset();
      onProjectClose();
      toast({
        title: "Project created",
        description: "Your project has been created successfully.",
      });
    },
    onError: (error: any) => {
      console.error("Project creation error:", error);
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createEpisodeMutation = useMutation({
    mutationFn: (data: z.infer<typeof episodeSchema>) => 
      apiRequest("POST", "/api/episodes", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/episodes"] });
      episodeForm.reset();
      onEpisodeClose();
      toast({
        title: "Episode created",
        description: "Your episode has been created successfully.",
      });
    },
    onError: (error: any) => {
      console.error("Episode creation error:", error);
      toast({
        title: "Error",
        description: "Failed to create episode. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createScriptMutation = useMutation({
    mutationFn: (data: z.infer<typeof scriptSchema>) => 
      apiRequest("POST", "/api/scripts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scripts"] });
      scriptForm.reset();
      onScriptClose();
      toast({
        title: "Script created",
        description: "Your script has been created successfully.",
      });
    },
    onError: (error: any) => {
      console.error("Script creation error:", error);
      toast({
        title: "Error",
        description: "Failed to create script. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <>
      {/* Project Creation Modal */}
      <Dialog open={isProjectOpen} onOpenChange={onProjectClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-600" />
              Create New Project
            </DialogTitle>
            <DialogDescription>
              Create a new project to organize your radio content.
            </DialogDescription>
          </DialogHeader>
          <Form {...projectForm}>
            <form onSubmit={projectForm.handleSubmit((data) => createProjectMutation.mutate(data))} className="space-y-6">
              <FormField
                control={projectForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter project name..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={projectForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of the project..."
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={projectForm.control}
                name="themeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Theme (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a theme" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {themes.map((theme: any) => (
                          <SelectItem key={theme.id} value={theme.id}>
                            {theme.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={onProjectClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createProjectMutation.isPending}>
                  {createProjectMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Project
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Episode Creation Modal */}
      <Dialog open={isEpisodeOpen} onOpenChange={onEpisodeClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Radio className="h-5 w-5 mr-2 text-green-600" />
              Create New Episode
            </DialogTitle>
            <DialogDescription>
              Create a new episode for one of your projects.
            </DialogDescription>
          </DialogHeader>
          <Form {...episodeForm}>
            <form onSubmit={episodeForm.handleSubmit((data) => createEpisodeMutation.mutate(data))} className="space-y-6">
              <FormField
                control={episodeForm.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            <span className="font-medium">{project.name}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={episodeForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Episode Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter episode title..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={episodeForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of the episode..."
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={episodeForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Draft">Draft</SelectItem>
                        <SelectItem value="Published">Published</SelectItem>
                        <SelectItem value="Archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={onEpisodeClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createEpisodeMutation.isPending}>
                  {createEpisodeMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Episode
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Script Creation Modal */}
      <Dialog open={isScriptOpen} onOpenChange={onScriptClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Clapperboard className="h-5 w-5 mr-2 text-purple-600" />
              Create New Script
            </DialogTitle>
            <DialogDescription>
              Create a new script for one of your projects.
            </DialogDescription>
          </DialogHeader>
          <Form {...scriptForm}>
            <form onSubmit={scriptForm.handleSubmit((data) => createScriptMutation.mutate(data))} className="space-y-6">
              <FormField
                control={scriptForm.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            <span className="font-medium">{project.name}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={scriptForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Script Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter script title..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={scriptForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Start writing your script..."
                        className="min-h-[150px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={scriptForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Draft">Draft</SelectItem>
                        <SelectItem value="Under Review">Under Review</SelectItem>
                        <SelectItem value="Approved">Approved</SelectItem>
                        <SelectItem value="Needs Revision">Needs Revision</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={onScriptClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createScriptMutation.isPending}>
                  {createScriptMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Script
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}