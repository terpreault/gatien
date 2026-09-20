const VERSION = "gassien-v2.1.0";

const STATIC = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./config.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

/* INSTALLATION + CACHE */
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(VERSION).then(cache => cache.addAll(STATIC))
  );

  self.skipWaiting();
});

/* SUPPRESSION DES ANCIENS CACHES */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== VERSION)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

/* MISE À JOUR DE L'APP */
self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

/* FICHIERS DE L'APP */
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  if (
    event.request.mode === "navigate" ||
    url.pathname.endsWith("/index.html") ||
    url.pathname.endsWith("/app.js") ||
    url.pathname.endsWith("/styles.css") ||
    url.pathname.endsWith("/config.js")
  ) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();

          caches.open(VERSION).then(cache => {
            cache.put(event.request, copy);
          });

          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    event.respondWith(
      caches.match(event.request)
        .then(cached => cached || fetch(event.request))
    );
  }
});


/* =========================================
   NOTIFICATIONS PUSH
   ========================================= */

self.addEventListener("push", event => {

  let data = {
    title: "GASSIEN 💧",
    body: "C’est l’heure de boire un peu d’eau.",
    icon: "./icons/icon-192.png",
    badge: "./icons/icon-192.png"
  };

  if (event.data) {
    try {
      const incoming = event.data.json();

      data = {
        ...data,
        ...incoming
      };

    } catch (error) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || "./icons/icon-192.png",
    badge: data.badge || "./icons/icon-192.png",

    tag: "gassien-water-reminder",
    renotify: true,

    data: {
      url: data.url || "./"
    }
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || "GASSIEN 💧",
      options
    )
  );
});


/* QUAND GASSIEN TOUCHE LA NOTIFICATION */
self.addEventListener("notificationclick", event => {

  event.notification.close();

  const targetUrl =
    new URL(
      event.notification.data?.url || "./",
      self.registration.scope
    ).href;

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true
    }).then(windowClients => {

      for (const client of windowClients) {

        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
