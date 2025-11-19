import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { 
  User, 
  Bell, 
  Palette,
  DollarSign,
  Globe,
  Shield,
  Sun,
  Moon,
  Monitor,
  Smartphone,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const { profile: dbProfile, loading, updateProfile } = useProfile();
  const { toast } = useToast();
  
  const [localProfile, setLocalProfile] = useState({
    full_name: '',
    age: null as number | null,
    height: null as number | null,
    weight: null as number | null,
    fitness_goals: ''
  });

  const [dietaryPrefs, setDietaryPrefs] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (dbProfile) {
      setLocalProfile({
        full_name: dbProfile.full_name || '',
        age: dbProfile.age,
        height: dbProfile.height,
        weight: dbProfile.weight,
        fitness_goals: dbProfile.fitness_goals || ''
      });
      setDietaryPrefs(dbProfile.dietary_preferences || []);
    }
  }, [dbProfile]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    await updateProfile({
      full_name: localProfile.full_name,
      age: localProfile.age,
      height: localProfile.height,
      weight: localProfile.weight,
      fitness_goals: localProfile.fitness_goals,
      dietary_preferences: dietaryPrefs
    });
    setIsSaving(false);
  };

  const toggleDietaryPref = (pref: string) => {
    setDietaryPrefs(prev => 
      prev.includes(pref) 
        ? prev.filter(p => p !== pref)
        : [...prev, pref]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold gradient-text">Settings</h1>
        <p className="text-muted-foreground">
          Manage your profile, preferences, and app settings
        </p>
      </header>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="mr-2 h-5 w-5" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!dbProfile ? (
            <div className="bg-muted/50 p-4 rounded-lg mb-4">
              <p className="text-sm text-muted-foreground">
                Welcome! Please complete your profile to get personalized recommendations.
              </p>
            </div>
          ) : null}
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={localProfile.full_name}
                onChange={(e) => setLocalProfile({...localProfile, full_name: e.target.value})}
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={localProfile.age || ''}
                onChange={(e) => setLocalProfile({...localProfile, age: e.target.value ? parseInt(e.target.value) : null})}
                placeholder="Enter your age"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal">Fitness Goals</Label>
              <Input
                id="goal"
                value={localProfile.fitness_goals}
                onChange={(e) => setLocalProfile({...localProfile, fitness_goals: e.target.value})}
                placeholder="e.g., Lose weight, Build muscle"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                value={localProfile.height || ''}
                onChange={(e) => setLocalProfile({...localProfile, height: e.target.value ? parseFloat(e.target.value) : null})}
                placeholder="Enter height in cm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                value={localProfile.weight || ''}
                onChange={(e) => setLocalProfile({...localProfile, weight: e.target.value ? parseFloat(e.target.value) : null})}
                placeholder="Enter weight in kg"
              />
            </div>
          </div>
          <Button onClick={handleSaveProfile} disabled={isSaving || !localProfile.full_name}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Profile'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Palette className="mr-2 h-5 w-5" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Theme</Label>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred color scheme
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                className="justify-start"
                onClick={() => setTheme('light')}
              >
                <Sun className="mr-2 h-4 w-4" />
                Light
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                className="justify-start"
                onClick={() => setTheme('dark')}
              >
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                className="justify-start"
                onClick={() => setTheme('system')}
              >
                <Monitor className="mr-2 h-4 w-4" />
                System
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dietary Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="mr-2 h-5 w-5" />
            Dietary & Cultural Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-sm font-medium mb-3 block">Dietary Restrictions</Label>
            <div className="space-y-3">
              {['Vegetarian', 'Vegan', 'Gluten Free', 'Dairy Free', 'Keto', 'Paleo'].map((pref) => (
                <div key={pref} className="flex items-center justify-between">
                  <Label htmlFor={pref.toLowerCase()} className="flex-1">{pref}</Label>
                  <Switch
                    id={pref.toLowerCase()}
                    checked={dietaryPrefs.includes(pref)}
                    onCheckedChange={() => toggleDietaryPref(pref)}
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <Label className="text-sm font-medium mb-3 block">Selected Preferences</Label>
            <div className="flex gap-2 flex-wrap">
              {dietaryPrefs.length > 0 ? (
                dietaryPrefs.map((pref) => (
                  <Badge key={pref} variant="secondary">
                    {pref}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No dietary preferences selected</p>
              )}
            </div>
          </div>

          <Button onClick={handleSaveProfile} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Preferences'
            )}
          </Button>
        </CardContent>
      </Card>


      {/* Privacy & Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            Privacy & Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Data Analytics</Label>
              <p className="text-sm text-muted-foreground">
                Help improve the app with anonymous usage data
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
              <Shield className="mr-2 h-4 w-4" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;