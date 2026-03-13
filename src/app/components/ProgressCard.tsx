import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Target, Award, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';

interface ProgressCardProps {
  title: string;
  value: number;
  icon: 'trophy' | 'target' | 'award' | 'zap';
  color: string;
  suffix?: string;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({ 
  title, 
  value, 
  icon, 
  color,
  suffix = '%'
}) => {
  const icons = {
    trophy: Trophy,
    target: Target,
    award: Award,
    zap: Zap,
  };

  const Icon = icons[icon];

  const gradients = {
    blue: 'from-blue-500 to-cyan-500',
    purple: 'from-purple-500 to-pink-500',
    green: 'from-green-500 to-emerald-500',
    orange: 'from-orange-500 to-red-500',
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            {title}
          </CardTitle>
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
            className={`p-2 rounded-lg bg-gradient-to-br ${gradients[color as keyof typeof gradients] || gradients.blue}`}
          >
            <Icon className="w-5 h-5 text-white" />
          </motion.div>
        </CardHeader>
        <CardContent>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 100 }}
            className="text-3xl font-bold mb-2"
          >
            {value}{suffix}
          </motion.div>
          {suffix === '%' && (
            <Progress 
              value={value} 
              className="h-2"
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
