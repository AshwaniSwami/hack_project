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
  type: z.enum(["radio", "checkbox", "text", "select"]),
  label: z.string().min(1, "Question label is required"),
  options: z.array(z.union([z.string(), z.object({ value: z.string(), label: z.string() })])).optional(),
  required: z.boolean().optional(),
  compulsory: z.boolean().default(false),
  placeholder: z.string().optional(),
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

  const { data: formConfig, isLoading, error } = useQuery<FormConfigData>({
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
      // Convert backend structure to frontend structure if needed
      const convertedQuestions = formConfig.questions.map(q => ({
        ...q,
        // Ensure we have the required fields for frontend compatibility
        compulsory: q.required || q.compulsory || false,
        // Convert object options to strings for the form builder interface
        options: q.options?.map(opt => typeof opt === 'string' ? opt : opt.label) || []
      }));
      setQuestions(convertedQuestions);
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
    // Validate options for radio and checkbox questions
    if ((data.type === "radio" || data.type === "checkbox") && (!data.options || data.options.length === 0)) {
      toast({
        title: "Error",
        description: `${data.type === "radio" ? "Single choice" : "Multiple choice"} questions must have at least one option`,
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate ID only when creating new question
    if (!editingQuestion && questions.some(q => q.id === data.id)) {
      toast({
        title: "Error",
        description: "Question ID already exists",
        variant: "destructive",
      });
      return;
    }

    if (editingQuestion) {
      setQuestions(questions.map(q => q.id === editingQuestion.id ? data : q));
      toast({
        title: "Success",
        description: "Question updated successfully",
      });
    } else {
      setQuestions([...questions, data]);
      toast({
        title: "Success",
        description: "Question added successfully",
      });
    }
    
    setIsQuestionDialogOpen(false);
    setEditingQuestion(null);
    form.reset({
      id: "",
      type: "radio",
      label: "",
      options: [],
      compulsory: false,
    });
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
    // Validate form before saving
    if (questions.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one question before saving",
        variant: "destructive",
      });
      return;
    }

    // Check for questions with missing options
    const invalidQuestions = questions.filter(q => 
      (q.type === "radio" || q.type === "checkbox") && (!q.options || q.options.length === 0)
    );

    if (invalidQuestions.length > 0) {
      toast({
        title: "Error",
        description: `Some questions are missing options: ${invalidQuestions.map(q => q.label).join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    saveFormMutation.mutate({ questions });
  };

  const watchedType = form.watch("type");
  const watchedOptions = form.watch("options") || [];

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error loading form configuration</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
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
                    {question.options.map((option, optionIndex) => {
                      const optionText = typeof option === 'string' ? option : option.label || option.value;
                      return (
                        <Badge key={optionIndex} variant="secondary" className="text-xs">
                          {optionText}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 shadow-2xl" aria-describedby="question-dialog-description">
          <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-sky-500 to-rose-500 bg-clip-text text-transparent">
              {editingQuestion ? "Edit Question" : "Add New Question"}
            </DialogTitle>
            <div id="question-dialog-description" className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {editingQuestion ? "Modify the question details below" : "Create a new question for your onboarding form"}
            </div>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSaveQuestion)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Question ID</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., purpose, interests" 
                          {...field} 
                          className="h-11 border-2 border-gray-200 dark:border-gray-600 focus:border-sky-500 dark:focus:border-sky-400"
                        />
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
                      <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Question Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11 border-2 border-gray-200 dark:border-gray-600 focus:border-sky-500 dark:focus:border-sky-400">
                            <SelectValue placeholder="Select question type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="z-50">
                          <SelectItem value="radio">Single Choice (Radio)</SelectItem>
                          <SelectItem value="checkbox">Multiple Choice (Checkbox)</SelectItem>
                          <SelectItem value="text">Text Input</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Question Label</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="What brings you to our platform?" 
                        {...field} 
                        className="h-11 border-2 border-gray-200 dark:border-gray-600 focus:border-sky-500 dark:focus:border-sky-400"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(watchedType === "radio" || watchedType === "checkbox") && (
                <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Options</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      placeholder="Enter option"
                      value={newOption}
                      onChange={(e) => setNewOption(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddOption();
                        }
                      }}
                      className="h-10 border-2 border-gray-200 dark:border-gray-600 focus:border-sky-500 dark:focus:border-sky-400 flex-1"
                    />
                    <Button 
                      type="button" 
                      onClick={handleAddOption}
                      disabled={!newOption.trim()}
                      className="h-10 px-4 bg-gradient-to-r from-sky-500 to-rose-500 hover:from-sky-600 hover:to-rose-600 text-white border-0 sm:w-auto w-full"
                    >
                      <Plus className="h-4 w-4 mr-2 sm:mr-0" />
                      <span className="sm:hidden">Add Option</span>
                    </Button>
                  </div>
                  {watchedOptions.length > 0 && (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {watchedOptions.map((option, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                          <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 mr-2 break-words">{option}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveOption(index)}
                            className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900 hover:text-red-600 dark:hover:text-red-400 flex-shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  {watchedOptions.length === 0 && (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                      No options added yet. Add at least one option for {watchedType} questions.
                    </div>
                  )}
                </div>
              )}

              <FormField
                control={form.control}
                name="compulsory"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border-2 border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
                    <div className="space-y-1">
                      <FormLabel className="text-base font-semibold text-gray-700 dark:text-gray-300">Required Question</FormLabel>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Users must answer this question to proceed
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-sky-500 data-[state=checked]:to-rose-500"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsQuestionDialogOpen(false);
                    setEditingQuestion(null);
                    form.reset();
                  }}
                  className="h-11 px-6 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="h-11 px-6 bg-gradient-to-r from-sky-500 to-rose-500 hover:from-sky-600 hover:to-rose-600 text-white border-0 w-full sm:w-auto"
                >
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