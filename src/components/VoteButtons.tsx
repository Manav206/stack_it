import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface VoteButtonsProps {
  questionId?: string;
  answerId?: string;
  currentVoteCount: number;
  userVote?: number; // 1 for upvote, -1 for downvote, null for no vote
  isAccepted?: boolean;
  canAccept?: boolean;
  onVoteChange?: (newVoteCount: number) => void;
  onAccept?: () => void;
}

export const VoteButtons = ({
  questionId,
  answerId,
  currentVoteCount,
  userVote,
  isAccepted = false,
  canAccept = false,
  onVoteChange,
  onAccept,
}: VoteButtonsProps) => {
  const [voteCount, setVoteCount] = useState(currentVoteCount);
  const [currentUserVote, setCurrentUserVote] = useState<number | null>(userVote || null);
  const [isVoting, setIsVoting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setVoteCount(currentVoteCount);
    setCurrentUserVote(userVote || null);
  }, [currentVoteCount, userVote]);

  const handleVote = async (voteType: number) => {
    setIsVoting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to vote",
          variant: "destructive",
        });
        return;
      }

      // Remove existing vote if it's the same
      if (currentUserVote === voteType) {
        const { error } = await supabase
          .from('votes')
          .delete()
          .eq('user_id', user.id)
          .eq(questionId ? 'question_id' : 'answer_id', questionId || answerId);

        if (error) throw error;

        const newVoteCount = voteCount - voteType;
        setVoteCount(newVoteCount);
        setCurrentUserVote(null);
        onVoteChange?.(newVoteCount);
      } else {
        // Insert or update vote
        const voteData = {
          user_id: user.id,
          vote_type: voteType,
          ...(questionId ? { question_id: questionId } : { answer_id: answerId }),
        };

        const { error } = await supabase
          .from('votes')
          .upsert(voteData, {
            onConflict: 'user_id,' + (questionId ? 'question_id' : 'answer_id'),
          });

        if (error) throw error;

        const voteDiff = voteType - (currentUserVote || 0);
        const newVoteCount = voteCount + voteDiff;
        setVoteCount(newVoteCount);
        setCurrentUserVote(voteType);
        onVoteChange?.(newVoteCount);
      }
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: "Error",
        description: "Failed to record your vote",
        variant: "destructive",
      });
    } finally {
      setIsVoting(false);
    }
  };

  const handleAccept = async () => {
    if (!answerId || !questionId) return;
    
    try {
      const { data, error } = await supabase.rpc('accept_answer', {
        question_id_param: questionId,
        answer_id_param: answerId,
      });

      if (error) throw error;

      if (data) {
        onAccept?.();
        toast({
          title: "Answer accepted",
          description: "This answer has been marked as accepted",
        });
      } else {
        toast({
          title: "Error",
          description: "You can only accept answers to your own questions",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error accepting answer:', error);
      toast({
        title: "Error",
        description: "Failed to accept answer",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col items-center space-y-1">
      {/* Upvote */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "p-2 hover:bg-vote-up/10",
          currentUserVote === 1 && "text-vote-up bg-vote-up/10"
        )}
        onClick={() => handleVote(1)}
        disabled={isVoting}
      >
        <ChevronUp className="h-6 w-6" />
      </Button>

      {/* Vote Count */}
      <div className={cn(
        "font-bold text-lg px-2",
        voteCount > 0 && "text-vote-up",
        voteCount < 0 && "text-vote-down"
      )}>
        {voteCount}
      </div>

      {/* Downvote */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "p-2 hover:bg-vote-down/10",
          currentUserVote === -1 && "text-vote-down bg-vote-down/10"
        )}
        onClick={() => handleVote(-1)}
        disabled={isVoting}
      >
        <ChevronDown className="h-6 w-6" />
      </Button>

      {/* Accept Answer Button */}
      {answerId && (
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "p-2 mt-2",
            isAccepted && "text-vote-accepted bg-vote-accepted/10",
            canAccept && !isAccepted && "hover:bg-vote-accepted/10"
          )}
          onClick={handleAccept}
          disabled={!canAccept || isAccepted}
        >
          <Check className={cn("h-6 w-6", isAccepted && "text-vote-accepted")} />
        </Button>
      )}
    </div>
  );
};