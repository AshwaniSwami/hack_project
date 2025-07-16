import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import { getLanguageOptions, getLanguageName, getLanguageFlag } from "@shared/languages";

interface LanguageSelectorProps {
  value: string;
  onChange: (value: string) => void;
  allowCustom?: boolean;
  disabled?: boolean;
}

export function LanguageSelector({ 
  value, 
  onChange, 
  allowCustom = false, 
  disabled = false 
}: LanguageSelectorProps) {
  const [isCustom, setIsCustom] = useState(false);
  const [customLanguage, setCustomLanguage] = useState("");
  
  // Limited language options: English, Hindi, and custom
  const languageOptions = [
    { value: "en", name: "English", flag: "🇺🇸" },
    { value: "hi", name: "Hindi", flag: "🇮🇳" }
  ];

  const handleLanguageChange = (selectedValue: string) => {
    if (selectedValue === "custom") {
      setIsCustom(true);
      return;
    }
    
    setIsCustom(false);
    onChange(selectedValue);
  };

  const handleCustomLanguageSubmit = () => {
    if (customLanguage.trim()) {
      onChange(customLanguage.trim().toLowerCase());
      setIsCustom(false);
      setCustomLanguage("");
    }
  };

  const handleCustomLanguageCancel = () => {
    setIsCustom(false);
    setCustomLanguage("");
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="language">Language</Label>
      
      {!isCustom ? (
        <div className="flex items-center space-x-2">
          <Select value={value} onValueChange={handleLanguageChange} disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder="Select a language">
                {value && (
                  <div className="flex items-center space-x-2">
                    <span>{getLanguageFlag(value)}</span>
                    <span>{getLanguageName(value)}</span>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {languageOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center space-x-2">
                    <span>{option.flag}</span>
                    <span>{option.name}</span>
                  </div>
                </SelectItem>
              ))}
              {allowCustom && (
                <SelectItem value="custom">
                  <div className="flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>Custom Language</span>
                  </div>
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          
          {value && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <span>{getLanguageFlag(value)}</span>
              <span>{getLanguageName(value)}</span>
            </Badge>
          )}
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Enter custom language code (e.g., 'sw' for Swahili)"
            value={customLanguage}
            onChange={(e) => setCustomLanguage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCustomLanguageSubmit()}
          />
          <Button
            type="button"
            size="sm"
            onClick={handleCustomLanguageSubmit}
            disabled={!customLanguage.trim()}
          >
            Add
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCustomLanguageCancel}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
      
      {value && !isCustom && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Language code: {value}
        </div>
      )}
    </div>
  );
}

interface LanguageBadgeProps {
  language: string;
  className?: string;
}

export function LanguageBadge({ language, className = "" }: LanguageBadgeProps) {
  return (
    <Badge variant="outline" className={`flex items-center space-x-1 ${className}`}>
      <span>{getLanguageFlag(language)}</span>
      <span>{getLanguageName(language)}</span>
    </Badge>
  );
}