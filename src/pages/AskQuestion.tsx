import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { RichTextEditor } from "@/components/RichTextEditor";
import { TagInput } from "@/components/TagInput";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MessageSquarePlus } from "lucide-react";

interface Tag {
  id: string;
  name: string;
  color?: string;
}

const AskQuestion = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
      return;
    }
    setUser(session.user);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to ask a question",
        variant: "destructive",
      });
      return;
    }

    if (!title.trim() || !content.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both a title and description",
        variant: "destructive",
      });
      return;
    }

    if (selectedTags.length === 0) {
      toast({
        title: "Tags required",
        description: "Please add at least one tag to your question",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Insert question
      const { data: question, error: questionError } = await supabase
        .from('questions')
        .insert({
          title: title.trim(),
          content: content.trim(),
          user_id: user.id,
        })
        .select()
        .single();

      if (questionError) throw questionError;

      // Insert question tags
      const tagPromises = selectedTags.map(tag =>
        supabase
          .from('question_tags')
          .insert({
            question_id: question.id,
            tag_id: tag.id,
          })
      );

      await Promise.all(tagPromises);

      toast({
        title: "Question posted!",
        description: "Your question has been posted successfully",
      });

      navigate(`/question/${question.id}`);
    } catch (error: any) {
      console.error('Error posting question:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to post question",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquarePlus className="h-5 w-5" />
              Ask a Question
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What's your programming question? Be specific."
                  maxLength={200}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Be specific and imagine you're asking a question to another person.
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>
                  Description <span className="text-destructive">*</span>
                </Label>
                <RichTextEditor
                  content={content}
                  onChange={setContent}
                  placeholder="Provide more details about your question. Include what you tried and what you expected to happen."
                />
                <p className="text-sm text-muted-foreground">
                  Include all the information someone would need to answer your question.
                </p>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>
                  Tags <span className="text-destructive">*</span>
                </Label>
                <TagInput
                  selectedTags={selectedTags}
                  onTagsChange={setSelectedTags}
                  placeholder="Add up to 5 tags to describe what your question is about"
                />
                <p className="text-sm text-muted-foreground">
                  Add tags to help others find and answer your question.
                </p>
              </div>

              {/* Preview Notice */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Tips for a great question:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Make your title specific and clear</li>
                  <li>• Explain the problem in detail</li>
                  <li>• Share what you've tried so far</li>
                  <li>• Use relevant tags</li>
                  <li>• Check for spelling and grammar</li>
                </ul>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !title.trim() || !content.trim() || selectedTags.length === 0}
                  className="bg-gradient-primary hover:opacity-90"
                >
                  {loading ? "Posting..." : "Post Question"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AskQuestion;