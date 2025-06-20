import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import type { Script, Episode, User, Project } from "@shared/schema";

const scriptFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  projectId: z.string().min(1, "Project is required"),
  content: z.string().min(1, "Content is required"),
  status: z.string().default("Draft"),
  reviewComments: z.string().optional(),
});

type ScriptFormData = z.infer<typeof scriptFormSchema>;

interface ScriptEditorProps {
  isOpen: boolean;
  onClose: () => void;
  script?: Script;
}

const statusOptions = [
  "Draft",
  "Submitted",
  "Under Review",
  "Approved",
  "Needs Revision",
  "Recorded",
  "Archived",
];

export function ScriptEditor({ isOpen, onClose, script }: ScriptEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");

  const [selectedProject, setSelectedProject] = useState<string>("");

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: episodes = [] } = useQuery<Episode[]>({
    queryKey: ["/api/episodes"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: projectsData = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const form = useForm<ScriptFormData>({
    resolver: zodResolver(scriptFormSchema),
    defaultValues: {
      title: "",
      projectId: "",
      content: "",
      status: "Draft",
      reviewComments: "",
    },
  });

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link', 'blockquote', 'code-block'],
      ['clean']
    ],
  };

  useEffect(() => {
    if (script) {
      form.reset({
        title: script.title,
        projectId: script.projectId || "",
        content: script.content,
        status: script.status,
        reviewComments: script.reviewComments || "",
      });
      setContent(script.content);
      setSelectedProject(script.projectId || "");
    } else {
      form.reset({
        title: "",
        projectId: "",
        content: "",
        status: "Draft",
        reviewComments: "",
      });
      setContent("");
      setSelectedProject("");
    }
  }, [script, form]);

  const mutation = useMutation({
    mutationFn: async (data: ScriptFormData) => {
      const submitData = { ...data, content };
      if (script) {
        return apiRequest("PUT", `/api/scripts/${script.id}`, submitData);
      } else {
        return apiRequest("POST", "/api/scripts", submitData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scripts"] });
      toast({
        title: "Success",
        description: `Script ${script ? "updated" : "created"} successfully`,
      });
      onClose();
      setContent("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${script ? "update" : "create"} script`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ScriptFormData) => {
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Script content is required",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate(data);
  };

  const getProjectName = (projectId: string) => {
    const project = projectsData.find((p: Project) => p.id === projectId);
    return project?.name || "";
  };

  // Filter episodes based on selected project
  const filteredEpisodes = selectedProject 
    ? episodes.filter(episode => episode.projectId === selectedProject)
    : episodes;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{script ? "Edit Script" : "Create New Script"}</DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter script title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
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
                          {statusOptions.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project</FormLabel>
                      <Select onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedProject(value);
                      }} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select project" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {projectsData.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </div>

              <FormField
                control={form.control}
                name="audioLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Audio Link</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/audio.mp3" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Script Content *
                </label>
                <div className="rounded-md overflow-hidden">
                  <ReactQuill
                    theme="snow"
                    value={content}
                    onChange={setContent}
                    modules={quillModules}
                    placeholder="Write your script content here..."
                    className="bg-white dark:bg-gray-800"
                  />
                </div>
                {!content.trim() && (
                  <p className="text-sm text-red-500">Script content is required</p>
                )}
              </div>

              <FormField
                control={form.control}
                name="reviewComments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Review Comments</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add review comments or notes..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Saving..." : "Save Script"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
