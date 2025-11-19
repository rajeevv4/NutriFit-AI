import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EditMealModal } from '@/components/EditMealModal';
import { 
  Camera, 
  Upload, 
  Scan, 
  Utensils,
  Plus,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DetectedFood {
  name: string;
  confidence: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  weight: string;
}

interface NutritionAnalysis {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  foods: DetectedFood[];
  mealType: string;
}

export const PhotoNutritionAnalysis: React.FC = () => {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<NutritionAnalysis | null>(null);
  const [editingFood, setEditingFood] = useState<DetectedFood | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setAnalysis(null);
    }
  };

  const analyzePhoto = async () => {
    if (!selectedFile) {
      toast({
        title: "No photo selected",
        description: "Please upload a photo of your meal first",
        variant: "destructive"
      });
      return;
    }

    setAnalyzing(true);
    toast({
      title: "Analyzing your meal...",
      description: "AI is detecting food items and calculating nutrition",
    });

    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      const imageBase64 = await base64Promise;

      // Call the analyze-food-photo endpoint (it already exists and works!)
      const { data, error } = await supabase.functions.invoke('analyze-food-photo', {
        body: { imageBase64 }
      });

      if (error) throw error;
      if (!data?.analysis) throw new Error("No analysis data returned");

      const result = data.analysis;

      // Transform the API response to match the UI format
      const analysisResult: NutritionAnalysis = {
        totalCalories: result.total_calories,
        totalProtein: result.protein,
        totalCarbs: result.carbs,
        totalFat: result.fats,
        mealType: "Meal",
        foods: result.food_items.map((foodName: string, index: number) => ({
          name: foodName,
          confidence: result.confidence || 85,
          calories: Math.round(result.total_calories / result.food_items.length),
          protein: Math.round(result.protein / result.food_items.length),
          carbs: Math.round(result.carbs / result.food_items.length),
          fat: Math.round(result.fats / result.food_items.length),
          weight: "estimated"
        }))
      };

      setAnalysis(analysisResult);
      toast({
        title: "Analysis complete!",
        description: `Detected ${analysisResult.foods.length} food items`,
      });
    } catch (error) {
      console.error("Error analyzing photo:", error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Failed to analyze meal photo",
        variant: "destructive"
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const addToMealLog = async () => {
    if (!analysis) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to save meals",
          variant: "destructive"
        });
        return;
      }

      // Create meal name from detected foods
      const mealName = analysis.foods.map(f => f.name).join(', ');

      // Insert into meals table
      const { error } = await supabase
        .from('meals')
        .insert({
          user_id: session.user.id,
          meal_name: mealName,
          food_items: analysis.foods.map(f => ({
            name: f.name,
            calories: f.calories,
            protein: f.protein,
            carbs: f.carbs,
            fat: f.fat,
            weight: f.weight
          })),
          total_calories: analysis.totalCalories,
          total_protein: analysis.totalProtein,
          total_carbs: analysis.totalCarbs,
          total_fats: analysis.totalFat,
          meal_type: analysis.mealType,
          photo_url: imagePreview,
          consumed_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Added to meal log! 🎉",
        description: `${analysis.totalCalories} calories logged for ${analysis.mealType.toLowerCase()}`,
      });

      // Reset the form
      setSelectedFile(null);
      setImagePreview(null);
      setAnalysis(null);
    } catch (error) {
      console.error('Error saving meal:', error);
      toast({
        title: "Error",
        description: "Failed to save meal to log",
        variant: "destructive"
      });
    }
  };

  const handleEditFood = (food: DetectedFood, index: number) => {
    setEditingFood(food);
    setEditingIndex(index);
  };

  const handleSaveEditedFood = (updatedFood: DetectedFood) => {
    if (analysis && editingIndex !== null) {
      const updatedFoods = [...analysis.foods];
      updatedFoods[editingIndex] = updatedFood;
      
      // Recalculate totals
      const totalCalories = updatedFoods.reduce((sum, f) => sum + f.calories, 0);
      const totalProtein = updatedFoods.reduce((sum, f) => sum + f.protein, 0);
      const totalCarbs = updatedFoods.reduce((sum, f) => sum + f.carbs, 0);
      const totalFat = updatedFoods.reduce((sum, f) => sum + f.fat, 0);

      setAnalysis({
        ...analysis,
        foods: updatedFoods,
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
      });

      toast({
        title: "Food details updated!",
        description: "Nutritional values have been recalculated",
      });
    }
    setEditingFood(null);
    setEditingIndex(null);
  };

  return (
    <div className="space-y-6">
      {/* Photo Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Scan className="mr-2 h-5 w-5" />
            AI Nutrition Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Area */}
          <div 
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => document.getElementById('photo-nutrition-upload')?.click()}
          >
            {imagePreview ? (
              <div className="space-y-4">
                <img 
                  src={imagePreview} 
                  alt="Meal to analyze" 
                  className="max-h-64 mx-auto rounded-lg object-cover"
                />
                <p className="text-sm text-muted-foreground">
                  Click to change photo or analyze current image
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <Camera className="h-16 w-16 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="font-medium">Upload meal photo</h3>
                  <p className="text-sm text-muted-foreground">
                    AI will detect food items and calculate nutrition automatically
                  </p>
                </div>
              </div>
            )}
          </div>

          <input
            id="photo-nutrition-upload"
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />

          <div className="flex gap-2">
            <Button
              onClick={analyzePhoto}
              disabled={!selectedFile || analyzing}
              className="flex-1"
            >
              <Sparkles className={`mr-2 h-4 w-4 ${analyzing ? 'animate-spin' : ''}`} />
              {analyzing ? 'Analyzing...' : 'Analyze Nutrition'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => document.getElementById('photo-nutrition-upload')?.click()}
            >
              <Upload className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <Card className="metric-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <CheckCircle className="mr-2 h-5 w-5 text-success" />
                Nutrition Analysis Complete
              </CardTitle>
              <Badge variant="secondary">{analysis.mealType}</Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Total Nutrition Summary */}
            <div className="bg-gradient-accent/10 rounded-lg p-4">
              <h3 className="font-medium mb-3">Total Nutrition</h3>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold gradient-text">{analysis.totalCalories}</div>
                  <div className="text-xs text-muted-foreground">Calories</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-success">{analysis.totalProtein}g</div>
                  <div className="text-xs text-muted-foreground">Protein</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-warning">{analysis.totalCarbs}g</div>
                  <div className="text-xs text-muted-foreground">Carbs</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-secondary">{analysis.totalFat}g</div>
                  <div className="text-xs text-muted-foreground">Fat</div>
                </div>
              </div>
            </div>

            {/* Detected Foods */}
            <div>
              <h3 className="font-medium mb-3 flex items-center">
                <Utensils className="mr-2 h-4 w-4" />
                Detected Food Items
              </h3>
              <div className="space-y-3">
                {analysis.foods.map((food, index) => (
                  <div 
                    key={index}
                    className="p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{food.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {food.weight} • {food.confidence}% confidence
                        </p>
                      </div>
                      <Badge variant="secondary">{food.calories} cal</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Protein</p>
                        <p className="font-medium">{food.protein}g</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Carbs</p>
                        <p className="font-medium">{food.carbs}g</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Fat</p>
                        <p className="font-medium">{food.fat}g</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3"
                      onClick={() => handleEditFood(food, index)}
                    >
                      Edit Details
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={addToMealLog} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add to Meal Log
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Modal */}
      {editingFood && (
        <EditMealModal
          isOpen={!!editingFood}
          onClose={() => {
            setEditingFood(null);
            setEditingIndex(null);
          }}
          food={editingFood}
          onSave={handleSaveEditedFood}
        />
      )}
    </div>
  );
};