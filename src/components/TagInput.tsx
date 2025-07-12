import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Tag {
  id: string;
  name: string;
  color?: string;
}

interface TagInputProps {
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  placeholder?: string;
}

export const TagInput = ({ selectedTags, onTagsChange, placeholder = "Add tags..." }: TagInputProps) => {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (inputValue.length > 0) {
      fetchTagSuggestions(inputValue);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [inputValue]);

  const fetchTagSuggestions = async (query: string) => {
    const { data } = await supabase
      .from('tags')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('usage_count', { ascending: false })
      .limit(5);
    
    if (data) {
      const filteredData = data.filter(tag => 
        !selectedTags.some(selected => selected.id === tag.id)
      );
      setSuggestions(filteredData);
    }
  };

  const addTag = async (tagName: string) => {
    if (!tagName.trim() || selectedTags.some(tag => tag.name.toLowerCase() === tagName.toLowerCase())) {
      return;
    }

    // Check if tag exists
    let { data: existingTag } = await supabase
      .from('tags')
      .select('*')
      .ilike('name', tagName)
      .single();

    if (!existingTag) {
      // Create new tag
      const { data: newTag } = await supabase
        .from('tags')
        .insert({ name: tagName })
        .select()
        .single();
      
      if (newTag) {
        existingTag = newTag;
      }
    }

    if (existingTag) {
      onTagsChange([...selectedTags, existingTag]);
    }
    
    setInputValue("");
    setShowSuggestions(false);
  };

  const removeTag = (tagId: string) => {
    onTagsChange(selectedTags.filter(tag => tag.id !== tagId));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue.trim());
      }
    } else if (e.key === 'Backspace' && !inputValue && selectedTags.length > 0) {
      removeTag(selectedTags[selectedTags.length - 1].id);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedTags.map((tag) => (
          <Badge
            key={tag.id}
            variant="secondary"
            className="bg-tag-bg text-tag-text hover:bg-tag-bg/80"
          >
            {tag.name}
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 ml-2 hover:bg-transparent"
              onClick={() => removeTag(tag.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
      </div>
      
      <div className="relative">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            onFocus={() => inputValue && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
          {inputValue && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addTag(inputValue.trim())}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 bg-popover border rounded-md shadow-md mt-1">
            {suggestions.map((tag) => (
              <div
                key={tag.id}
                className="px-3 py-2 hover:bg-muted cursor-pointer text-sm"
                onClick={() => {
                  onTagsChange([...selectedTags, tag]);
                  setInputValue("");
                  setShowSuggestions(false);
                }}
              >
                {tag.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};