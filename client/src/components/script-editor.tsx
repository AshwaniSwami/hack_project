import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import type { Script, Episode, User } from "@shared/schema";

const scriptFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  episodeId: z.string().min(1, "Episode is required"),
  authorId: z.string().min(1, "Author is required"),
  content: z.string().min(1, "Content is required"),
  status: z.string().default("Draft"),
  reviewComments: z.string().optional(),
  audioLink: z.string().url().optional().or(z.literal("")),
  audioFilePath: z.string().optional(),
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

  const { data: episodes = [] } = useQuery<Episode[]>({
    queryKey: ["/api/episodes"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const form = useForm<ScriptFormData>({
    resolver: zodResolver(scriptFormSchema),
    defaultValues: {
      title: "",
      episodeId: "",
      authorId: "",
      content: "",
      status: "Draft",
      reviewComments: "",
      audioLink: "",
      audioFilePath: "",
    },
  });

  useEffect(() => {
    if (script) {
      form.reset({
        title: script.title,
        episodeId: script.episodeId,
        authorId: script.authorId,
        content: script.content,
        status: script.status,
        reviewComments: script.reviewComments || "",
        audioLink: script.audioLink || "",
        audioFilePath: script.audioFilePath || "",
      });
    } else {
      form.reset({
        title: "",
        episodeId: "",
        authorId: "",
        content: "",
        status: "Draft",
        reviewComments: "",
        audioLink: "",
        audioFilePath: "",
      });
    }
  }, [script, form]);

  const mutation = useMutation({
    mutationFn: async (data: ScriptFormData) => {
      if (script) {
        return apiRequest("PUT", `/api/scripts/${script.id}`, data);
      } else {
        return apiRequest("POST", "/api/scripts", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scripts"] });
      toast({
        title: "Success",
        description: `Script ${script ? "updated" : "created"} successfully`,
      });
      onClose();
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
    mutation.mutate(data);
  };

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
                  name="episodeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Episode</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select episode" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {episodes.map((episode) => (
                            <SelectItem key={episode.id} value={episode.id}>
                              {episode.title} (#{episode.episodeNumber})
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
                  name="authorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Author</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select author" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.username}
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

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Script Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter script content..."
                        className="min-h-[300px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
