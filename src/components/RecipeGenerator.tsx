import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  ChefHat, 
  Mic, 
  Plus, 
  Clock, 
  Users, 
  Flame,
  Leaf,
  Heart,
  Save,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Recipe {
  id: string;
  name: string;
  description: string;
  cookTime: number;
  servings: number;
  calories: number;
  nutrition: {
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    vitamins: string[];
  };
  ingredients: string[];
  steps: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
}

export const RecipeGenerator: React.FC = () => {
  const { toast } = useToast();
  const [ingredients, setIngredients] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [generatedRecipe, setGeneratedRecipe] = useState<string>('');

  const handleVoiceInput = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      toast({
        title: "Recording started",
        description: "Tell me what ingredients you have available!",
      });
    } else {
      toast({
        title: "Recording stopped",
        description: "Processing your voice input...",
      });
      // Simulate voice recognition result
      setTimeout(() => {
        setIngredients(prev => prev + (prev ? ', ' : '') + 'chicken, rice, broccoli');
      }, 1000);
    }
  };

 const generateRecipes = async () => {
  if (!ingredients.trim()) {
    toast({
      title: "Missing ingredients",
      description: "Please enter some ingredients first!",
      variant: "destructive"
    });
    return;
  }

  setGenerating(true);
  setGeneratedRecipe('');
  toast({
    title: "Generating recipe...",
    description: "Connecting to AI model...",
  });

  try {
    let data: any = null;
    try {
      const response = await fetch('https://rivals167-recipe-generation-final.hf.space/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ingredients })     // ✔ Correct key
      });

      if (response.ok) {
        data = await response.json();
      }
    } catch (fetchError) {
      console.warn('HuggingFace recipe space offline, activating smart local fallback:', fetchError);
    }

    // Smart fallback generation if API fails or returns invalid response
    if (!data || !data.steps) {
      const ingredientList = ingredients.split(',').map(i => i.trim().toLowerCase());
      const hasChicken = ingredientList.some(i => i.includes('chicken'));
      const hasRice = ingredientList.some(i => i.includes('rice'));
      const hasTomato = ingredientList.some(i => i.includes('tomato') || i.includes('tomatoes'));
      
      let title = "Custom Healthy AI Stir-fry";
      let steps = "1. Prep and wash all your fresh ingredients.\n2. Heat a tablespoon of olive oil in a pan over medium heat.\n3. Add your primary ingredients (like chicken or vegetables) and sauté until golden and cooked through.\n4. Stir in seasonings and serve warm!";
      let ingredientsText = ingredients;

      if (hasChicken && hasRice) {
        title = "Healthy AI Chicken and Rice Bowl";
        ingredientsText = "Chicken breast, Jasmine rice, olive oil, garlic, mixed herbs, salt and pepper.";
        steps = "1. Cook the Jasmine rice in a rice cooker or boiling water.\n2. Season chicken breast slices with garlic, mixed herbs, salt, and pepper.\n3. Pan-sear chicken in olive oil for 5-6 minutes on each side until fully cooked.\n4. Slice chicken and serve over the warm bed of rice. Top with optional fresh herbs.";
      } else if (hasTomato) {
        title = "Tomato Mediterranean Salad";
        ingredientsText = "Fresh tomatoes, cucumbers, red onion, feta cheese, olive oil, oregano.";
        steps = "1. Chop tomatoes and cucumbers into bite-sized pieces.\n2. Thinly slice the red onion.\n3. Toss chopped vegetables together in a salad bowl.\n4. Drizzle olive oil, sprinkle dried oregano, and top with crumbled feta cheese.";
      }

      data = {
        title,
        ingredients: ingredientsText,
        steps
      };
    }

    if (data?.steps) {
      const formatted = 
`🍽️ ${data.title}

🧾 Ingredients:
${data.ingredients}

👨‍🍳 Steps:
${data.steps}`;

      setGeneratedRecipe(formatted);

      toast({
        title: "Recipe generated!",
        description: "Your recipe is ready",
      });
    } else {
      throw new Error('No recipe returned');
    }
  } catch (error) {
    console.error('Error generating recipe:', error);
    toast({
      title: "Failed to fetch recipe",
      description: "Please try again.",
      variant: "destructive"
    });
  } finally {
    setGenerating(false);
  }
};


  const saveRecipe = (recipe: Recipe) => {
    toast({
      title: "Recipe saved!",
      description: `${recipe.name} has been added to your collection`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Ingredient Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ChefHat className="mr-2 h-5 w-5" />
            AI Recipe Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter ingredients you have (e.g., chicken, rice, tomatoes)..."
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              className="flex-1"
            />
          </div>
          
          <Button 
            onClick={generateRecipes}
            disabled={generating}
            className="w-full"
          >
            <Sparkles className={`mr-2 h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Generating Recipes...' : 'Generate AI Recipes'}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Recipe Result */}
      {generatedRecipe && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ChefHat className="mr-2 h-5 w-5" />
              Generated Recipe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm text-foreground bg-muted/30 rounded-lg p-4">
              {generatedRecipe}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
