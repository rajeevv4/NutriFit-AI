import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Watch, 
  Smartphone, 
  Heart, 
  Activity, 
  Moon, 
  Zap,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Unplug
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DeviceData {
  device: string;
  icon: React.ReactNode;
  connected: boolean;
  lastSync: string;
  data: {
    steps: number;
    heartRate: number;
    calories: number;
    sleep: string;
  };
}

export const WearableSync: React.FC = () => {
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [googleFitConnected, setGoogleFitConnected] = useState(false);
  const [fitnessData, setFitnessData] = useState<any>(null);
  const [showDeviceNameDialog, setShowDeviceNameDialog] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    checkGoogleFitConnection();
    fetchFitnessData();

    // Auto-refresh data every 10 seconds when connected
    const interval = setInterval(() => {
      if (googleFitConnected) {
        fetchFitnessData();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [googleFitConnected]);

  const checkGoogleFitConnection = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('google_fit_tokens')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      setGoogleFitConnected(!!data && !error);
    } catch (error) {
      console.error('Error checking Google Fit connection:', error);
    }
  };

  const fetchFitnessData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('fitness_data')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('date', today)
        .single();

      if (data && !error) {
        setFitnessData(data);
      }
    } catch (error) {
      console.error('Error fetching fitness data:', error);
    }
  };

  const handleConnectGoogleFit = async () => {
    setShowDeviceNameDialog(true);
  };

  const handleDeviceNameSubmit = async () => {
    if (!deviceName.trim()) {
      toast({
        title: "Device name required",
        description: "Please enter a name for your wearable device",
        variant: "destructive",
      });
      return;
    }

    setConnecting(true);
    setShowDeviceNameDialog(false);
    
    try {
      // Store device name in localStorage to use after OAuth redirect
      localStorage.setItem('wearable_device_name', deviceName);
      
      const { data, error } = await supabase.functions.invoke('google-fit-auth-url');
      
      if (error) throw error;
      
      if (data?.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error('Failed to get authorization URL');
      }
    } catch (error) {
      console.error('Error connecting to Google Fit:', error);
      setConnecting(false);
      toast({
        title: "Connection failed",
        description: error.message || "Failed to connect to Google Fit",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Delete the Google Fit tokens
      const { error } = await supabase
        .from('google_fit_tokens')
        .delete()
        .eq('user_id', session.user.id);

      if (error) throw error;

      // Clear device name from localStorage
      localStorage.removeItem('wearable_device_name');
      
      setGoogleFitConnected(false);
      setFitnessData(null);
      setDeviceName('');
      
      toast({
        title: "Disconnected",
        description: "Your wearable device has been disconnected",
      });
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast({
        title: "Disconnect failed",
        description: error.message || "Failed to disconnect device",
        variant: "destructive",
      });
    } finally {
      setDisconnecting(false);
    }
  };

  // Load device name from localStorage on mount
  useEffect(() => {
    const savedDeviceName = localStorage.getItem('wearable_device_name');
    if (savedDeviceName) {
      setDeviceName(savedDeviceName);
    }
  }, []);

  const devices: DeviceData[] = googleFitConnected ? [
    {
      device: deviceName || 'My Wearable Device',
      icon: <Watch className="h-5 w-5" />,
      connected: true,
      lastSync: fitnessData ? 'Just now' : 'Never',
      data: { 
        steps: fitnessData?.steps || 0, 
        heartRate: fitnessData?.heart_rate || 0, 
        calories: fitnessData?.calories || 0, 
        sleep: fitnessData?.active_minutes ? `${Math.floor(fitnessData.active_minutes / 60)}h ${fitnessData.active_minutes % 60}m` : '0h 0m'
      }
    }
  ] : [];

  const handleSyncAll = async () => {
    if (!googleFitConnected) {
      toast({
        title: "Not connected",
        description: "Please connect Google Fit first",
        variant: "destructive",
      });
      return;
    }

    setSyncing(true);
    toast({
      title: "Syncing devices...",
      description: "Fetching latest health data from Google Fit",
    });

    try {
      const { data, error } = await supabase.functions.invoke('google-fit-sync');

      if (error) throw error;

      await fetchFitnessData();
      setSyncing(false);
      toast({
        title: "Sync complete!",
        description: `Your ${deviceName || 'wearable device'} data has been updated successfully`,
      });
    } catch (error) {
      console.error('Sync error:', error);
      setSyncing(false);
      toast({
        title: "Sync failed",
        description: error.message || "Failed to sync fitness data",
        variant: "destructive",
      });
    }
  };

  const connectedDevices = devices.filter(d => d.connected);
  const totalSteps = connectedDevices.reduce((sum, d) => sum + d.data.steps, 0);
  const avgHeartRate = connectedDevices.length > 0 ? Math.round(connectedDevices.reduce((sum, d) => sum + d.data.heartRate, 0) / connectedDevices.length) : 0;
  const totalCalories = connectedDevices.reduce((sum, d) => sum + d.data.calories, 0);
  const distance = fitnessData?.distance ? (fitnessData.distance / 1000).toFixed(2) : '0.00';
  const sleep = fitnessData?.active_minutes ? `${Math.floor(fitnessData.active_minutes / 60)}h ${fitnessData.active_minutes % 60}m` : '0h 0m';

  return (
    <div className="space-y-6">
      {/* Sync Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <RefreshCw className="mr-2 h-5 w-5" />
              Wearable Devices
              {googleFitConnected && (
                <Badge variant="secondary" className="ml-3 bg-success/10 text-success border-success/20">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Connected to Google Fit
                </Badge>
              )}
            </CardTitle>
            <div className="flex gap-2">
              {!googleFitConnected && (
                <Button 
                  onClick={handleConnectGoogleFit} 
                  disabled={connecting}
                  size="sm"
                  variant="outline"
                  className="flex items-center"
                >
                  <Watch className="mr-2 h-4 w-4" />
                  {connecting ? 'Connecting...' : 'Connect Google Fit'}
                </Button>
              )}
              {googleFitConnected && (
                <>
                  <Button 
                    onClick={handleSyncAll} 
                    disabled={syncing}
                    size="sm"
                    className="flex items-center"
                  >
                    <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                    {syncing ? 'Syncing...' : 'Sync Now'}
                  </Button>
                  <Button 
                    onClick={handleDisconnect} 
                    disabled={disconnecting}
                    size="sm"
                    variant="destructive"
                    className="flex items-center"
                  >
                    <Unplug className="mr-2 h-4 w-4" />
                    {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!googleFitConnected ? (
            <div className="text-center py-8">
              <Watch className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                Connect your Google Fit account to sync data from your wearable device
              </p>
              <Button onClick={handleConnectGoogleFit} disabled={connecting}>
                {connecting ? 'Connecting...' : 'Connect Google Fit'}
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {devices.map((device, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {device.icon}
                  <div>
                    <p className="font-medium text-sm">{device.device}</p>
                    <p className="text-xs text-muted-foreground">{device.lastSync}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {device.connected ? (
                    <CheckCircle className="h-4 w-4 text-success" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-warning" />
                  )}
                  <Badge variant={device.connected ? 'secondary' : 'outline'}>
                    {device.connected ? 'Connected' : 'Disconnected'}
                  </Badge>
                </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Real-time Stats */}
      {googleFitConnected && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="metric-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Steps</p>
                  <p className="text-2xl font-bold gradient-text">{totalSteps.toLocaleString()}</p>
                </div>
                <Activity className="h-8 w-8 text-primary" />
              </div>
              <div className="mt-2">
                <div className="text-xs text-success">↗ Today</div>
              </div>
            </CardContent>
          </Card>



          <Card className="metric-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Calories</p>
                  <p className="text-2xl font-bold gradient-text">{totalCalories}</p>
                </div>
                <Zap className="h-8 w-8 text-warning" />
              </div>
              <div className="mt-2">
                <div className="text-xs text-success">↗ Burned</div>
              </div>
            </CardContent>
          </Card>


          <Card className="metric-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Time</p>
                  <p className="text-2xl font-bold gradient-text">{sleep}</p>
                </div>
                <Moon className="h-8 w-8 text-accent" />
              </div>
              <div className="mt-2">
                <div className="text-xs text-success">↗ Today</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Device Name Dialog */}
      <Dialog open={showDeviceNameDialog} onOpenChange={setShowDeviceNameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Name Your Wearable Device</DialogTitle>
            <DialogDescription>
              Give your wearable device a name to easily identify it
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deviceName">Device Name</Label>
              <Input
                id="deviceName"
                placeholder="e.g., boAt Xtend, Apple Watch, Fitbit"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleDeviceNameSubmit();
                  }
                }}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeviceNameDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleDeviceNameSubmit}>
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
