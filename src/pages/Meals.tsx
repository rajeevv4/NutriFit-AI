import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RecipeGenerator } from '@/components/RecipeGenerator';
import { PhotoNutritionAnalysis } from '@/components/PhotoNutritionAnalysis';
import { 
  Camera, 
  Mic, 
  Plus, 
  Upload,
  Utensils,
  Clock,
  Zap,
  Apple,
  ChefHat,
  Scan
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

const Meals = () => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [recentMeals, setRecentMeals] = useState<any[]>([]);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      toast({
        title: "Photo uploaded!",
        description: "AI is analyzing your meal... This may take a few moments.",
      });
    }
  };

  const handleVoiceRecord = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      toast({
        title: "Recording started",
        description: "Describe your meal and I'll log it for you!",
      });
    } else {
      toast({
        title: "Recording stopped",
        description: "Processing your voice input...",
      });
    }
  };

  // Fetch recent meals from Supabase
  useEffect(() => {
    const fetchRecentMeals = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data, error } = await supabase
          .from('meals')
          .select('*')
          .eq('user_id', session.user.id)
          .order('consumed_at', { ascending: false })
          .limit(10);

        if (data && !error) {
          setRecentMeals(data);
        }
      } catch (error) {
        console.error('Error fetching recent meals:', error);
      }
    };

    fetchRecentMeals();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchRecentMeals, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold gradient-text">NutriFit Meals</h1>
        <p className="text-muted-foreground">
          Track your nutrition with AI-powered meal recognition and recipe generation
        </p>
      </header>

      {/* Enhanced Meal Logging Tabs */}
      <Tabs defaultValue="ai-recipes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ai-recipes">AI Recipes</TabsTrigger>
          <TabsTrigger value="photo-analysis">Photo Analysis</TabsTrigger>
        </TabsList>

        {/* AI Recipe Generation Tab */}
        <TabsContent value="ai-recipes" className="space-y-6">
          <RecipeGenerator />
          
          {/* Recent Meals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Recent Meals
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentMeals.length > 0 ? (
                <div className="space-y-4">
                  {recentMeals.map((meal) => (
                    <div key={meal.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{meal.meal_name}</h4>
                          {meal.meal_type && (
                            <Badge variant="outline" className="text-xs capitalize">
                              {meal.meal_type}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(meal.consumed_at).toLocaleString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            hour: 'numeric', 
                            minute: '2-digit' 
                          })}
                        </p>
                        <div className="flex space-x-4 text-xs text-muted-foreground mt-2">
                          {meal.total_protein && <span>P: {meal.total_protein}g</span>}
                          {meal.total_carbs && <span>C: {meal.total_carbs}g</span>}
                          {meal.total_fats && <span>F: {meal.total_fats}g</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold gradient-text">
                          {meal.total_calories}
                        </div>
                        <div className="text-xs text-muted-foreground">calories</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No meals logged yet. Start by generating a recipe or analyzing a photo!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Photo Analysis Tab */}
        <TabsContent value="photo-analysis" className="space-y-6">
          <PhotoNutritionAnalysis />
          
          {/* Recent Meals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Recent Meals
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentMeals.length > 0 ? (
                <div className="space-y-4">
                  {recentMeals.map((meal) => (
                    <div key={meal.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{meal.meal_name}</h4>
                          {meal.meal_type && (
                            <Badge variant="outline" className="text-xs capitalize">
                              {meal.meal_type}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(meal.consumed_at).toLocaleString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            hour: 'numeric', 
                            minute: '2-digit' 
                          })}
                        </p>
                        <div className="flex space-x-4 text-xs text-muted-foreground mt-2">
                          {meal.total_protein && <span>P: {meal.total_protein}g</span>}
                          {meal.total_carbs && <span>C: {meal.total_carbs}g</span>}
                          {meal.total_fats && <span>F: {meal.total_fats}g</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold gradient-text">
                          {meal.total_calories}
                        </div>
                        <div className="text-xs text-muted-foreground">calories</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No meals logged yet. Start by generating a recipe or analyzing a photo!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Meals;