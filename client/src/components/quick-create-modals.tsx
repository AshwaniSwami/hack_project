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
import { FolderOpen, RadioTower, Mic, Loader2 } from "lucide-react";
import { LanguageSelector } from "@/components/language-selector";
import type { Hackathon } from "@shared/schema";

// Schemas for form validation
const projectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  themeId: z.string().optional().transform(val => val === "" ? undefined : val),
});

const episodeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  projectId: z.string().min(1, "Hackathon is required"),
  status: z.enum(["Draft", "Published", "Archived"]).default("Draft"),
});

const scriptSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().optional(),
  projectId: z.string().min(1, "Hackathon is required"),
  status: z.enum(["Draft", "Under Review", "Approved", "Needs Revision"]).default("Draft"),
  language: z.string().default("en"),
});

interface QuickCreateModalsProps {
  isHackathonOpen: boolean;
  isTeamOpen: boolean;
  isSubmissionOpen: boolean;
  onHackathonClose: () => void;
  onTeamClose: () => void;
  onSubmissionClose: () => void;
}

export function QuickCreateModals({
  isHackathonOpen,
  isTeamOpen,
  isSubmissionOpen,
  onHackathonClose,
  onTeamClose,
  onSubmissionClose,
}: QuickCreateModalsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: projects = [] } = useQuery<Hackathon[]>({
    queryKey: ["/api/projects"],
  });

  const { data: themes = [] } = useQuery<{id: string, name: string}[]>({
    queryKey: ["/api/themes"],
  });

  // Hackathon form
  const projectForm = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      themeId: "",
    },
  });

  // Team form
  const episodeForm = useForm<z.infer<typeof episodeSchema>>({
    resolver: zodResolver(episodeSchema),
    defaultValues: {
      title: "",
      description: "",
      projectId: "",
      status: "Draft",
    },
  });

  // Submission form
  const scriptForm = useForm<z.infer<typeof scriptSchema>>({
    resolver: zodResolver(scriptSchema),
    defaultValues: {
      title: "",
      content: "",
      projectId: "",
      status: "Draft",
      language: "en",
    },
  });

  // Mutations
  const createHackathonMutation = useMutation({
    mutationFn: (data: z.infer<typeof projectSchema>) => 
      apiRequest("POST", "/api/projects", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      projectForm.reset();
      onHackathonClose();
      toast({
        title: "Hackathon created",
        description: "Your project has been created successfully.",
      });
    },
    onError: (error: any) => {
      console.error("Hackathon creation error:", error);
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createTeamMutation = useMutation({
    mutationFn: (data: z.infer<typeof episodeSchema>) => 
      apiRequest("POST", "/api/episodes", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/episodes"] });
      episodeForm.reset();
      onTeamClose();
      toast({
        title: "Team created",
        description: "Your episode has been created successfully.",
      });
    },
    onError: (error: any) => {
      console.error("Team creation error:", error);
      toast({
        title: "Error",
        description: "Failed to create episode. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createSubmissionMutation = useMutation({
    mutationFn: (data: z.infer<typeof scriptSchema>) => 
      apiRequest("POST", "/api/scripts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scripts"] });
      scriptForm.reset();
      onSubmissionClose();
      toast({
        title: "Submission created",
        description: "Your script has been created successfully.",
      });
    },
    onError: (error: any) => {
      console.error("Submission creation error:", error);
      toast({
        title: "Error",
        description: "Failed to create script. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <>
      {/* Hackathon Creation Modal */}
      <Dialog open={isHackathonOpen} onOpenChange={onHackathonClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FolderOpen className="h-5 w-5 mr-2 text-blue-600" />
              Create New Hackathon
            </DialogTitle>
            <DialogDescription>
              Create a new project to organize your radio content.
            </DialogDescription>
          </DialogHeader>
          <Form {...projectForm}>
            <form onSubmit={projectForm.handleSubmit((data) => createHackathonMutation.mutate(data))} className="space-y-6">
              <FormField
                control={projectForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hackathon Name</FormLabel>
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
                <Button type="button" variant="outline" onClick={onHackathonClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createHackathonMutation.isPending}>
                  {createHackathonMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Hackathon
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Team Creation Modal */}
      <Dialog open={isTeamOpen} onOpenChange={onTeamClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <RadioTower className="h-5 w-5 mr-2 text-green-600" />
              Create New Team
            </DialogTitle>
            <DialogDescription>
              Create a new episode for one of your projects.
            </DialogDescription>
          </DialogHeader>
          <Form {...episodeForm}>
            <form onSubmit={episodeForm.handleSubmit((data) => createTeamMutation.mutate(data))} className="space-y-6">
              <FormField
                control={episodeForm.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hackathon</FormLabel>
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
                    <FormLabel>Team Title</FormLabel>
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
                <Button type="button" variant="outline" onClick={onTeamClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createTeamMutation.isPending}>
                  {createTeamMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Team
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Submission Creation Modal */}
      <Dialog open={isSubmissionOpen} onOpenChange={onSubmissionClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Mic className="h-5 w-5 mr-2 text-purple-600" />
              Create New Submission
            </DialogTitle>
            <DialogDescription>
              Create a new script for one of your projects.
            </DialogDescription>
          </DialogHeader>
          <Form {...scriptForm}>
            <form onSubmit={scriptForm.handleSubmit((data) => createSubmissionMutation.mutate(data))} className="space-y-6">
              <FormField
                control={scriptForm.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hackathon</FormLabel>
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
                    <FormLabel>Submission Title</FormLabel>
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
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <LanguageSelector
                      value={field.value}
                      onChange={field.onChange}
                      allowCustom={true}
                    />
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
                <Button type="button" variant="outline" onClick={onSubmissionClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createSubmissionMutation.isPending}>
                  {createSubmissionMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Submission
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}