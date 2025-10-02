import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigationCardProps {
  title: string;
  description?: string;
  icon?: string | LucideIcon;
  onClick: () => void;
  className?: string;
  delay?: number;
}

const NavigationCard = ({ 
  title, 
  description, 
  icon, 
  onClick, 
  className,
  delay = 0
}: NavigationCardProps) => {
  const Icon = typeof icon !== 'string' && icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", damping: 20 }}
      whileHover={{ scale: 1.03, y: -8 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative bg-card/80 backdrop-blur-sm rounded-3xl p-8 border-2 border-border hover:border-primary cursor-pointer shadow-doodle hover:shadow-doodle-lg transition-smooth group overflow-hidden",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative flex flex-col items-center text-center space-y-4">
        {(icon || Icon) && (
          <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center text-3xl group-hover:scale-110 group-hover:rotate-3 transition-all shadow-lg">
            {typeof icon === 'string' ? (
              <span className="text-primary-foreground font-bold text-4xl">{icon}</span>
            ) : Icon ? (
              <Icon className="w-10 h-10 text-primary-foreground" />
            ) : null}
          </div>
        )}
        
        <div>
          <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-smooth mb-2">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default NavigationCard;
