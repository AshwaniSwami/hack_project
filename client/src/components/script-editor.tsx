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
import type { Submission, Team, Hackathon } from "@shared/schema";

const scriptFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  projectId: z.string().min(1, "Hackathon is required"),
  episodeId: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  status: z.enum(["Draft", "Under Review", "Approved", "Published"]).default("Draft"),
});

type SubmissionFormData = z.infer<typeof scriptFormSchema>;

interface SubmissionEditorProps {
  isOpen: boolean;
  onClose: () => void;
  script?: Submission;
  readOnly?: boolean;
  onSave?: () => void;
}

const statusColors = {
  "Draft": "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700",
  "Under Review": "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700",
  "Approved": "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700", 
  "Published": "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700"
};

const statusIcons = {
  "Draft": EditIcon,
  "Under Review": AlertCircle,
  "Approved": CheckCircle,
  "Published": PlayCircle
};

export function SubmissionEditor({ isOpen, onClose, script, readOnly = false, onSave }: SubmissionEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [selectedHackathon, setSelectedHackathon] = useState<string>("");

  const { data: projects = [] } = useQuery<Hackathon[]>({
    queryKey: ["/api/projects"],
  });

  const { data: episodes = [] } = useQuery<Team[]>({
    queryKey: ["/api/episodes"],
  });

  const form = useForm<SubmissionFormData>({
    resolver: zodResolver(scriptFormSchema),
    defaultValues: script ? {
      projectId: script.projectId,
      title: script.title,
      description: script.description || "",
      episodeId: script.episodeId || "none",
      content: script.content || "",
      status: script.status as "Draft" | "Under Review" | "Approved" | "Published",
    } : {
      projectId: "",
      title: "",
      description: "",
      episodeId: "none",
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
        episodeId: script.episodeId || "none",
        content: script.content || "",
        status: script.status as "Draft" | "Under Review" | "Approved" | "Published",
      };
      form.reset(scriptData);
      setContent(script.content || "");
      setSelectedHackathon(script.projectId || "");
    } else {
      const defaultData = {
        title: "",
        description: "",
        projectId: "",
        episodeId: "none",
        content: "",
        status: "Draft" as const,
      };
      form.reset(defaultData);
      setContent("");
      setSelectedHackathon("");
    }
  }, [script, form]);

  const mutation = useMutation({
    mutationFn: async (data: SubmissionFormData) => {
      const submitData = { 
        ...data, 
        content: content.trim(),
        episodeId: data.episodeId === "none" ? undefined : data.episodeId || undefined,
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
        description: `Submission ${script ? "updated" : "created"} successfully`,
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
      console.error("Submission save error:", error);
      toast({
        title: "Error",
        description: `Failed to ${script ? "update" : "create"} script`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SubmissionFormData) => {
    const cleanContent = content.replace(/<p><br><\/p>/g, '').trim();

    if (!cleanContent || cleanContent === '<p></p>' || cleanContent === '<p><br></p>') {
      toast({
        title: "Error",
        description: "Submission content is required",
        variant: "destructive",
      });
      return;
    }

    const submitData = { 
      ...data, 
      content: cleanContent,
      episodeId: data.episodeId === "none" ? undefined : data.episodeId,
      description: data.description || undefined
    };
    mutation.mutate(submitData);
  };

  // Filter episodes based on selected project
  const filteredTeams = selectedHackathon 
    ? episodes.filter(episode => episode.projectId === selectedHackathon)
    : episodes;

  const selectedHackathonData = projects.find(p => p.id === selectedHackathon);
  const selectedTeamData = episodes.find(e => e.id === form.watch("episodeId"));
  const StatusIcon = script ? statusIcons[script.status as keyof typeof statusIcons] : EditIcon;

  if (readOnly && script) {
    return (
      <div className="space-y-6">
        {/* Submission Info Header */}
        <div className="bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-900/20 dark:to-emerald-900/20 rounded-lg p-6 border border-blue-100 dark:border-blue-800">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{script.title}</h3>
              </div>
            </div>
            <Badge className={`text-sm px-3 py-1 ${statusColors[script.status as keyof typeof statusColors]}`}>
              {(() => {
                const StatusIcon = statusIcons[script.status as keyof typeof statusIcons] || Edit;
                return <StatusIcon className="h-3 w-3 mr-1" />;
              })()}
              {script.status.charAt(0).toUpperCase() + script.status.slice(1)}
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {selectedHackathonData && (
              <div className="p-4 bg-blue-50/80 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Hackathon: {selectedHackathonData.name}</div>
                {selectedHackathonData.description && (
                  <div className="text-sm text-blue-700 dark:text-blue-300 bg-white/60 dark:bg-gray-800/60 p-2 rounded">
                    <span className="font-medium">Description: </span>
                    {selectedHackathonData.description}
                  </div>
                )}
              </div>
            )}
            {selectedTeamData && (
              <div className="p-4 bg-emerald-50/80 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-700">
                <div className="font-semibold text-emerald-800 dark:text-emerald-300 mb-2">Team: {selectedTeamData.title}</div>
                {selectedTeamData.description && (
                  <div className="text-sm text-emerald-700 dark:text-emerald-300 bg-white/60 dark:bg-gray-800/60 p-2 rounded">
                    <span className="font-medium">Description: </span>
                    {selectedTeamData.description}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Submission Content */}
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Submission Content</h4>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div 
              className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300 leading-relaxed dark:prose-invert"
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
            {script ? "Edit Submission" : "Create New Submission"}
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

              {/* Hackathon and Team */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hackathon</FormLabel>
                      <Select onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedHackathon(value);
                        // Clear episode selection when project changes
                        form.setValue("episodeId", "none");
                      }} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select project" />
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
                  control={form.control}
                  name="episodeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select episode (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No episode</SelectItem>
                          {filteredTeams.map((episode) => (
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

              

              {/* Submission Content */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">
                  Submission Content *
                </label>
                <div className="rounded-md overflow-hidden border border-gray-200">
                  <ReactQuill
                    theme="snow"
                    value={content}
                    onChange={setContent}
                    modules={quillModules}
                    placeholder="Write your script content here... Use formatting tools to structure your script with headers, lists, and emphasis."
                    className="bg-white dark:bg-gray-800 dark:text-gray-100"
                    style={{ minHeight: "300px" }}
                  />
                </div>
                {(!content.trim() || content === '<p></p>' || content === '<p><br></p>') && (
                  <p className="text-sm text-red-500">Submission content is required</p>
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
                  {mutation.isPending ? "Saving..." : (script ? "Update Submission" : "Create Submission")}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}