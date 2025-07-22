import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Icon from '@/components/ui/icon';

interface SecuritySite {
  id: number;
  address: string;
  status: 'guarded' | 'not_guarded' | 'emergency' | 'alarm' | 'suspended';
  battery: number;
  lastActivity: string;
}

interface Employee {
  id: number;
  name: string;
  rank: string;
  department: string;
}

interface SystemEvent {
  id: string;
  siteId: number;
  type: 'emergency_call' | 'guard_on' | 'guard_off' | 'alarm';
  timestamp: string;
  source: 'admin' | 'client';
  message: string;
}

const Index = () => {
  const [currentView, setCurrentView] = useState<'auth' | 'admin' | 'client'>('auth');
  const [adminPassword, setAdminPassword] = useState('');
  const [clientSiteId, setClientSiteId] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sites, setSites] = useState<SecuritySite[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedSites, setSelectedSites] = useState<number[]>([]);
  const [systemEvents, setSystemEvents] = useState<SystemEvent[]>([]);
  const [alarmSound] = useState(new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSaFy/LWgyQBFl.'));

  // Генерируем начальные данные для 400 участков
  useEffect(() => {
    const initialSites: SecuritySite[] = [];
    for (let i = 1; i <= 400; i++) {
      initialSites.push({
        id: i,
        address: `ул. Охранная, д. ${i}`,
        status: Math.random() > 0.3 ? 'guarded' : 'not_guarded',
        battery: Math.floor(Math.random() * 100),
        lastActivity: new Date(Date.now() - Math.random() * 86400000).toLocaleString()
      });
    }
    setSites(initialSites);

    // Симулируем срабатывание сигнализации каждые 5 минут
    const alarmInterval = setInterval(() => {
      const randomSite = Math.floor(Math.random() * 400) + 1;
      setSites(prev => prev.map(site => 
        site.id === randomSite 
          ? { ...site, status: 'alarm', lastActivity: new Date().toLocaleString() }
          : site
      ));
      try {
        alarmSound.play().catch(() => {});
      } catch (e) {}
    }, 5 * 60 * 1000);

    return () => clearInterval(alarmInterval);
  }, [alarmSound]);

  const handleAdminLogin = () => {
    if (adminPassword === '123') {
      setCurrentView('admin');
      setAdminPassword('');
    } else {
      alert('Неверный пароль');
    }
  };

  const handleClientLogin = () => {
    const siteId = parseInt(clientSiteId);
    if (siteId >= 1 && siteId <= 400) {
      setCurrentView('client');
    } else {
      alert('Неверный номер участка');
    }
  };

  const updateSiteStatus = (siteId: number, newStatus: SecuritySite['status'], source: 'admin' | 'client' = 'admin') => {
    setSites(prev => prev.map(site => 
      site.id === siteId 
        ? { ...site, status: newStatus, lastActivity: new Date().toLocaleString() }
        : site
    ));
    
    // Добавляем событие в систему
    const eventTypes = {
      'emergency': 'emergency_call' as const,
      'guarded': 'guard_on' as const,
      'not_guarded': 'guard_off' as const,
      'alarm': 'alarm' as const
    };
    
    if (eventTypes[newStatus]) {
      const newEvent: SystemEvent = {
        id: Date.now().toString(),
        siteId,
        type: eventTypes[newStatus],
        timestamp: new Date().toLocaleString(),
        source,
        message: `Участок №${siteId} - ${getStatusText(newStatus)}${source === 'client' ? ' (клиент)' : ''}`
      };
      
      setSystemEvents(prev => [newEvent, ...prev].slice(0, 100)); // Храним последние 100 событий
      
      // Воспроизводим звук для критических событий
      if (newStatus === 'emergency' || newStatus === 'alarm') {
        try {
          alarmSound.play().catch(() => {});
        } catch (e) {}
      }
    }
  };

  const getStatusColor = (status: SecuritySite['status']) => {
    switch (status) {
      case 'guarded': return 'bg-green-500';
      case 'not_guarded': return 'bg-gray-400';
      case 'emergency': return 'bg-red-600';
      case 'alarm': return 'bg-red-500 animate-pulse';
      case 'suspended': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status: SecuritySite['status']) => {
    switch (status) {
      case 'guarded': return 'На охране';
      case 'not_guarded': return 'Не охраняется';
      case 'emergency': return 'ВЫЕЗД ГБР';
      case 'alarm': return 'СРАБОТАЛА СИГНАЛИЗАЦИЯ';
      case 'suspended': return 'Приостановлен';
      default: return 'Неизвестно';
    }
  };

  const guardedCount = sites.filter(site => site.status === 'guarded').length;
  const notGuardedCount = sites.filter(site => site.status === 'not_guarded').length;
  const alarmCount = sites.filter(site => site.status === 'alarm' || site.status === 'emergency').length;

  if (currentView === 'auth') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Icon name="Shield" className="h-12 w-12 text-primary mr-2" />
              <h1 className="text-3xl font-bold text-gray-900">ГБР</h1>
            </div>
            <p className="text-gray-600">Система управления охранной службой</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-center">Вход в систему</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Администратор</h3>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="Пароль"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
                  />
                  <Button onClick={handleAdminLogin}>
                    <Icon name="LogIn" className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Клиент</h3>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Номер участка (1-400)"
                    value={clientSiteId}
                    onChange={(e) => setClientSiteId(e.target.value)}
                    min="1"
                    max="400"
                    onKeyPress={(e) => e.key === 'Enter' && handleClientLogin()}
                  />
                  <Button onClick={handleClientLogin} variant="secondary">
                    <Icon name="LogIn" className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (currentView === 'client') {
    const clientSite = sites.find(site => site.id === parseInt(clientSiteId));
    
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Icon name="Shield" className="h-8 w-8 text-primary mr-2" />
              <h1 className="text-2xl font-bold">Участок №{clientSiteId}</h1>
            </div>
            <Button variant="outline" onClick={() => setCurrentView('auth')}>
              <Icon name="LogOut" className="h-4 w-4 mr-2" />
              Выход
            </Button>
          </div>

          {clientSite && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {clientSite.address}
                  <Badge className={getStatusColor(clientSite.status)}>
                    {getStatusText(clientSite.status)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button
                    onClick={() => updateSiteStatus(clientSite.id, 'guarded', 'client')}
                    className="bg-green-600 hover:bg-green-700"
                    disabled={clientSite.status === 'guarded'}
                  >
                    <Icon name="Shield" className="h-4 w-4 mr-2" />
                    Поставить на охрану
                  </Button>
                  
                  <Button
                    onClick={() => updateSiteStatus(clientSite.id, 'not_guarded', 'client')}
                    variant="secondary"
                    disabled={clientSite.status === 'not_guarded'}
                  >
                    <Icon name="ShieldOff" className="h-4 w-4 mr-2" />
                    Снять с охраны
                  </Button>
                  
                  <Button
                    onClick={() => updateSiteStatus(clientSite.id, 'emergency', 'client')}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Icon name="AlertTriangle" className="h-4 w-4 mr-2" />
                    Экстренный вызов
                  </Button>
                </div>

                <div className="bg-gray-50 p-4 rounded">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Заряд батареи:</strong> {clientSite.battery}%
                    </div>
                    <div>
                      <strong>Последняя активность:</strong> {clientSite.lastActivity}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Icon name="Shield" className="h-8 w-8 text-primary mr-2" />
              <h1 className="text-xl font-bold">ГБР - Система управления</h1>
            </div>
            <Button variant="outline" onClick={() => setCurrentView('auth')}>
              <Icon name="LogOut" className="h-4 w-4 mr-2" />
              Выход
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard">Главная</TabsTrigger>
            <TabsTrigger value="sites">Участки</TabsTrigger>
            <TabsTrigger value="monitoring">Мониторинг</TabsTrigger>
            <TabsTrigger value="alarms">Сигнализация</TabsTrigger>
            <TabsTrigger value="contracts">Договоры</TabsTrigger>
            <TabsTrigger value="employees">Сотрудники</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">На охране</CardTitle>
                  <Icon name="Shield" className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{guardedCount}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Не охраняется</CardTitle>
                  <Icon name="ShieldOff" className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-600">{notGuardedCount}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Тревоги</CardTitle>
                  <Icon name="AlertTriangle" className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{alarmCount}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Всего участков</CardTitle>
                  <Icon name="Building" className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">400</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Реквизиты ГБР</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div><strong>Название:</strong> ООО "Групп Быстрого Реагирования"</div>
                  <div><strong>ИНН:</strong> 7712345678</div>
                  <div><strong>КПП:</strong> 771201001</div>
                  <div><strong>ОГРН:</strong> 1127746123456</div>
                  <div><strong>Адрес:</strong> г. Москва, ул. Охранная, д. 1</div>
                  <div><strong>Телефон:</strong> +7 (495) 123-45-67</div>
                  <div><strong>Email:</strong> info@gbr-security.ru</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Активные тревоги</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {sites
                      .filter(site => site.status === 'alarm' || site.status === 'emergency')
                      .sort((a, b) => a.status === 'emergency' ? -1 : 1)
                      .map(site => (
                        <Alert key={site.id} className={site.status === 'emergency' ? 'border-red-500' : ''}>
                          <Icon name="AlertTriangle" className="h-4 w-4" />
                          <AlertDescription className="flex justify-between items-center">
                            <span>Участок №{site.id} - {getStatusText(site.status)}</span>
                            <Badge className={getStatusColor(site.status)}>
                              {getStatusText(site.status)}
                            </Badge>
                          </AlertDescription>
                        </Alert>
                      ))
                    }
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Icon name="Activity" className="h-4 w-4 mr-2" />
                    Журнал событий
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {systemEvents.slice(0, 10).map(event => (
                      <div key={event.id} className="p-2 border rounded text-sm">
                        <div className="flex justify-between items-center mb-1">
                          <span className={`font-semibold ${
                            event.type === 'emergency_call' ? 'text-red-600' :
                            event.type === 'alarm' ? 'text-red-500' :
                            event.type === 'guard_on' ? 'text-green-600' :
                            'text-gray-600'
                          }`}>
                            {event.message}
                          </span>
                          <Badge variant={event.source === 'client' ? 'destructive' : 'secondary'}>
                            {event.source === 'client' ? 'Клиент' : 'Админ'}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500">{event.timestamp}</div>
                      </div>
                    ))}
                    {systemEvents.length === 0 && (
                      <div className="text-center text-gray-500 text-sm py-4">
                        Нет событий
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sites" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
              {sites.map(site => (
                <Card key={site.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-sm">№{site.id}</CardTitle>
                      <Badge className={getStatusColor(site.status)}>
                        {getStatusText(site.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-gray-600 mb-3">{site.address}</div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => updateSiteStatus(site.id, 'emergency')}
                        className="bg-red-600 hover:bg-red-700 text-xs"
                      >
                        ВЫЕЗД ГБР
                      </Button>
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => updateSiteStatus(site.id, site.status === 'guarded' ? 'not_guarded' : 'guarded')}
                        className="text-xs"
                      >
                        {site.status === 'guarded' ? 'Снять' : 'Поставить'}
                      </Button>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Батарея: {site.battery}%
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="monitoring" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Мониторинг системы</CardTitle>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => setSelectedSites(selectedSites.length === sites.length ? [] : sites.map(s => s.id))}
                    >
                      {selectedSites.length === sites.length ? 'Снять выделение' : 'Выделить все'}
                    </Button>
                    <Button size="sm" onClick={() => selectedSites.forEach(id => updateSiteStatus(id, 'guarded'))}>
                      Поставить на охрану
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => selectedSites.forEach(id => updateSiteStatus(id, 'not_guarded'))}>
                      Снять с охраны
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
                  {sites.slice(0, 40).map(site => (
                    <div 
                      key={site.id}
                      className={`p-3 border rounded cursor-pointer transition-colors ${
                        selectedSites.includes(site.id) ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedSites(prev => 
                        prev.includes(site.id) 
                          ? prev.filter(id => id !== site.id)
                          : [...prev, site.id]
                      )}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-sm">№{site.id}</span>
                        <Badge className={getStatusColor(site.status) + ' text-xs'}>
                          {getStatusText(site.status)}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600">Батарея: {site.battery}%</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alarms" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Управление сигнализацией</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                  {sites.slice(0, 30).map(site => (
                    <div key={site.id} className="p-3 border rounded">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-sm">№{site.id}</span>
                        <Button 
                          size="sm" 
                          onClick={() => updateSiteStatus(site.id, 'alarm')}
                          className="bg-yellow-600 hover:bg-yellow-700 text-xs"
                        >
                          Тест сигнализации
                        </Button>
                      </div>
                      <div className="text-xs text-gray-600">{site.address}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contracts" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Создать новый участок</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input placeholder="Адрес участка" />
                  <Input placeholder="Контактное лицо" />
                  <Input placeholder="Телефон" />
                  <Button className="w-full">Создать участок</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Управление договорами</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {sites.slice(0, 10).map(site => (
                      <div key={site.id} className="flex justify-between items-center p-2 border rounded">
                        <span className="text-sm">№{site.id} - {site.address}</span>
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="secondary"
                            onClick={() => updateSiteStatus(site.id, 'suspended')}
                            className="text-xs"
                          >
                            Приостановить
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => updateSiteStatus(site.id, 'not_guarded')}
                            className="text-xs"
                          >
                            Продолжить
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="employees" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Добавить сотрудника</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input placeholder="ФИО" />
                  <Input placeholder="Звание" />
                  <Input placeholder="Отдел" />
                  <Button className="w-full">Создать сотрудника</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Список сотрудников</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="p-3 border rounded">
                      <div className="font-semibold">Иванов И.И.</div>
                      <div className="text-sm text-gray-600">Старший лейтенант - Оперативный отдел</div>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="font-semibold">Петров П.П.</div>
                      <div className="text-sm text-gray-600">Капитан - Служба быстрого реагирования</div>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="font-semibold">Сидоров С.С.</div>
                      <div className="text-sm text-gray-600">Майор - Координационный центр</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;