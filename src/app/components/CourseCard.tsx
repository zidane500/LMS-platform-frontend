import React from 'react';
import { motion } from 'motion/react';
import { Clock, BarChart, BookOpen, User, Edit, Trash2 } from 'lucide-react';
import { Course } from '../types';
import { Card, CardContent, CardFooter } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Button } from './ui/button';

interface CourseCardProps {
  course: Course;
  progress?: number;
  onEnroll?: () => void;
  onView: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showAdminActions?: boolean;
}

export const CourseCard: React.FC<CourseCardProps> = ({ 
  course, 
  progress,
  onEnroll,
  onView,
  onEdit,
  onDelete,
  showAdminActions = false
}) => {
  const levelColors = {
    'Débutant': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
    'Intermédiaire': 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
    'Avancé': 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  };

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Card className="overflow-hidden h-full flex flex-col group cursor-pointer hover:shadow-xl transition-shadow">
        <div className="relative overflow-hidden">
          <motion.img
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.4 }}
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <Badge 
            className={`absolute top-3 right-3 ${levelColors[course.level]}`}
          >
            {course.level}
          </Badge>
          
          {/* Admin Actions Buttons */}
          {showAdminActions && (
            <div className="absolute top-3 left-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 bg-white/90 hover:bg-white shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                >
                  <Edit className="w-4 h-4 text-blue-600" />
                </Button>
              )}
              {onDelete && (
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 bg-white/90 hover:bg-white shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              )}
            </div>
          )}
          
          {progress !== undefined && (
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-center justify-between text-white text-sm mb-1">
                <span>Progression</span>
                <span className="font-bold">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>

        <CardContent className="flex-1 p-6">
          <Badge variant="outline" className="mb-2">
            {course.category}
          </Badge>
          <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {course.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
            {course.description}
          </p>

          <div className="flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{course.estimatedDuration}h</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              <span>{course.modules?.length || 0} modules</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-6 pt-0">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full"
          >
            {progress !== undefined ? (
              <Button onClick={onView} className="w-full">
                Continuer le cours
              </Button>
            ) : (
              <Button onClick={onEnroll || onView} variant="outline" className="w-full">
                Voir le cours
              </Button>
            )}
          </motion.div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};