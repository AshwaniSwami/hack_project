import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { MapPin, User, CheckCircle, Sparkles } from "lucide-react";

interface Question {
  id: string;
  type: "radio" | "checkbox" | "text" | "select";
  label: string;
  options?: Array<{ value: string; label: string }> | string[];
  required?: boolean;
  compulsory?: boolean;
  placeholder?: string;
}

export default function UserOnboardingForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: formConfig, isLoading, error } = useQuery<Question[]>({
    queryKey: ["/api/onboarding/form-config"],
    enabled: true,
  });

  // Create dynamic schema based on form config
  const createFormSchema = (questions: Question[]) => {
    const schemaObject: any = {};
    
    questions.forEach(question => {
      const isRequired = question.required || question.compulsory;
      
      if (question.type === "checkbox") {
        schemaObject[question.id] = z.array(z.string()).optional();
      } else if (question.type === "text") {
        if (isRequired) {
          schemaObject[question.id] = z.string().min(1, `${question.label} is required`);
        } else {
          schemaObject[question.id] = z.string().optional();
        }
      } else if (question.type === "radio" || question.type === "select") {
        if (isRequired) {
          schemaObject[question.id] = z.string().min(1, `${question.label} is required`);
        } else {
          schemaObject[question.id] = z.string().optional();
        }
      }
    });

    // Add location fields
    schemaObject.location = z.object({
      country: z.string().min(1, "Country is required"),
      city: z.string().min(1, "City is required"),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    });

    return z.object(schemaObject);
  };

  const form = useForm({
    resolver: formConfig ? zodResolver(createFormSchema(formConfig)) : undefined,
    defaultValues: {
      location: {
        country: "",
        city: "",
        latitude: 0,
        longitude: 0,
      },
    },
    mode: "onChange", // Enable real-time validation
  });

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Submitting onboarding data:", data);
      return apiRequest("POST", "/api/onboarding/submit", data);
    },
    onSuccess: (response) => {
      console.log("Onboarding submission successful:", response);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/status"] });
      toast({
        title: "Welcome!",
        description: "Your onboarding has been completed successfully",
      });
      
      // Redirect to dashboard or refresh page
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);
    },
    onError: (error: any) => {
      console.error("Onboarding submission failed:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit onboarding form",
        variant: "destructive",
      });
    },
  });

  const handleNext = async () => {
    if (currentStep === 0) {
      // Validate location step
      const isValid = await form.trigger(["location.country", "location.city"]);
      if (!isValid) {
        toast({
          title: "Please complete location information",
          description: "Country and city are required",
          variant: "destructive",
        });
        return;
      }
      setCurrentStep(currentStep + 1);
    } else if (formConfig && currentStep > 0 && currentStep <= formConfig.length) {
      // Validate current question
      const currentQuestion = formConfig[currentStep - 1];
      if (currentQuestion && (currentQuestion.required || currentQuestion.compulsory)) {
        const isValid = await form.trigger([currentQuestion.id]);
        if (!isValid) {
          toast({
            title: "Please complete this question",
            description: `${currentQuestion.label} is required`,
            variant: "destructive",
          });
          return;
        }
      }
      
      // If this is the last question, submit the form directly
      if (currentStep === formConfig.length) {
        const formData = form.getValues();
        await handleSubmit(formData);
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (data: any) => {
    console.log("Submitting onboarding data:", data);
    
    // Validate all required fields before submission
    const isValid = await form.trigger();
    if (!isValid) {
      toast({
        title: "Please complete all required fields",
        description: "Some required information is missing",
        variant: "destructive",
      });
      return;
    }
    
    submitMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-rose-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading onboarding form...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-rose-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2 text-red-600">Error Loading Form</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Failed to load onboarding form. Please try again.
            </p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!formConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-rose-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">No onboarding form configured</h3>
            <p className="text-gray-600 dark:text-gray-400">Please contact your administrator.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalSteps = formConfig.length + 1; // +1 for location step
  const currentQuestion = currentStep > 0 ? formConfig[currentStep - 1] : null;
  const isLastQuestion = currentStep === formConfig.length; // Last question, show submit button

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-rose-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Step {currentStep + 1} of {totalSteps}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {Math.round(((currentStep + 1) / totalSteps) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-sky-500 to-rose-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-sky-500 to-rose-500 bg-clip-text text-transparent">
              {currentStep === 0 ? "Welcome! Let's get started" : `Question ${currentStep}`}
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {currentStep === 0 
                ? "Please provide your location information to get started"
                : currentQuestion?.label
              }
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6" noValidate>
                {currentStep === 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <MapPin className="h-5 w-5 text-sky-500" />
                      <span className="font-medium text-gray-700 dark:text-gray-300">Location Information</span>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="location.country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your country" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location.city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your city" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {currentStep > 0 && currentQuestion && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <User className="h-5 w-5 text-sky-500" />
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {currentQuestion.label}
                        {(currentQuestion.required || currentQuestion.compulsory) && <span className="text-red-500 ml-1">*</span>}
                      </span>
                    </div>

                    {(currentQuestion.type === "radio" || currentQuestion.type === "select") && (
                      <FormField
                        control={form.control}
                        name={currentQuestion.id}
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex flex-col space-y-2"
                              >
                                {currentQuestion.options?.map((option) => {
                                  const optionValue = typeof option === 'string' ? option : option.value;
                                  const optionLabel = typeof option === 'string' ? option : option.label;
                                  return (
                                    <div key={optionValue} className="flex items-center space-x-2">
                                      <RadioGroupItem value={optionValue} id={optionValue} />
                                      <Label htmlFor={optionValue} className="text-sm font-normal cursor-pointer">
                                        {optionLabel}
                                      </Label>
                                    </div>
                                  );
                                })}
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {currentQuestion.type === "checkbox" && (
                      <FormField
                        control={form.control}
                        name={currentQuestion.id}
                        render={() => (
                          <FormItem>
                            <div className="space-y-2">
                              {currentQuestion.options?.map((option) => (
                                <FormField
                                  key={option}
                                  control={form.control}
                                  name={currentQuestion.id}
                                  render={({ field }) => {
                                    const currentValue = field.value || [];
                                    const isChecked = currentValue.includes(option.toLowerCase());
                                    return (
                                      <FormItem
                                        key={option}
                                        className="flex flex-row items-start space-x-3 space-y-0"
                                      >
                                        <FormControl>
                                          <Checkbox
                                            checked={isChecked}
                                            onCheckedChange={(checked) => {
                                              const value = Array.isArray(field.value) ? field.value : [];
                                              if (checked) {
                                                field.onChange([...value, option.toLowerCase()]);
                                              } else {
                                                field.onChange(value.filter((v: string) => v !== option.toLowerCase()));
                                              }
                                            }}
                                          />
                                        </FormControl>
                                        <FormLabel className="text-sm font-normal cursor-pointer">
                                          {option}
                                        </FormLabel>
                                      </FormItem>
                                    );
                                  }}
                                />
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {currentQuestion.type === "text" && (
                      <FormField
                        control={form.control}
                        name={currentQuestion.id}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                placeholder={currentQuestion.placeholder || `Enter your ${currentQuestion.label.toLowerCase()}`}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                )}



                <div className="flex justify-between pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                  >
                    Previous
                  </Button>

                  <Button 
                    type="button" 
                    onClick={handleNext}
                    disabled={submitMutation.isPending}
                    className={isLastQuestion ? "bg-gradient-to-r from-sky-500 to-rose-500" : ""}
                  >
                    {submitMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </>
                    ) : isLastQuestion ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Complete Onboarding
                      </>
                    ) : (
                      "Next"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}