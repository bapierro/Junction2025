import { Check, Copy, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner@2.0.3';

interface ShareConfirmationScreenProps {
  onGoToStoryWall: () => void;
  onBackToHome: () => void;
  shareLink?: string | null;
}

export function ShareConfirmationScreen({ onGoToStoryWall, onBackToHome, shareLink }: ShareConfirmationScreenProps) {
  const fallback = 'storycircle.app/story/abc123xyz';
  const sanitizedLink = (shareLink || fallback).replace(/^https?:\/\//, '');

  const handleCopyLink = () => {
    const value = shareLink?.startsWith('http') ? shareLink : `https://${sanitizedLink}`;
    navigator.clipboard.writeText(value);
    toast.success('Link copied to clipboard!');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-md mx-auto w-full text-center space-y-8">
        {/* Success Icon */}
        <div className="w-24 h-24 rounded-full bg-green-500 mx-auto flex items-center justify-center shadow-xl">
          <Check className="w-12 h-12 text-white" strokeWidth={3} />
        </div>

        {/* Message */}
        <div>
          <h1 className="text-amber-900 mb-3">Your story is ready to share!</h1>
          <p className="text-amber-800/80">
            Your story has been published and is now part of the Story Wall
          </p>
        </div>

        {/* Share Link */}
        <div className="bg-white rounded-xl p-5 shadow-md border-2 border-amber-200">
          <p className="text-amber-800/70 mb-3">Share this link:</p>
          <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg mb-4">
            <code className="flex-1 text-amber-900 break-all">{sanitizedLink}</code>
          </div>
          <Button
            onClick={handleCopyLink}
            size="lg"
            className="w-full h-14 bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Copy className="w-6 h-6 mr-3" />
            <span>Copy Link</span>
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 pt-4">
          <Button
            onClick={onGoToStoryWall}
            size="lg"
            className="w-full h-16 bg-amber-600 hover:bg-amber-700 text-white shadow-lg"
          >
            <ExternalLink className="w-6 h-6 mr-3" />
            <span>Go to Public Story Wall</span>
          </Button>

          <Button
            onClick={onBackToHome}
            size="lg"
            variant="outline"
            className="w-full h-16 bg-white border-2 border-amber-300 text-amber-900 hover:bg-amber-50"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
