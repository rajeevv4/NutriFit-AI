import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DetectedFood {
  name: string;
  confidence: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  weight: string;
}

interface EditMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  food: DetectedFood;
  onSave: (updatedFood: DetectedFood) => void;
}

export const EditMealModal: React.FC<EditMealModalProps> = ({
  isOpen,
  onClose,
  food,
  onSave,
}) => {
  const [editedFood, setEditedFood] = useState<DetectedFood>(food);

  const handleSave = () => {
    onSave(editedFood);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Food Details</DialogTitle>
          <DialogDescription>
            Adjust the detected food name, weight, and nutritional values
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Food Name</Label>
            <Input
              id="name"
              value={editedFood.name}
              onChange={(e) =>
                setEditedFood({ ...editedFood, name: e.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="weight">Weight</Label>
            <Input
              id="weight"
              value={editedFood.weight}
              onChange={(e) =>
                setEditedFood({ ...editedFood, weight: e.target.value })
              }
              placeholder="e.g., 150g"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="calories">Calories</Label>
              <Input
                id="calories"
                type="number"
                value={editedFood.calories}
                onChange={(e) =>
                  setEditedFood({
                    ...editedFood,
                    calories: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="protein">Protein (g)</Label>
              <Input
                id="protein"
                type="number"
                value={editedFood.protein}
                onChange={(e) =>
                  setEditedFood({
                    ...editedFood,
                    protein: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="carbs">Carbs (g)</Label>
              <Input
                id="carbs"
                type="number"
                value={editedFood.carbs}
                onChange={(e) =>
                  setEditedFood({
                    ...editedFood,
                    carbs: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fat">Fat (g)</Label>
              <Input
                id="fat"
                type="number"
                value={editedFood.fat}
                onChange={(e) =>
                  setEditedFood({
                    ...editedFood,
                    fat: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
