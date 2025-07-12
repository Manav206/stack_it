import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Edit, Save, Trophy, MessageSquare, Eye } from "lucide-react";

interface Profile {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  reputation: number;
  created_at: string;
}

interface UserStats {
  questionsAsked: number;
  answersGiven: number;
  acceptedAnswers: number;
  totalViews: number;
}

const Profile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<UserStats>({ questionsAsked: 0, answersGiven: 0, acceptedAnswers: 0, totalViews: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
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
    fetchProfile(session.user.id);
    fetchUserStats(session.user.id);
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async (userId: string) => {
    try {
      // Get questions asked
      const { count: questionsCount } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Get answers given
      const { count: answersCount } = await supabase
        .from('answers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Get accepted answers
      const { count: acceptedCount } = await supabase
        .from('answers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_accepted', true);

      // Get total views for user's questions
      const { data: questions } = await supabase
        .from('questions')
        .select('view_count')
        .eq('user_id', userId);

      const totalViews = questions?.reduce((sum, q) => sum + (q.view_count || 0), 0) || 0;

      setStats({
        questionsAsked: questionsCount || 0,
        answersGiven: answersCount || 0,
        acceptedAnswers: acceptedCount || 0,
        totalViews,
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile || !user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: profile.display_name,
          bio: profile.bio,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setEditing(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <h2 className="text-2xl font-bold mb-4">Profile not found</h2>
              <p className="text-muted-foreground mb-6">
                There was an error loading your profile.
              </p>
              <Button onClick={() => window.location.reload()}>
                Try Again
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
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 bg-gradient-primary rounded-full flex items-center justify-center">
                  <User className="h-12 w-12 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl">{profile.display_name}</CardTitle>
                <p className="text-muted-foreground">@{profile.username}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Reputation */}
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{profile.reputation || 0}</div>
                  <div className="text-sm text-muted-foreground">Reputation</div>
                </div>

                {/* Bio */}
                <div>
                  <Label className="text-sm font-medium">Bio</Label>
                  {editing ? (
                    <Textarea
                      value={profile.bio || ""}
                      onChange={(e) => setProfile(prev => prev ? { ...prev, bio: e.target.value } : null)}
                      placeholder="Tell us about yourself..."
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {profile.bio || "No bio added yet."}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-4">
                  {editing ? (
                    <div className="flex gap-2">
                      <Button onClick={handleSaveProfile} disabled={saving} className="flex-1">
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? "Saving..." : "Save"}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setEditing(false)}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={() => setEditing(true)} className="w-full">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="questions">Questions</TabsTrigger>
                <TabsTrigger value="answers">Answers</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <div className="text-2xl font-bold">{stats.questionsAsked}</div>
                      <div className="text-sm text-muted-foreground">Questions</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                      <div className="text-2xl font-bold">{stats.answersGiven}</div>
                      <div className="text-sm text-muted-foreground">Answers</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Trophy className="h-8 w-8 mx-auto mb-2 text-vote-accepted" />
                      <div className="text-2xl font-bold">{stats.acceptedAnswers}</div>
                      <div className="text-sm text-muted-foreground">Accepted</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Eye className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                      <div className="text-2xl font-bold">{stats.totalViews}</div>
                      <div className="text-sm text-muted-foreground">Views</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Account Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Username</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{profile.username}</span>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Display Name</Label>
                      {editing ? (
                        <Input
                          value={profile.display_name || ""}
                          onChange={(e) => setProfile(prev => prev ? { ...prev, display_name: e.target.value } : null)}
                          className="mt-1"
                        />
                      ) : (
                        <div className="flex items-center gap-2 mt-1">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{profile.display_name}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{user?.email}</span>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Member since</Label>
                      <div className="text-sm text-muted-foreground mt-1">
                        {new Date(profile.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="questions">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Questions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Your questions will appear here. Questions you've asked will be listed with their current status.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="answers">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Answers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Your answers will appear here. Answers you've provided will be listed with their vote counts and acceptance status.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;