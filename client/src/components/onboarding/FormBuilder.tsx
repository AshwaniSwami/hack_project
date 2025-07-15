import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Trash2, Save, Settings } from "lucide-react";

const questionSchema = z.object({
  id: z.string().min(1, "Question ID is required"),
  type: z.enum(["radio", "checkbox", "text"]),
  label: z.string().min(1, "Question label is required"),
  options: z.array(z.string()).optional(),
  compulsory: z.boolean().default(false),
});

const formConfigSchema = z.object({
  questions: z.array(questionSchema),
});

type QuestionData = z.infer<typeof questionSchema>;
type FormConfigData = z.infer<typeof formConfigSchema>;

export default function FormBuilder() {
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionData | null>(null);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [newOption, setNewOption] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: formConfig, isLoading } = useQuery<FormConfigData>({
    queryKey: ["/api/onboarding/form-config"],
    enabled: true,
  });

  const form = useForm<QuestionData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      id: "",
      type: "radio",
      label: "",
      options: [],
      compulsory: false,
    },
  });

  useEffect(() => {
    if (formConfig) {
      setQuestions(formConfig.questions);
    }
  }, [formConfig]);

  const saveFormMutation = useMutation({
    mutationFn: async (config: FormConfigData) => {
      return apiRequest("PUT", "/api/onboarding/form-config", config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/form-config"] });
      toast({
        title: "Success",
        description: "Form configuration saved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save form configuration",
        variant: "destructive",
      });
    },
  });

  const handleAddQuestion = () => {
    setEditingQuestion(null);
    form.reset({
      id: "",
      type: "radio",
      label: "",
      options: [],
      compulsory: false,
    });
    setIsQuestionDialogOpen(true);
  };

  const handleEditQuestion = (question: QuestionData) => {
    setEditingQuestion(question);
    form.reset(question);
    setIsQuestionDialogOpen(true);
  };

  const handleDeleteQuestion = (questionId: string) => {
    setQuestions(questions.filter(q => q.id !== questionId));
  };

  const handleSaveQuestion = (data: QuestionData) => {
    if (editingQuestion) {
      setQuestions(questions.map(q => q.id === editingQuestion.id ? data : q));
    } else {
      if (questions.some(q => q.id === data.id)) {
        toast({
          title: "Error",
          description: "Question ID already exists",
          variant: "destructive",
        });
        return;
      }
      setQuestions([...questions, data]);
    }
    setIsQuestionDialogOpen(false);
    setEditingQuestion(null);
  };

  const handleAddOption = () => {
    if (newOption.trim()) {
      const currentOptions = form.getValues("options") || [];
      form.setValue("options", [...currentOptions, newOption.trim()]);
      setNewOption("");
    }
  };

  const handleRemoveOption = (index: number) => {
    const currentOptions = form.getValues("options") || [];
    form.setValue("options", currentOptions.filter((_, i) => i !== index));
  };

  const handleSaveForm = () => {
    saveFormMutation.mutate({ questions });
  };

  const watchedType = form.watch("type");
  const watchedOptions = form.watch("options") || [];

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-sky-500 to-rose-500 bg-clip-text text-transparent">
          Onboarding Form Builder
        </h2>
        <div className="flex gap-2">
          <Button onClick={handleAddQuestion} className="bg-gradient-to-r from-sky-500 to-rose-500">
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
          <Button onClick={handleSaveForm} disabled={saveFormMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {saveFormMutation.isPending ? "Saving..." : "Save & Publish"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {questions.map((question, index) => (
          <Card key={question.id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                  <span className="text-gray-900 dark:text-gray-100">{question.label}</span>
                  {question.compulsory && (
                    <Badge variant="destructive" className="text-xs">Required</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {question.type}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditQuestion(question)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteQuestion(question.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {question.options && question.options.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Options:</Label>
                  <div className="flex flex-wrap gap-2">
                    {question.options.map((option, optionIndex) => (
                      <Badge key={optionIndex} variant="secondary" className="text-xs">
                        {option}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? "Edit Question" : "Add New Question"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSaveQuestion)} className="space-y-4">
              <FormField
                control={form.control}
                name="id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question ID</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., purpose, interests" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Label</FormLabel>
                    <FormControl>
                      <Input placeholder="What brings you to our platform?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select question type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="radio">Single Choice (Radio)</SelectItem>
                        <SelectItem value="checkbox">Multiple Choice (Checkbox)</SelectItem>
                        <SelectItem value="text">Text Input</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(watchedType === "radio" || watchedType === "checkbox") && (
                <div className="space-y-4">
                  <Label>Options</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter option"
                      value={newOption}
                      onChange={(e) => setNewOption(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddOption())}
                    />
                    <Button type="button" onClick={handleAddOption}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {watchedOptions.map((option, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{option}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveOption(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <FormField
                control={form.control}
                name="compulsory"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Required Question</FormLabel>
                      <div className="text-sm text-gray-500">
                        Users must answer this question to proceed
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

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsQuestionDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingQuestion ? "Update Question" : "Add Question"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}