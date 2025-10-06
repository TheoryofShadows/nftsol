import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { 
  Bug, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Terminal, 
  Activity,
  Database,
  Zap,
  AlertTriangle,
  Server
} from 'lucide-react';

interface SystemHealth {
  timestamp: string;
  status: string;
  services: {
    [key: string]: {
      status: string;
      available?: boolean;
      error?: string;
    };
  };
  environment: {
    nodeEnv: string;
    hasOpenAI: boolean;
    hasDatabaseUrl: boolean;
  };
  routes: {
    availableRoutes: string[];
  };
}

interface DiagnosticsData {
  timestamp: string;
  server: {
    uptime: number;
    memoryUsage: {
      rss: number;
      heapUsed: number;
      heapTotal: number;
      external: number;
    };
    nodeVersion: string;
    platform: string;
  };
  environment: {
    NODE_ENV: string;
    PORT: number;
    hasOpenAIKey: boolean;
    hasDatabaseUrl: boolean;
  };
  routes: {
    totalRoutes: number | string;
  };
}

export function AIDebuggingPanel() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsData | null>(null);
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTest, setActiveTest] = useState<string>('');

  useEffect(() => {
    checkSystemHealth();
    loadDiagnostics();
  }, []);

  const checkSystemHealth = async () => {
    try {
      const response = await fetch('/api/debug/health');
      if (response.ok) {
        const health = await response.json();
        setSystemHealth(health);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Health check failed:', error);
      toast({
        title: "Health Check Failed",
        description: "Unable to retrieve system health status",
        variant: "destructive"
      });
    }
  };

  const loadDiagnostics = async () => {
    try {
      const response = await fetch('/api/debug/diagnostics');
      if (response.ok) {
        const diag = await response.json();
        setDiagnostics(diag);
      }
    } catch (error) {
      console.error('Diagnostics failed:', error);
    }
  };

  const runAITest = async (testType: string) => {
    setIsLoading(true);
    setActiveTest(testType);
    try {
      const response = await fetch('/api/debug/ai-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ testType })
      });

      if (response.ok) {
        const results = await response.json();
        setTestResults(results);
        toast({
          title: "Test Complete",
          description: `AI ${testType} test completed successfully`
        });
      } else {
        throw new Error(`Test failed with status ${response.status}`);
      }
    } catch (error) {
      console.error('AI test failed:', error);
      toast({
        title: "Test Failed",
        description: error instanceof Error ? error.message : "AI test failed",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setActiveTest('');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'available':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
      case 'unhealthy':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const formatBytes = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const formatUptime = (uptime: number) => {
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
          AI System Debugger
        </h1>
        <p className="text-muted-foreground">
          Comprehensive debugging and monitoring for all AI services and system components
        </p>
      </div>

      <Tabs defaultValue="health" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="health">System Health</TabsTrigger>
          <TabsTrigger value="ai-tests">AI Tests</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
          <TabsTrigger value="logs">Live Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">System Health Overview</h2>
            <Button onClick={checkSystemHealth} size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {systemHealth ? (
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="w-5 h-5" />
                    Services Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(systemHealth.services).map(([service, data]) => (
                    <div key={service} className="flex items-center justify-between">
                      <span className="font-medium capitalize">{service.replace(/([A-Z])/g, ' $1')}</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(data.status)}
                        <Badge variant={data.status === 'healthy' ? 'default' : 'destructive'}>
                          {data.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Environment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Environment</span>
                    <Badge>{systemHealth.environment.nodeEnv}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>OpenAI API</span>
                    {systemHealth.environment.hasOpenAI ? (
                      <Badge className="bg-green-500">Connected</Badge>
                    ) : (
                      <Badge variant="destructive">Not configured</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Database</span>
                    {systemHealth.environment.hasDatabaseUrl ? (
                      <Badge className="bg-green-500">Connected</Badge>
                    ) : (
                      <Badge variant="destructive">Not configured</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-muted-foreground" />
                <p>Loading system health...</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="ai-tests" className="space-y-4">
          <h2 className="text-xl font-semibold">AI Service Tests</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {['basic', 'description', 'pricing', 'chatbot'].map((testType) => (
              <Card key={testType}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm capitalize">{testType} Test</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => runAITest(testType)}
                    disabled={isLoading}
                    className="w-full"
                    size="sm"
                  >
                    {isLoading && activeTest === testType ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Run Test
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {testResults && (
            <Card>
              <CardHeader>
                <CardTitle>Test Results</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <pre className="text-xs bg-muted p-4 rounded overflow-auto">
                    {JSON.stringify(testResults, null, 2)}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="diagnostics" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">System Diagnostics</h2>
            <Button onClick={loadDiagnostics} size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {diagnostics ? (
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Terminal className="w-5 h-5" />
                    Server Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Uptime:</span>
                    <span className="font-mono">{formatUptime(diagnostics.server.uptime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Node Version:</span>
                    <span className="font-mono">{diagnostics.server.nodeVersion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform:</span>
                    <span className="font-mono">{diagnostics.server.platform}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Memory RSS:</span>
                    <span className="font-mono">{formatBytes(diagnostics.server.memoryUsage.rss)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Heap Used:</span>
                    <span className="font-mono">{formatBytes(diagnostics.server.memoryUsage.heapUsed)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Environment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Environment:</span>
                    <Badge>{diagnostics.environment.NODE_ENV}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Port:</span>
                    <span className="font-mono">{diagnostics.environment.PORT}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>OpenAI Key:</span>
                    <Badge variant={diagnostics.environment.hasOpenAIKey ? 'default' : 'destructive'}>
                      {diagnostics.environment.hasOpenAIKey ? 'Present' : 'Missing'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Database URL:</span>
                    <Badge variant={diagnostics.environment.hasDatabaseUrl ? 'default' : 'destructive'}>
                      {diagnostics.environment.hasDatabaseUrl ? 'Present' : 'Missing'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-muted-foreground" />
                <p>Loading diagnostics...</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <h2 className="text-xl font-semibold">Live System Logs</h2>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bug className="w-5 h-5" />
                Console Output
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black text-green-400 font-mono text-xs p-4 rounded h-64 overflow-auto">
                <div>System debugger initialized...</div>
                <div>Monitoring AI services...</div>
                <div>Ready for debugging operations.</div>
                <div className="text-yellow-400">Use the AI Tests tab to run comprehensive service tests.</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}