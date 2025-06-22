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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { FileText, Sparkles, CheckCircle, AlertCircle, PlayCircle, Edit as EditIcon } from "lucide-react";
import type { Script, Episode, Project } from "@shared/schema";

const scriptFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  projectId: z.string().min(1, "Project is required"),
  episodeId: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  status: z.enum(["Draft", "Under Review", "Approved", "Published"]).default("Draft"),
});

type ScriptFormData = z.infer<typeof scriptFormSchema>;

interface ScriptEditorProps {
  isOpen: boolean;
  onClose: () => void;
  script?: Script;
  readOnly?: boolean;
  onSave?: () => void;
}

const statusColors = {
  "Draft": "bg-gray-100 text-gray-700 border-gray-200",
  "Under Review": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "Approved": "bg-green-100 text-green-700 border-green-200", 
  "Published": "bg-blue-100 text-blue-700 border-blue-200"
};

const statusIcons = {
  "Draft": EditIcon,
  "Under Review": AlertCircle,
  "Approved": CheckCircle,
  "Published": PlayCircle
};

export function ScriptEditor({ isOpen, onClose, script, readOnly = false, onSave }: ScriptEditorProps) {
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

  const form = useForm<ScriptFormData>({
    resolver: zodResolver(scriptFormSchema),
    defaultValues: {
      title: "",
      description: "",
      projectId: "",
      episodeId: "",
      content: "",
      status: "Draft",
    },
  });

  const quillModules = {
    toolbar: readOnly ? false : [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      ['link'],
      ['clean']
    ],
  };

  useEffect(() => {
    if (script) {
      const scriptData = {
        title: script.title,
        description: script.description || "",
        projectId: script.projectId || "",
        episodeId: script.episodeId || "",
        content: script.content || "",
        status: script.status as "Draft" | "Under Review" | "Approved" | "Published",
      };
      form.reset(scriptData);
      setContent(script.content || "");
      setSelectedProject(script.projectId || "");
    } else {
      const defaultData = {
        title: "",
        description: "",
        projectId: "",
        episodeId: "",
        content: "",
        status: "Draft" as const,
      };
      form.reset(defaultData);
      setContent("");
      setSelectedProject("");
    }
  }, [script, form]);

  const mutation = useMutation({
    mutationFn: async (data: ScriptFormData) => {
      const submitData = { 
        ...data, 
        content: content.trim(),
        episodeId: data.episodeId || undefined,
        description: data.description || undefined
      };
      
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
      if (onSave) {
        onSave();
      } else {
        onClose();
      }
      if (!script) {
        setContent("");
        form.reset();
      }
    },
    onError: (error) => {
      console.error("Script save error:", error);
      toast({
        title: "Error",
        description: `Failed to ${script ? "update" : "create"} script`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ScriptFormData) => {
    const cleanContent = content.replace(/<p><br><\/p>/g, '').trim();
    
    if (!cleanContent || cleanContent === '<p></p>') {
      toast({
        title: "Error",
        description: "Script content is required",
        variant: "destructive",
      });
      return;
    }
    
    const submitData = { ...data, content: cleanContent };
    mutation.mutate(submitData);
  };

  // Filter episodes based on selected project
  const filteredEpisodes = selectedProject 
    ? episodes.filter(episode => episode.projectId === selectedProject)
    : episodes;

  const selectedProjectData = projects.find(p => p.id === selectedProject);
  const selectedEpisodeData = episodes.find(e => e.id === form.watch("episodeId"));
  const StatusIcon = script ? statusIcons[script.status as keyof typeof statusIcons] : EditIcon;

  if (readOnly && script) {
    return (
      <div className="space-y-6">
        {/* Script Info Header */}
        <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg p-6 border border-blue-100">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">{script.title}</h3>
                {script.description && (
                  <p className="text-gray-600 mt-1">{script.description}</p>
                )}
              </div>
            </div>
            <Badge className={`text-sm px-3 py-1 ${statusColors[script.status as keyof typeof statusColors]}`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {script.status.charAt(0).toUpperCase() + script.status.slice(1)}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedProjectData && (
              <div className="flex items-center space-x-3 p-3 bg-white/60 rounded-lg">
                <div className="font-semibold text-gray-700">Project:</div>
                <div className="text-gray-600">{selectedProjectData.name}</div>
              </div>
            )}
            {selectedEpisodeData && (
              <div className="flex items-center space-x-3 p-3 bg-white/60 rounded-lg">
                <div className="font-semibold text-gray-700">Episode:</div>
                <div className="text-gray-600">{selectedEpisodeData.title}</div>
              </div>
            )}
          </div>
        </div>

        {/* Script Content */}
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-gray-800">Script Content</h4>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div 
              className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: script.content || "" }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            {script ? "Edit Script" : "Create New Script"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-1">
              {/* Title and Status */}
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
                          <SelectItem value="Draft">Draft</SelectItem>
                          <SelectItem value="Under Review">Under Review</SelectItem>
                          <SelectItem value="Approved">Approved</SelectItem>
                          <SelectItem value="Published">Published</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Project and Episode */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project</FormLabel>
                      <Select onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedProject(value);
                        // Clear episode selection when project changes
                        form.setValue("episodeId", "");
                      }} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select project" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {projects.map((project) => (
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

                <FormField
                  control={form.control}
                  name="episodeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Episode (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select episode (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">No episode</SelectItem>
                          {filteredEpisodes.map((episode) => (
                            <SelectItem key={episode.id} value={episode.id}>
                              {episode.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description of the script..."
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Script Content */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">
                  Script Content *
                </label>
                <div className="rounded-md overflow-hidden border border-gray-200">
                  <ReactQuill
                    theme="snow"
                    value={content}
                    onChange={setContent}
                    modules={quillModules}
                    placeholder="Write your script content here... Use formatting tools to structure your script with headers, lists, and emphasis."
                    className="bg-white"
                    style={{ minHeight: "300px" }}
                  />
                </div>
                {(!content.trim() || content === '<p></p>' || content === '<p><br></p>') && (
                  <p className="text-sm text-red-500">Script content is required</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={mutation.isPending || !content.trim() || content === '<p></p>' || content === '<p><br></p>'}
                  className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-lg"
                >
                  {mutation.isPending ? "Saving..." : (script ? "Update Script" : "Create Script")}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}