import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  Users,
  CheckCircle,
  Clock,
  TrendingUp,
  Plane,
  AlertTriangle,
  Activity
} from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';
import { formatDate } from '@/shared/utils';

export const Dashboard = () => {
  const { stats, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-64"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const dashboardStats = [
    {
      title: 'Total Documents',
      value: stats?.totalDocuments?.toString() || '0',
      change: '+12.5%',
      icon: FileText,
      color: 'text-aviation-sky'
    },
    {
      title: 'Utilisateurs Actifs',
      value: stats?.activeUsers?.toString() || '0',
      change: '+3.2%',
      icon: Users,
      color: 'text-green-600'
    },
    {
      title: 'Actions Complétées',
      value: stats?.completedActions?.toString() || '0',
      change: '+5.1%',
      icon: CheckCircle,
      color: 'text-aviation-success'
    },
    {
      title: 'Tâches en Cours',
      value: stats?.pendingActions?.toString() || '0',
      change: '-2.4%',
      icon: Clock,
      color: 'text-aviation-warning'
    }
  ];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Vue d'overview des activités aéroportuaires
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm border">
          <Plane className="w-5 h-5 text-aviation-sky" />
          <span className="text-sm font-medium">Enfidha - Monastir - Général</span>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className={stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                  {stat.change}
                </span>
                {' '}par rapport au mois dernier
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Documents récents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2 text-aviation-sky" />
              Documents Récents
            </CardTitle>
            <CardDescription>
              Derniers documents créés ou modifiés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentDocuments?.slice(0, 3).map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{doc.title}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {doc.type}
                      </Badge>
                      <span className="text-xs text-gray-500">{doc.airport}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={doc.status === 'ACTIVE' ? 'default' : 'secondary'}
                      className="mb-1"
                    >
                      {doc.status}
                    </Badge>
                    <p className="text-xs text-gray-500">{formatDate(doc.created_at)}</p>
                  </div>
                </div>
              )) || (
                <p className="text-gray-500 text-center py-4">Aucun document récent</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions urgentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-aviation-warning" />
              Actions Urgentes
            </CardTitle>
            <CardDescription>
              Tâches nécessitant une attention immédiate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.urgentActions?.slice(0, 3).map((action: any) => (
                <div key={action.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{action.title}</h4>
                    <p className="text-sm text-gray-600">{action.assigned_to?.[0] || 'Non assigné'}</p>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={action.priority === 'URGENT' ? 'destructive' : 'default'}
                      className="mb-1"
                    >
                      {action.priority}
                    </Badge>
                    <p className="text-xs text-gray-500">{formatDate(action.due_date)}</p>
                  </div>
                </div>
              )) || (
                <p className="text-gray-500 text-center py-4">Aucune action urgente</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activité récente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2 text-aviation-sky" />
            Activité Récente
          </CardTitle>
          <CardDescription>
            Historique des dernières actions dans le système
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats?.activityLogs?.slice(0, 4).map((activity: any, index: number) => (
              <div key={activity.id || index} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-md">
                <div className="w-8 h-8 bg-aviation-sky/10 rounded-full flex items-center justify-center">
                  <Activity className="w-4 h-4 text-aviation-sky" />
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{activity.details}</span>
                  </p>
                </div>
                <span className="text-xs text-gray-500">{formatDate(activity.timestamp)}</span>
              </div>
            )) || (
              <p className="text-gray-500 text-center py-4">Aucune activité récente</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};