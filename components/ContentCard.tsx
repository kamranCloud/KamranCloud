import { motion } from "framer-motion";
import { ExternalLink, FileText, Download } from "lucide-react";
import { Content } from "@/types";
import { Button } from "./ui/button";

interface ContentCardProps {
  content: Content;
  delay?: number;
}

const ContentCard = ({ content, delay = 0 }: ContentCardProps) => {
  if (content.type === 'notes') {
    const getDownloadUrl = (url: string) => {
      const fileIdMatch = url.match(/file\/d\/(.*?)\//);
      if (fileIdMatch && fileIdMatch[1]) {
        const fileId = fileIdMatch[1];
        return `https://drive.google.com/uc?export=download&id=${fileId}`;
      }
      return url; // Fallback to original URL if parsing fails
    };
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay }}
        className="flex flex-col h-full bg-destructive/10 rounded-2xl border-2 border-destructive/20 shadow-doodle overflow-hidden"
      >
        {/* Icon */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-destructive">
          <FileText className="w-16 h-16 mb-4" />
          <h4 className="font-bold text-lg text-foreground mb-2 line-clamp-2">
            {content.title}
          </h4>
          {content.description && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {content.description}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-card/50 border-t-2 border-destructive/20 grid grid-cols-2 gap-3">
          <Button asChild variant="outline">
            <a href={getDownloadUrl(content.url)} target="_blank" rel="noopener noreferrer">
              <Download className="w-4 h-4 mr-2" />
              Download
            </a>
          </Button>
          <Button asChild>
            <a href={content.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Notes
            </a>
          </Button>
        </div>
      </motion.div>
    );
  }
  
  // Existing Video Card Logic
  const getThumbnailUrl = () => {
    if (content.thumbnail) return content.thumbnail;
    if (content.url.includes('youtube.com/watch?v=')) {
      const videoId = content.url.split('v=')[1].split('&')[0];
      return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    }
    return null;
  };

  const thumbnailUrl = getThumbnailUrl();

  return (
    <motion.a
      href={content.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: "spring", damping: 20 }}
      whileHover={{ scale: 1.02, y: -5 }}
      className="group flex flex-col h-full bg-card/80 backdrop-blur-sm rounded-2xl border-2 border-border hover:border-primary shadow-doodle hover:shadow-doodle-lg transition-smooth overflow-hidden"
    >
      <div className="relative aspect-video bg-muted overflow-hidden">
        {thumbnailUrl ? (
          <>
            <img src={thumbnailUrl} alt={content.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ExternalLink className="w-12 h-12 text-white/80" />
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
            <FileText className="w-16 h-16 text-primary/50" />
          </div>
        )}
      </div>

      <div className="flex-1 p-4 flex flex-col">
        <h4 className="font-bold text-md text-foreground mb-2 flex-1 line-clamp-2 group-hover:text-primary transition-smooth">
          {content.title}
        </h4>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-semibold capitalize px-2 py-1 bg-muted rounded-full">
            {content.type}
          </span>
          <ExternalLink className="w-4 h-4" />
        </div>
      </div>
    </motion.a>
  );
};

export default ContentCard;
