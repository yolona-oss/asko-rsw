/* eslint-disable no-restricted-globals */

self.addEventListener('push', function (event) {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || '',
    icon: '/images/icon-192.png',
    badge: '/images/badge-72.png',
    data: data.data || {},
    tag: data.data?.notificationId || 'notification',
    renotify: true,
  };
  event.waitUntil(
    self.registration.showNotification(data.title || 'Уведомление', options),
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  const data = event.notification.data || {};
  let url = '/account';

  if (data.targetType && data.targetId) {
    switch (data.targetType) {
      case 'repairRequest':
        url = '/account/requests/' + data.targetId;
        break;
      case 'payment':
        url = '/account/payments';
        break;
      case 'certificate':
        url = '/account/certificates';
        break;
      case 'conversation':
        url = '/account/chat?conversation=' + data.targetId;
        break;
      case 'schedule':
        url = '/account/schedule';
        break;
      default:
        url = '/account';
    }
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windowClients) {
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    }),
  );
});
