import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/Header";
import { VoteButtons } from "@/components/VoteButtons";
import { RichTextEditor } from "@/components/RichTextEditor";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Eye, Clock, User, MessageSquare, CheckCircle } from "lucide-react";

interface Question {
  id: string;
  title: string;
  content: string;
  vote_count: number;
  answer_count: number;
  view_count: number;
  created_at: string;
  user_id: string;
  accepted_answer_id: string | null;
  profiles?: {
    username: string;
    display_name: string;
  } | null;
  question_tags: Array<{
    tags: {
      id: string;
      name: string;
      color: string;
    };
  }>;
}

interface Answer {
  id: string;
  content: string;
  vote_count: number;
  is_accepted: boolean;
  created_at: string;
  user_id: string;
  profiles?: {
    username: string;
    display_name: string;
  } | null;
}

const QuestionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [newAnswer, setNewAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchQuestion();
      fetchAnswers();
      incrementViewCount();
    }
    checkAuth();
  }, [id]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
  };

  const fetchQuestion = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select(`
          *,
          profiles (username, display_name),
          question_tags (
            tags (id, name, color)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setQuestion(data as any);
    } catch (error) {
      console.error('Error fetching question:', error);
      toast({
        title: "Error",
        description: "Failed to load question",
        variant: "destructive",
      });
    }
  };

  const fetchAnswers = async () => {
    try {
      const { data, error } = await supabase
        .from('answers')
        .select(`
          *,
          profiles (username, display_name)
        `)
        .eq('question_id', id)
        .order('is_accepted', { ascending: false })
        .order('vote_count', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      setAnswers((data as any) || []);
    } catch (error) {
      console.error('Error fetching answers:', error);
    } finally {
      setLoading(false);
    }
  };

  const incrementViewCount = async () => {
    if (id) {
      await supabase.rpc('increment_question_views', { question_id_param: id });
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to post an answer",
        variant: "destructive",
      });
      return;
    }

    if (!newAnswer.trim()) {
      toast({
        title: "Answer required",
        description: "Please provide an answer",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('answers')
        .insert({
          content: newAnswer.trim(),
          question_id: id,
          user_id: user.id,
        });

      if (error) throw error;

      toast({
        title: "Answer posted!",
        description: "Your answer has been posted successfully",
      });

      setNewAnswer("");
      fetchAnswers();
      fetchQuestion(); // Refresh to update answer count
    } catch (error: any) {
      console.error('Error posting answer:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to post answer",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptAnswer = (answerId: string) => {
    // Refresh the data after accepting
    fetchAnswers();
    fetchQuestion();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading question...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <h2 className="text-2xl font-bold mb-4">Question not found</h2>
              <p className="text-muted-foreground mb-6">
                The question you're looking for doesn't exist or has been removed.
              </p>
              <Button asChild>
                <Link to="/">Back to Questions</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Question */}
            <Card>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <VoteButtons
                    questionId={question.id}
                    currentVoteCount={question.vote_count || 0}
                    onVoteChange={(newCount) => 
                      setQuestion(prev => prev ? { ...prev, vote_count: newCount } : null)
                    }
                  />
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-4">{question.title}</CardTitle>
                    
                    {/* Question Meta */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>Asked {formatDistanceToNow(new Date(question.created_at))} ago</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{question.view_count || 0} views</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        <span>{question.answer_count || 0} answers</span>
                      </div>
                    </div>

                    {/* Question Content */}
                    <div 
                      className="prose prose-sm max-w-none mb-4"
                      dangerouslySetInnerHTML={{ __html: question.content }}
                    />

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {question.question_tags.map((qt) => (
                        <Badge 
                          key={qt.tags.id} 
                          variant="secondary"
                          className="bg-tag-bg text-tag-text hover:bg-tag-bg/80"
                        >
                          {qt.tags.name}
                        </Badge>
                      ))}
                    </div>

                    {/* Author */}
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4" />
                      <span className="font-medium">
                        {question.profiles?.display_name || question.profiles?.username}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Answers Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {answers.map((answer, index) => (
                  <div key={answer.id}>
                    <div className="flex items-start gap-4">
                      <VoteButtons
                        answerId={answer.id}
                        questionId={question.id}
                        currentVoteCount={answer.vote_count || 0}
                        isAccepted={answer.is_accepted}
                        canAccept={user?.id === question.user_id && !question.accepted_answer_id}
                        onAccept={() => handleAcceptAnswer(answer.id)}
                        onVoteChange={(newCount) => {
                          setAnswers(prev => 
                            prev.map(a => a.id === answer.id ? { ...a, vote_count: newCount } : a)
                          );
                        }}
                      />
                      <div className="flex-1">
                        {answer.is_accepted && (
                          <div className="flex items-center gap-2 text-vote-accepted mb-3">
                            <CheckCircle className="h-5 w-5" />
                            <span className="font-medium">Accepted Answer</span>
                          </div>
                        )}
                        
                        <div 
                          className="prose prose-sm max-w-none mb-4"
                          dangerouslySetInnerHTML={{ __html: answer.content }}
                        />
                        
                        {/* Answer Meta */}
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="font-medium">
                              {answer.profiles?.display_name || answer.profiles?.username}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{formatDistanceToNow(new Date(answer.created_at))} ago</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {index < answers.length - 1 && <Separator className="mt-6" />}
                  </div>
                ))}

                {answers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No answers yet. Be the first to answer!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Answer Form */}
            {user ? (
              <Card>
                <CardHeader>
                  <CardTitle>Your Answer</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitAnswer} className="space-y-4">
                    <RichTextEditor
                      content={newAnswer}
                      onChange={setNewAnswer}
                      placeholder="Write your answer here..."
                    />
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={submitting || !newAnswer.trim()}
                        className="bg-gradient-primary hover:opacity-90"
                      >
                        {submitting ? "Posting..." : "Post Answer"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground mb-4">
                    You must be signed in to post an answer.
                  </p>
                  <Button asChild>
                    <Link to="/auth">Sign In</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Related Questions */}
            <Card>
              <CardHeader>
                <CardTitle>Related</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Related questions will appear here based on tags and content.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default QuestionDetail;