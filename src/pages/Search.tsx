import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Search, User, Clock, MessageSquare, Eye } from "lucide-react";
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

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    }
  }, [searchParams]);

  const performSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setLoading(true);
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
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuestions((data as any) || []);
    } catch (error) {
      console.error('Error searching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              type="search"
              placeholder="Search questions..."
              className="pl-12 text-lg h-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button 
              type="submit" 
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
              disabled={!searchQuery.trim()}
            >
              Search
            </Button>
          </div>
        </form>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Searching...</p>
            </div>
          </div>
        ) : searchParams.get('q') ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">
                Search Results for "{searchParams.get('q')}"
              </h1>
              <span className="text-muted-foreground">
                {questions.length} result{questions.length !== 1 ? 's' : ''}
              </span>
            </div>

            {questions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h2 className="text-xl font-semibold mb-2">No results found</h2>
                  <p className="text-muted-foreground mb-6">
                    Try adjusting your search terms or browse our questions.
                  </p>
                  <Button asChild>
                    <Link to="/">Browse Questions</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {questions.map((question) => (
                  <Card key={question.id} className="hover:shadow-hover transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        {/* Stats Column */}
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

                        {/* Content */}
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

                          {/* Meta */}
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
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-semibold mb-2">Search Questions</h2>
            <p className="text-muted-foreground">
              Enter your search terms above to find questions and answers.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default SearchPage;