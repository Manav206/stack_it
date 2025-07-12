import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/Header";
import { VoteButtons } from "@/components/VoteButtons";
import { MessageSquare, Eye, Clock, User, TrendingUp, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface Question {
  id: string;
  title: string;
  content: string;
  vote_count: number;
  answer_count: number;
  view_count: number;
  created_at: string;
  user_id: string;
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

const Index = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    filterAndSortQuestions();
  }, [questions, activeTab, searchQuery]);

  const fetchQuestions = async () => {
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuestions((data as any) || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortQuestions = () => {
    let filtered = questions;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = questions.filter(q => 
        q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.question_tags.some(qt => 
          qt.tags.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Sort based on active tab
    switch (activeTab) {
      case "newest":
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "popular":
        filtered.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0));
        break;
      case "unanswered":
        filtered = filtered.filter(q => (q.answer_count || 0) === 0);
        break;
      case "active":
        filtered.sort((a, b) => (b.answer_count || 0) - (a.answer_count || 0));
        break;
    }

    setFilteredQuestions(filtered);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading questions...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-hero rounded-2xl p-8 mb-8 text-white text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to AnswerSpark</h1>
          <p className="text-xl mb-6 text-white/90">
            Ask questions, share knowledge, and learn from the community
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
              <Link to="/ask">Ask a Question</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
              <Link to="/auth">Join Community</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h2 className="text-2xl font-bold">Latest Questions</h2>
              
              {/* Search */}
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="newest">Newest</TabsTrigger>
                <TabsTrigger value="popular">Popular</TabsTrigger>
                <TabsTrigger value="unanswered">Unanswered</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Questions List */}
            <div className="space-y-4">
              {filteredQuestions.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground mb-4">
                      {searchQuery ? "No questions found matching your search." : "No questions yet."}
                    </p>
                    <Button asChild>
                      <Link to="/ask">Ask the First Question</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                filteredQuestions.map((question) => (
                  <Card key={question.id} className="hover:shadow-hover transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        {/* Vote/Stats Column */}
                        <div className="flex flex-col items-center text-center space-y-2 min-w-[80px]">
                          <div className="text-sm text-muted-foreground">
                            <div className="font-medium">{question.vote_count || 0}</div>
                            <div>votes</div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <div className="font-medium">{question.answer_count || 0}</div>
                            <div>answers</div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <div className="font-medium">{question.view_count || 0}</div>
                            <div>views</div>
                          </div>
                        </div>

                        {/* Question Content */}
                        <div className="flex-1">
                          <Link to={`/question/${question.id}`}>
                            <h3 className="text-lg font-semibold hover:text-primary mb-2">
                              {question.title}
                            </h3>
                          </Link>
                          
                          <p className="text-muted-foreground mb-3 line-clamp-2">
                            {question.content.replace(/<[^>]*>/g, '').substring(0, 200)}...
                          </p>

                          {/* Tags */}
                          <div className="flex flex-wrap gap-2 mb-3">
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

                          {/* Question Meta */}
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>{question.profiles?.display_name || question.profiles?.username}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>{formatDistanceToNow(new Date(question.created_at))} ago</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Community Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Questions</span>
                  <span className="font-medium">{questions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Answered</span>
                  <span className="font-medium">
                    {questions.filter(q => (q.answer_count || 0) > 0).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unanswered</span>
                  <span className="font-medium">
                    {questions.filter(q => (q.answer_count || 0) === 0).length}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Popular Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Popular Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {[...new Set(questions.flatMap(q => q.question_tags.map(qt => qt.tags)))]
                    .slice(0, 10)
                    .map((tag) => (
                    <Badge 
                      key={tag.id} 
                      variant="secondary"
                      className="bg-tag-bg text-tag-text hover:bg-tag-bg/80 cursor-pointer"
                      onClick={() => setSearchQuery(tag.name)}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
