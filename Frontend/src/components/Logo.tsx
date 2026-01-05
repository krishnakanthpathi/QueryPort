import { Zap } from 'lucide-react';

const Logo: React.FC<{ className?: string }> = ({ className = "h-8 w-8" }) => {
  return (
    <Zap className={className} />
  );
};

export default Logo;
