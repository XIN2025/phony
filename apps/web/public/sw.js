(() => {
  'use strict';
  let e, t, s, a, i;
  var n = {
      187: () => {
        try {
          self['workbox:expiration:6.5.4'] && _();
        } catch (e) {}
      },
      363: () => {
        try {
          self['workbox:strategies:6.5.4'] && _();
        } catch (e) {}
      },
      465: () => {
        try {
          self['workbox:routing:6.5.4'] && _();
        } catch (e) {}
      },
      475: () => {
        try {
          self['workbox:cacheable-response:6.5.4'] && _();
        } catch (e) {}
      },
      503: () => {
        try {
          self['workbox:core:6.5.4'] && _();
        } catch (e) {}
      },
      727: () => {
        try {
          self['workbox:precaching:6.5.4'] && _();
        } catch (e) {}
      },
    },
    r = {};
  function o(e) {
    var t = r[e];
    if (void 0 !== t) return t.exports;
    var s = (r[e] = { exports: {} }),
      a = !0;
    try {
      (n[e](s, s.exports, o), (a = !1));
    } finally {
      a && delete r[e];
    }
    return s.exports;
  }
  o(503);
  let c = (e, ...t) => {
    let s = e;
    return (t.length > 0 && (s += ` :: ${JSON.stringify(t)}`), s);
  };
  class l extends Error {
    constructor(e, t) {
      (super(c(e, t)), (this.name = e), (this.details = t));
    }
  }
  let h = {
      googleAnalytics: 'googleAnalytics',
      precache: 'precache-v2',
      prefix: 'workbox',
      runtime: 'runtime',
      suffix: 'undefined' != typeof registration ? registration.scope : '',
    },
    u = (e) => [h.prefix, e, h.suffix].filter((e) => e && e.length > 0).join('-'),
    d = { getPrecacheName: (e) => e || u(h.precache), getRuntimeName: (e) => e || u(h.runtime) };
  function f(e, t) {
    let s = t();
    return (e.waitUntil(s), s);
  }
  o(727);
  class p {
    constructor() {
      ((this.updatedURLs = []),
        (this.notUpdatedURLs = []),
        (this.handlerWillStart = async ({ request: e, state: t }) => {
          t && (t.originalRequest = e);
        }),
        (this.cachedResponseWillBeUsed = async ({ event: e, state: t, cachedResponse: s }) => {
          if ('install' === e.type && t && t.originalRequest && t.originalRequest instanceof Request) {
            let e = t.originalRequest.url;
            s ? this.notUpdatedURLs.push(e) : this.updatedURLs.push(e);
          }
          return s;
        }));
    }
  }
  class g {
    constructor({ precacheController: e }) {
      ((this.cacheKeyWillBeUsed = async ({ request: e, params: t }) => {
        let s = (null == t ? void 0 : t.cacheKey) || this._precacheController.getCacheKeyForURL(e.url);
        return s ? new Request(s, { headers: e.headers }) : e;
      }),
        (this._precacheController = e));
    }
  }
  async function w(t, s) {
    let a = null;
    if ((t.url && (a = new URL(t.url).origin), a !== self.location.origin))
      throw new l('cross-origin-copy-response', { origin: a });
    let i = t.clone(),
      n = { headers: new Headers(i.headers), status: i.status, statusText: i.statusText },
      r = s ? s(n) : n,
      o = !(function () {
        if (void 0 === e) {
          let t = new Response('');
          if ('body' in t)
            try {
              (new Response(t.body), (e = !0));
            } catch (t) {
              e = !1;
            }
          e = !1;
        }
        return e;
      })()
        ? await i.blob()
        : i.body;
    return new Response(o, r);
  }
  let m = (e) => new URL(String(e), location.href).href.replace(RegExp(`^${location.origin}`), '');
  function y(e, t) {
    let s = new URL(e);
    for (let e of t) s.searchParams.delete(e);
    return s.href;
  }
  async function b(e, t, s, a) {
    let i = y(t.url, s);
    if (t.url === i) return e.match(t, a);
    let n = Object.assign(Object.assign({}, a), { ignoreSearch: !0 });
    for (let r of await e.keys(t, n)) if (i === y(r.url, s)) return e.match(r, a);
  }
  class v {
    constructor() {
      this.promise = new Promise((e, t) => {
        ((this.resolve = e), (this.reject = t));
      });
    }
  }
  let R = new Set();
  async function x() {
    for (let e of R) await e();
  }
  function C(e) {
    return 'string' == typeof e ? new Request(e) : e;
  }
  o(363);
  class E {
    constructor(e, t) {
      for (let s of ((this._cacheKeys = {}),
      Object.assign(this, t),
      (this.event = t.event),
      (this._strategy = e),
      (this._handlerDeferred = new v()),
      (this._extendLifetimePromises = []),
      (this._plugins = [...e.plugins]),
      (this._pluginStateMap = new Map()),
      this._plugins))
        this._pluginStateMap.set(s, {});
      this.event.waitUntil(this._handlerDeferred.promise);
    }
    async fetch(e) {
      let { event: t } = this,
        s = C(e);
      if ('navigate' === s.mode && t instanceof FetchEvent && t.preloadResponse) {
        let e = await t.preloadResponse;
        if (e) return e;
      }
      let a = this.hasCallback('fetchDidFail') ? s.clone() : null;
      try {
        for (let e of this.iterateCallbacks('requestWillFetch')) s = await e({ request: s.clone(), event: t });
      } catch (e) {
        if (e instanceof Error) throw new l('plugin-error-request-will-fetch', { thrownErrorMessage: e.message });
      }
      let i = s.clone();
      try {
        let e;
        for (let a of ((e = await fetch(s, 'navigate' === s.mode ? void 0 : this._strategy.fetchOptions)),
        this.iterateCallbacks('fetchDidSucceed')))
          e = await a({ event: t, request: i, response: e });
        return e;
      } catch (e) {
        throw (
          a &&
            (await this.runCallbacks('fetchDidFail', {
              error: e,
              event: t,
              originalRequest: a.clone(),
              request: i.clone(),
            })),
          e
        );
      }
    }
    async fetchAndCachePut(e) {
      let t = await this.fetch(e),
        s = t.clone();
      return (this.waitUntil(this.cachePut(e, s)), t);
    }
    async cacheMatch(e) {
      let t,
        s = C(e),
        { cacheName: a, matchOptions: i } = this._strategy,
        n = await this.getCacheKey(s, 'read'),
        r = Object.assign(Object.assign({}, i), { cacheName: a });
      for (let e of ((t = await caches.match(n, r)), this.iterateCallbacks('cachedResponseWillBeUsed')))
        t = (await e({ cacheName: a, matchOptions: i, cachedResponse: t, request: n, event: this.event })) || void 0;
      return t;
    }
    async cachePut(e, t) {
      let s = C(e);
      await new Promise((e) => setTimeout(e, 0));
      let a = await this.getCacheKey(s, 'write');
      if (!t) throw new l('cache-put-with-no-response', { url: m(a.url) });
      let i = await this._ensureResponseSafeToCache(t);
      if (!i) return !1;
      let { cacheName: n, matchOptions: r } = this._strategy,
        o = await self.caches.open(n),
        c = this.hasCallback('cacheDidUpdate'),
        h = c ? await b(o, a.clone(), ['__WB_REVISION__'], r) : null;
      try {
        await o.put(a, c ? i.clone() : i);
      } catch (e) {
        if (e instanceof Error) throw ('QuotaExceededError' === e.name && (await x()), e);
      }
      for (let e of this.iterateCallbacks('cacheDidUpdate'))
        await e({ cacheName: n, oldResponse: h, newResponse: i.clone(), request: a, event: this.event });
      return !0;
    }
    async getCacheKey(e, t) {
      let s = `${e.url} | ${t}`;
      if (!this._cacheKeys[s]) {
        let a = e;
        for (let e of this.iterateCallbacks('cacheKeyWillBeUsed'))
          a = C(await e({ mode: t, request: a, event: this.event, params: this.params }));
        this._cacheKeys[s] = a;
      }
      return this._cacheKeys[s];
    }
    hasCallback(e) {
      for (let t of this._strategy.plugins) if (e in t) return !0;
      return !1;
    }
    async runCallbacks(e, t) {
      for (let s of this.iterateCallbacks(e)) await s(t);
    }
    *iterateCallbacks(e) {
      for (let t of this._strategy.plugins)
        if ('function' == typeof t[e]) {
          let s = this._pluginStateMap.get(t),
            a = (a) => {
              let i = Object.assign(Object.assign({}, a), { state: s });
              return t[e](i);
            };
          yield a;
        }
    }
    waitUntil(e) {
      return (this._extendLifetimePromises.push(e), e);
    }
    async doneWaiting() {
      let e;
      for (; (e = this._extendLifetimePromises.shift()); ) await e;
    }
    destroy() {
      this._handlerDeferred.resolve(null);
    }
    async _ensureResponseSafeToCache(e) {
      let t = e,
        s = !1;
      for (let e of this.iterateCallbacks('cacheWillUpdate'))
        if (((t = (await e({ request: this.request, response: t, event: this.event })) || void 0), (s = !0), !t)) break;
      return (!s && t && 200 !== t.status && (t = void 0), t);
    }
  }
  class S {
    constructor(e = {}) {
      ((this.cacheName = d.getRuntimeName(e.cacheName)),
        (this.plugins = e.plugins || []),
        (this.fetchOptions = e.fetchOptions),
        (this.matchOptions = e.matchOptions));
    }
    handle(e) {
      let [t] = this.handleAll(e);
      return t;
    }
    handleAll(e) {
      e instanceof FetchEvent && (e = { event: e, request: e.request });
      let t = e.event,
        s = 'string' == typeof e.request ? new Request(e.request) : e.request,
        a = new E(this, { event: t, request: s, params: 'params' in e ? e.params : void 0 }),
        i = this._getResponse(a, s, t),
        n = this._awaitComplete(i, a, s, t);
      return [i, n];
    }
    async _getResponse(e, t, s) {
      let a;
      await e.runCallbacks('handlerWillStart', { event: s, request: t });
      try {
        if (!(a = await this._handle(t, e)) || 'error' === a.type) throw new l('no-response', { url: t.url });
      } catch (i) {
        if (i instanceof Error) {
          for (let n of e.iterateCallbacks('handlerDidError'))
            if ((a = await n({ error: i, event: s, request: t }))) break;
        }
        if (a);
        else throw i;
      }
      for (let i of e.iterateCallbacks('handlerWillRespond')) a = await i({ event: s, request: t, response: a });
      return a;
    }
    async _awaitComplete(e, t, s, a) {
      let i, n;
      try {
        i = await e;
      } catch (e) {}
      try {
        (await t.runCallbacks('handlerDidRespond', { event: a, request: s, response: i }), await t.doneWaiting());
      } catch (e) {
        e instanceof Error && (n = e);
      }
      if ((await t.runCallbacks('handlerDidComplete', { event: a, request: s, response: i, error: n }), t.destroy(), n))
        throw n;
    }
  }
  class N extends S {
    constructor(e = {}) {
      ((e.cacheName = d.getPrecacheName(e.cacheName)),
        super(e),
        (this._fallbackToNetwork = !1 !== e.fallbackToNetwork),
        this.plugins.push(N.copyRedirectedCacheableResponsesPlugin));
    }
    async _handle(e, t) {
      let s = await t.cacheMatch(e);
      return (
        s || (t.event && 'install' === t.event.type ? await this._handleInstall(e, t) : await this._handleFetch(e, t))
      );
    }
    async _handleFetch(e, t) {
      let s,
        a = t.params || {};
      if (this._fallbackToNetwork) {
        let i = a.integrity,
          n = e.integrity,
          r = !n || n === i;
        ((s = await t.fetch(new Request(e, { integrity: 'no-cors' !== e.mode ? n || i : void 0 }))),
          i &&
            r &&
            'no-cors' !== e.mode &&
            (this._useDefaultCacheabilityPluginIfNeeded(), await t.cachePut(e, s.clone())));
      } else throw new l('missing-precache-entry', { cacheName: this.cacheName, url: e.url });
      return s;
    }
    async _handleInstall(e, t) {
      this._useDefaultCacheabilityPluginIfNeeded();
      let s = await t.fetch(e);
      if (!(await t.cachePut(e, s.clone()))) throw new l('bad-precaching-response', { url: e.url, status: s.status });
      return s;
    }
    _useDefaultCacheabilityPluginIfNeeded() {
      let e = null,
        t = 0;
      for (let [s, a] of this.plugins.entries())
        a !== N.copyRedirectedCacheableResponsesPlugin &&
          (a === N.defaultPrecacheCacheabilityPlugin && (e = s), a.cacheWillUpdate && t++);
      0 === t
        ? this.plugins.push(N.defaultPrecacheCacheabilityPlugin)
        : t > 1 && null !== e && this.plugins.splice(e, 1);
    }
  }
  ((N.defaultPrecacheCacheabilityPlugin = {
    cacheWillUpdate: async ({ response: e }) => (!e || e.status >= 400 ? null : e),
  }),
    (N.copyRedirectedCacheableResponsesPlugin = {
      cacheWillUpdate: async ({ response: e }) => (e.redirected ? await w(e) : e),
    }));
  class L {
    constructor({ cacheName: e, plugins: t = [], fallbackToNetwork: s = !0 } = {}) {
      ((this._urlsToCacheKeys = new Map()),
        (this._urlsToCacheModes = new Map()),
        (this._cacheKeysToIntegrities = new Map()),
        (this._strategy = new N({
          cacheName: d.getPrecacheName(e),
          plugins: [...t, new g({ precacheController: this })],
          fallbackToNetwork: s,
        })),
        (this.install = this.install.bind(this)),
        (this.activate = this.activate.bind(this)));
    }
    get strategy() {
      return this._strategy;
    }
    precache(e) {
      (this.addToCacheList(e),
        this._installAndActiveListenersAdded ||
          (self.addEventListener('install', this.install),
          self.addEventListener('activate', this.activate),
          (this._installAndActiveListenersAdded = !0)));
    }
    addToCacheList(e) {
      let t = [];
      for (let s of e) {
        'string' == typeof s ? t.push(s) : s && void 0 === s.revision && t.push(s.url);
        let { cacheKey: e, url: a } = (function (e) {
            if (!e) throw new l('add-to-cache-list-unexpected-type', { entry: e });
            if ('string' == typeof e) {
              let t = new URL(e, location.href);
              return { cacheKey: t.href, url: t.href };
            }
            let { revision: t, url: s } = e;
            if (!s) throw new l('add-to-cache-list-unexpected-type', { entry: e });
            if (!t) {
              let e = new URL(s, location.href);
              return { cacheKey: e.href, url: e.href };
            }
            let a = new URL(s, location.href),
              i = new URL(s, location.href);
            return (a.searchParams.set('__WB_REVISION__', t), { cacheKey: a.href, url: i.href });
          })(s),
          i = 'string' != typeof s && s.revision ? 'reload' : 'default';
        if (this._urlsToCacheKeys.has(a) && this._urlsToCacheKeys.get(a) !== e)
          throw new l('add-to-cache-list-conflicting-entries', {
            firstEntry: this._urlsToCacheKeys.get(a),
            secondEntry: e,
          });
        if ('string' != typeof s && s.integrity) {
          if (this._cacheKeysToIntegrities.has(e) && this._cacheKeysToIntegrities.get(e) !== s.integrity)
            throw new l('add-to-cache-list-conflicting-integrities', { url: a });
          this._cacheKeysToIntegrities.set(e, s.integrity);
        }
        (this._urlsToCacheKeys.set(a, e),
          this._urlsToCacheModes.set(a, i),
          t.length > 0 &&
            console.warn(`Workbox is precaching URLs without revision info: ${t.join(', ')}
This is generally NOT safe. Learn more at https://bit.ly/wb-precache`));
      }
    }
    install(e) {
      return f(e, async () => {
        let t = new p();
        for (let [s, a] of (this.strategy.plugins.push(t), this._urlsToCacheKeys)) {
          let t = this._cacheKeysToIntegrities.get(a),
            i = this._urlsToCacheModes.get(s),
            n = new Request(s, { integrity: t, cache: i, credentials: 'same-origin' });
          await Promise.all(this.strategy.handleAll({ params: { cacheKey: a }, request: n, event: e }));
        }
        let { updatedURLs: s, notUpdatedURLs: a } = t;
        return { updatedURLs: s, notUpdatedURLs: a };
      });
    }
    activate(e) {
      return f(e, async () => {
        let e = await self.caches.open(this.strategy.cacheName),
          t = await e.keys(),
          s = new Set(this._urlsToCacheKeys.values()),
          a = [];
        for (let i of t) s.has(i.url) || (await e.delete(i), a.push(i.url));
        return { deletedURLs: a };
      });
    }
    getURLsToCacheKeys() {
      return this._urlsToCacheKeys;
    }
    getCachedURLs() {
      return [...this._urlsToCacheKeys.keys()];
    }
    getCacheKeyForURL(e) {
      let t = new URL(e, location.href);
      return this._urlsToCacheKeys.get(t.href);
    }
    getIntegrityForCacheKey(e) {
      return this._cacheKeysToIntegrities.get(e);
    }
    async matchPrecache(e) {
      let t = e instanceof Request ? e.url : e,
        s = this.getCacheKeyForURL(t);
      if (s) return (await self.caches.open(this.strategy.cacheName)).match(s);
    }
    createHandlerBoundToURL(e) {
      let t = this.getCacheKeyForURL(e);
      if (!t) throw new l('non-precached-url', { url: e });
      return (s) => (
        (s.request = new Request(e)),
        (s.params = Object.assign({ cacheKey: t }, s.params)),
        this.strategy.handle(s)
      );
    }
  }
  let k = () => (t || (t = new L()), t);
  o(465);
  let D = (e) => (e && 'object' == typeof e ? e : { handle: e });
  class T {
    constructor(e, t, s = 'GET') {
      ((this.handler = D(t)), (this.match = e), (this.method = s));
    }
    setCatchHandler(e) {
      this.catchHandler = D(e);
    }
  }
  class U extends T {
    constructor(e, t, s) {
      super(
        ({ url: t }) => {
          let s = e.exec(t.href);
          if (s) return t.origin !== location.origin && 0 !== s.index ? void 0 : s.slice(1);
        },
        t,
        s,
      );
    }
  }
  class W {
    constructor() {
      ((this._routes = new Map()), (this._defaultHandlerMap = new Map()));
    }
    get routes() {
      return this._routes;
    }
    addFetchListener() {
      self.addEventListener('fetch', (e) => {
        let { request: t } = e,
          s = this.handleRequest({ request: t, event: e });
        s && e.respondWith(s);
      });
    }
    addCacheListener() {
      self.addEventListener('message', (e) => {
        if (e.data && 'CACHE_URLS' === e.data.type) {
          let { payload: t } = e.data,
            s = Promise.all(
              t.urlsToCache.map((t) => {
                'string' == typeof t && (t = [t]);
                let s = new Request(...t);
                return this.handleRequest({ request: s, event: e });
              }),
            );
          (e.waitUntil(s), e.ports && e.ports[0] && s.then(() => e.ports[0].postMessage(!0)));
        }
      });
    }
    handleRequest({ request: e, event: t }) {
      let s,
        a = new URL(e.url, location.href);
      if (!a.protocol.startsWith('http')) return;
      let i = a.origin === location.origin,
        { params: n, route: r } = this.findMatchingRoute({ event: t, request: e, sameOrigin: i, url: a }),
        o = r && r.handler,
        c = e.method;
      if ((!o && this._defaultHandlerMap.has(c) && (o = this._defaultHandlerMap.get(c)), !o)) return;
      try {
        s = o.handle({ url: a, request: e, event: t, params: n });
      } catch (e) {
        s = Promise.reject(e);
      }
      let l = r && r.catchHandler;
      return (
        s instanceof Promise &&
          (this._catchHandler || l) &&
          (s = s.catch(async (s) => {
            if (l)
              try {
                return await l.handle({ url: a, request: e, event: t, params: n });
              } catch (e) {
                e instanceof Error && (s = e);
              }
            if (this._catchHandler) return this._catchHandler.handle({ url: a, request: e, event: t });
            throw s;
          })),
        s
      );
    }
    findMatchingRoute({ url: e, sameOrigin: t, request: s, event: a }) {
      for (let i of this._routes.get(s.method) || []) {
        let n,
          r = i.match({ url: e, sameOrigin: t, request: s, event: a });
        if (r)
          return (
            (Array.isArray((n = r)) && 0 === n.length) || (r.constructor === Object && 0 === Object.keys(r).length)
              ? (n = void 0)
              : 'boolean' == typeof r && (n = void 0),
            { route: i, params: n }
          );
      }
      return {};
    }
    setDefaultHandler(e, t = 'GET') {
      this._defaultHandlerMap.set(t, D(e));
    }
    setCatchHandler(e) {
      this._catchHandler = D(e);
    }
    registerRoute(e) {
      (this._routes.has(e.method) || this._routes.set(e.method, []), this._routes.get(e.method).push(e));
    }
    unregisterRoute(e) {
      if (!this._routes.has(e.method)) throw new l('unregister-route-but-not-found-with-method', { method: e.method });
      let t = this._routes.get(e.method).indexOf(e);
      if (t > -1) this._routes.get(e.method).splice(t, 1);
      else throw new l('unregister-route-route-not-registered');
    }
  }
  let P = () => (s || ((s = new W()).addFetchListener(), s.addCacheListener()), s);
  function I(e, t, s) {
    let a;
    if ('string' == typeof e) {
      let i = new URL(e, location.href);
      a = new T(({ url: e }) => e.href === i.href, t, s);
    } else if (e instanceof RegExp) a = new U(e, t, s);
    else if ('function' == typeof e) a = new T(e, t, s);
    else if (e instanceof T) a = e;
    else
      throw new l('unsupported-route-type', {
        moduleName: 'workbox-routing',
        funcName: 'registerRoute',
        paramName: 'capture',
      });
    return (P().registerRoute(a), a);
  }
  class q extends T {
    constructor(e, t) {
      super(({ request: s }) => {
        let a = e.getURLsToCacheKeys();
        for (let i of (function* (
          e,
          {
            ignoreURLParametersMatching: t = [/^utm_/, /^fbclid$/],
            directoryIndex: s = 'index.html',
            cleanURLs: a = !0,
            urlManipulation: i,
          } = {},
        ) {
          let n = new URL(e, location.href);
          ((n.hash = ''), yield n.href);
          let r = (function (e, t = []) {
            for (let s of [...e.searchParams.keys()]) t.some((e) => e.test(s)) && e.searchParams.delete(s);
            return e;
          })(n, t);
          if ((yield r.href, s && r.pathname.endsWith('/'))) {
            let e = new URL(r.href);
            ((e.pathname += s), yield e.href);
          }
          if (a) {
            let e = new URL(r.href);
            ((e.pathname += '.html'), yield e.href);
          }
          if (i) for (let e of i({ url: n })) yield e.href;
        })(s.url, t)) {
          let t = a.get(i);
          if (t) {
            let s = e.getIntegrityForCacheKey(t);
            return { cacheKey: t, integrity: s };
          }
        }
      }, e.strategy);
    }
  }
  let M = { cacheWillUpdate: async ({ response: e }) => (200 === e.status || 0 === e.status ? e : null) };
  class K extends S {
    constructor(e = {}) {
      (super(e),
        this.plugins.some((e) => 'cacheWillUpdate' in e) || this.plugins.unshift(M),
        (this._networkTimeoutSeconds = e.networkTimeoutSeconds || 0));
    }
    async _handle(e, t) {
      let s,
        a = [],
        i = [];
      if (this._networkTimeoutSeconds) {
        let { id: n, promise: r } = this._getTimeoutPromise({ request: e, logs: a, handler: t });
        ((s = n), i.push(r));
      }
      let n = this._getNetworkPromise({ timeoutId: s, request: e, logs: a, handler: t });
      i.push(n);
      let r = await t.waitUntil((async () => (await t.waitUntil(Promise.race(i))) || (await n))());
      if (!r) throw new l('no-response', { url: e.url });
      return r;
    }
    _getTimeoutPromise({ request: e, logs: t, handler: s }) {
      let a;
      return {
        promise: new Promise((t) => {
          a = setTimeout(async () => {
            t(await s.cacheMatch(e));
          }, 1e3 * this._networkTimeoutSeconds);
        }),
        id: a,
      };
    }
    async _getNetworkPromise({ timeoutId: e, request: t, logs: s, handler: a }) {
      let i, n;
      try {
        n = await a.fetchAndCachePut(t);
      } catch (e) {
        e instanceof Error && (i = e);
      }
      return (e && clearTimeout(e), (i || !n) && (n = await a.cacheMatch(t)), n);
    }
  }
  o(475);
  class A {
    constructor(e = {}) {
      ((this._statuses = e.statuses), (this._headers = e.headers));
    }
    isResponseCacheable(e) {
      let t = !0;
      return (
        this._statuses && (t = this._statuses.includes(e.status)),
        this._headers && t && (t = Object.keys(this._headers).some((t) => e.headers.get(t) === this._headers[t])),
        t
      );
    }
  }
  class O {
    constructor(e) {
      ((this.cacheWillUpdate = async ({ response: e }) => (this._cacheableResponse.isResponseCacheable(e) ? e : null)),
        (this._cacheableResponse = new A(e)));
    }
  }
  function B(e) {
    e.then(() => {});
  }
  let j = (e, t) => t.some((t) => e instanceof t),
    F = new WeakMap(),
    H = new WeakMap(),
    V = new WeakMap(),
    $ = new WeakMap(),
    J = new WeakMap(),
    Y = {
      get(e, t, s) {
        if (e instanceof IDBTransaction) {
          if ('done' === t) return H.get(e);
          if ('objectStoreNames' === t) return e.objectStoreNames || V.get(e);
          if ('store' === t) return s.objectStoreNames[1] ? void 0 : s.objectStore(s.objectStoreNames[0]);
        }
        return G(e[t]);
      },
      set: (e, t, s) => ((e[t] = s), !0),
      has: (e, t) => (e instanceof IDBTransaction && ('done' === t || 'store' === t)) || t in e,
    };
  function G(e) {
    if (e instanceof IDBRequest) {
      let t = new Promise((t, s) => {
        let a = () => {
            (e.removeEventListener('success', i), e.removeEventListener('error', n));
          },
          i = () => {
            (t(G(e.result)), a());
          },
          n = () => {
            (s(e.error), a());
          };
        (e.addEventListener('success', i), e.addEventListener('error', n));
      });
      return (
        t
          .then((t) => {
            t instanceof IDBCursor && F.set(t, e);
          })
          .catch(() => {}),
        J.set(t, e),
        t
      );
    }
    if ($.has(e)) return $.get(e);
    let t = (function (e) {
      if ('function' == typeof e)
        return e !== IDBDatabase.prototype.transaction || 'objectStoreNames' in IDBTransaction.prototype
          ? (
              i ||
              (i = [IDBCursor.prototype.advance, IDBCursor.prototype.continue, IDBCursor.prototype.continuePrimaryKey])
            ).includes(e)
            ? function (...t) {
                return (e.apply(Q(this), t), G(F.get(this)));
              }
            : function (...t) {
                return G(e.apply(Q(this), t));
              }
          : function (t, ...s) {
              let a = e.call(Q(this), t, ...s);
              return (V.set(a, t.sort ? t.sort() : [t]), G(a));
            };
      return (e instanceof IDBTransaction &&
        (function (e) {
          if (H.has(e)) return;
          let t = new Promise((t, s) => {
            let a = () => {
                (e.removeEventListener('complete', i),
                  e.removeEventListener('error', n),
                  e.removeEventListener('abort', n));
              },
              i = () => {
                (t(), a());
              },
              n = () => {
                (s(e.error || new DOMException('AbortError', 'AbortError')), a());
              };
            (e.addEventListener('complete', i), e.addEventListener('error', n), e.addEventListener('abort', n));
          });
          H.set(e, t);
        })(e),
      j(e, a || (a = [IDBDatabase, IDBObjectStore, IDBIndex, IDBCursor, IDBTransaction])))
        ? new Proxy(e, Y)
        : e;
    })(e);
    return (t !== e && ($.set(e, t), J.set(t, e)), t);
  }
  let Q = (e) => J.get(e),
    z = ['get', 'getKey', 'getAll', 'getAllKeys', 'count'],
    X = ['put', 'add', 'delete', 'clear'],
    Z = new Map();
  function ee(e, t) {
    if (!(e instanceof IDBDatabase && !(t in e) && 'string' == typeof t)) return;
    if (Z.get(t)) return Z.get(t);
    let s = t.replace(/FromIndex$/, ''),
      a = t !== s,
      i = X.includes(s);
    if (!(s in (a ? IDBIndex : IDBObjectStore).prototype) || !(i || z.includes(s))) return;
    let n = async function (e, ...t) {
      let n = this.transaction(e, i ? 'readwrite' : 'readonly'),
        r = n.store;
      return (a && (r = r.index(t.shift())), (await Promise.all([r[s](...t), i && n.done]))[0]);
    };
    return (Z.set(t, n), n);
  }
  ((Y = ((e) => ({ ...e, get: (t, s, a) => ee(t, s) || e.get(t, s, a), has: (t, s) => !!ee(t, s) || e.has(t, s) }))(Y)),
    o(187));
  let et = 'cache-entries',
    es = (e) => {
      let t = new URL(e, location.href);
      return ((t.hash = ''), t.href);
    };
  class ea {
    constructor(e) {
      ((this._db = null), (this._cacheName = e));
    }
    _upgradeDb(e) {
      let t = e.createObjectStore(et, { keyPath: 'id' });
      (t.createIndex('cacheName', 'cacheName', { unique: !1 }),
        t.createIndex('timestamp', 'timestamp', { unique: !1 }));
    }
    _upgradeDbAndDeleteOldDbs(e) {
      (this._upgradeDb(e),
        this._cacheName &&
          (function (e, { blocked: t } = {}) {
            let s = indexedDB.deleteDatabase(e);
            (t && s.addEventListener('blocked', (e) => t(e.oldVersion, e)), G(s).then(() => void 0));
          })(this._cacheName));
    }
    async setTimestamp(e, t) {
      let s = { url: (e = es(e)), timestamp: t, cacheName: this._cacheName, id: this._getId(e) },
        a = (await this.getDb()).transaction(et, 'readwrite', { durability: 'relaxed' });
      (await a.store.put(s), await a.done);
    }
    async getTimestamp(e) {
      let t = await this.getDb(),
        s = await t.get(et, this._getId(e));
      return null == s ? void 0 : s.timestamp;
    }
    async expireEntries(e, t) {
      let s = await this.getDb(),
        a = await s.transaction(et).store.index('timestamp').openCursor(null, 'prev'),
        i = [],
        n = 0;
      for (; a; ) {
        let s = a.value;
        (s.cacheName === this._cacheName && ((e && s.timestamp < e) || (t && n >= t) ? i.push(a.value) : n++),
          (a = await a.continue()));
      }
      let r = [];
      for (let e of i) (await s.delete(et, e.id), r.push(e.url));
      return r;
    }
    _getId(e) {
      return this._cacheName + '|' + es(e);
    }
    async getDb() {
      return (
        this._db ||
          (this._db = await (function (e, t, { blocked: s, upgrade: a, blocking: i, terminated: n } = {}) {
            let r = indexedDB.open(e, 1),
              o = G(r);
            return (
              a &&
                r.addEventListener('upgradeneeded', (e) => {
                  a(G(r.result), e.oldVersion, e.newVersion, G(r.transaction), e);
                }),
              s && r.addEventListener('blocked', (e) => s(e.oldVersion, e.newVersion, e)),
              o
                .then((e) => {
                  (n && e.addEventListener('close', () => n()),
                    i && e.addEventListener('versionchange', (e) => i(e.oldVersion, e.newVersion, e)));
                })
                .catch(() => {}),
              o
            );
          })('workbox-expiration', 0, { upgrade: this._upgradeDbAndDeleteOldDbs.bind(this) })),
        this._db
      );
    }
  }
  class ei {
    constructor(e, t = {}) {
      ((this._isRunning = !1),
        (this._rerunRequested = !1),
        (this._maxEntries = t.maxEntries),
        (this._maxAgeSeconds = t.maxAgeSeconds),
        (this._matchOptions = t.matchOptions),
        (this._cacheName = e),
        (this._timestampModel = new ea(e)));
    }
    async expireEntries() {
      if (this._isRunning) {
        this._rerunRequested = !0;
        return;
      }
      this._isRunning = !0;
      let e = this._maxAgeSeconds ? Date.now() - 1e3 * this._maxAgeSeconds : 0,
        t = await this._timestampModel.expireEntries(e, this._maxEntries),
        s = await self.caches.open(this._cacheName);
      for (let e of t) await s.delete(e, this._matchOptions);
      ((this._isRunning = !1), this._rerunRequested && ((this._rerunRequested = !1), B(this.expireEntries())));
    }
    async updateTimestamp(e) {
      await this._timestampModel.setTimestamp(e, Date.now());
    }
    async isURLExpired(e) {
      if (!this._maxAgeSeconds) return !1;
      {
        let t = await this._timestampModel.getTimestamp(e),
          s = Date.now() - 1e3 * this._maxAgeSeconds;
        return void 0 === t || t < s;
      }
    }
    async delete() {
      ((this._rerunRequested = !1), await this._timestampModel.expireEntries(1 / 0));
    }
  }
  class en {
    constructor(e = {}) {
      ((this.cachedResponseWillBeUsed = async ({ event: e, request: t, cacheName: s, cachedResponse: a }) => {
        if (!a) return null;
        let i = this._isResponseDateFresh(a),
          n = this._getCacheExpiration(s);
        B(n.expireEntries());
        let r = n.updateTimestamp(t.url);
        if (e)
          try {
            e.waitUntil(r);
          } catch (e) {}
        return i ? a : null;
      }),
        (this.cacheDidUpdate = async ({ cacheName: e, request: t }) => {
          let s = this._getCacheExpiration(e);
          (await s.updateTimestamp(t.url), await s.expireEntries());
        }),
        (this._config = e),
        (this._maxAgeSeconds = e.maxAgeSeconds),
        (this._cacheExpirations = new Map()),
        e.purgeOnQuotaError && R.add(() => this.deleteCacheAndMetadata()));
    }
    _getCacheExpiration(e) {
      if (e === d.getRuntimeName()) throw new l('expire-custom-caches-only');
      let t = this._cacheExpirations.get(e);
      return (t || ((t = new ei(e, this._config)), this._cacheExpirations.set(e, t)), t);
    }
    _isResponseDateFresh(e) {
      if (!this._maxAgeSeconds) return !0;
      let t = this._getDateHeaderTimestamp(e);
      return null === t || t >= Date.now() - 1e3 * this._maxAgeSeconds;
    }
    _getDateHeaderTimestamp(e) {
      if (!e.headers.has('date')) return null;
      let t = new Date(e.headers.get('date')).getTime();
      return isNaN(t) ? null : t;
    }
    async deleteCacheAndMetadata() {
      for (let [e, t] of this._cacheExpirations) (await self.caches.delete(e), await t.delete());
      this._cacheExpirations = new Map();
    }
  }
  (!(function (e, t) {
    (k().precache(e), I(new q(k(), void 0)));
  })([
    { revision: 'eeabc2223365622817fc4329b87196a3', url: '/Continuum.svg' },
    { revision: '60449d45ecdb294ccd6262aa62c57433', url: '/Ellipse 2.svg' },
    { revision: 'e8bc068b00d24910c805943b0c247df2', url: '/Ellipse 3.svg' },
    { revision: '5d649699c3addce98118e3249f7a748e', url: '/Ellipse 4.svg' },
    { revision: '29dcb2caf395d3e7749250fb9b13f7e4', url: '/_next/static/-z2LoCp2L0qWe2fPqtrnE/_buildManifest.js' },
    { revision: 'b6652df95db52feb4daf4eca35380933', url: '/_next/static/-z2LoCp2L0qWe2fPqtrnE/_ssgManifest.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/1144-1c3e9c09351c4276.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/1220-3e7e8ab6ef0d77ee.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/1352-c30cb4332c865f28.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/1360-1102cafa1a3c6e72.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/1536-c1370244ef0e062e.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/1619-9d09420a8fa17268.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/2561-7bf12a85cec0e6b9.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/2611-0024332d9f3e90e9.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/2704-2733169474cb9124.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/2718-743c3c24c4398333.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/2808-85e96e969b443883.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/302ecd0c-72ab4e4164b9f86a.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/3200-9364391505682817.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/3351-a4101557ba14adc3.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/3565-e68c0263c3102689.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/369cbde2-422c9c1336c9072c.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/3730-19278fad79580b92.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/3756-7bd4e4ce2a3894ff.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/3766-af548fbeabf183ab.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/3957-70bce5a6b7adead6.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/4298-42ee1e7b9eb69c93.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/4493-332e18673afa6cc2.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/4580-03d4818f07dd3d29.js' },
    { revision: '27fcc0b7e3ac9a19', url: '/_next/static/chunks/5008.27fcc0b7e3ac9a19.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/5112-be4a46b65312ada0.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/5509-b8d10c06b6648f55.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/5675-230e599af32589db.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/5858-46ab1bbb8a46fc78.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/6034-60add256e8fb7653.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/6054-6d0931eaeb9a57b3.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/619-960f9d66c638e6d9.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/6284-4f45653edc4844ed.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/6686-2bcef49f23b32b85.js' },
    { revision: 'f2b386eecb4e7b2a', url: '/_next/static/chunks/6844.f2b386eecb4e7b2a.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/7432-9800cdb27695d25e.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/7648-b396c770a3d0ff14.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/7809-d37d881cbbfc271e.js' },
    { revision: 'dc460df7db66e6fb', url: '/_next/static/chunks/7953.dc460df7db66e6fb.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/8052-c7930f3bc2427f41.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/8132-4cd8969e18b41032.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/8339-174f4a1257d65518.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/8739-6398de6e12fa80c1.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/8741-37a76c44271eff7d.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/8809-982dfa091c85da40.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/8882-eecd1dc2a8ff6405.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/9499-d80c179c3688107c.js' },
    { revision: '4a394e2bffb16520', url: '/_next/static/chunks/9629.4a394e2bffb16520.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/991-d525e5138f148e70.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/app/_not-found/page-87a208fb946adc44.js' },
    {
      revision: '-z2LoCp2L0qWe2fPqtrnE',
      url: '/_next/static/chunks/app/api/auth/%5B...nextauth%5D/route-950e096f0a4f9f45.js',
    },
    {
      revision: '-z2LoCp2L0qWe2fPqtrnE',
      url: '/_next/static/chunks/app/api/save-subscription/route-efcef6c87236b1a2.js',
    },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/app/client/(main)/forms/page-5e9006df5426adfd.js' },
    {
      revision: '-z2LoCp2L0qWe2fPqtrnE',
      url: '/_next/static/chunks/app/client/(main)/journals/%5BentryId%5D/edit/page-efa2f6729696b7f3.js',
    },
    {
      revision: '-z2LoCp2L0qWe2fPqtrnE',
      url: '/_next/static/chunks/app/client/(main)/journals/%5BentryId%5D/page-b3be913b4b759274.js',
    },
    {
      revision: '-z2LoCp2L0qWe2fPqtrnE',
      url: '/_next/static/chunks/app/client/(main)/journals/new/page-2a8f2d5c2e2fa964.js',
    },
    {
      revision: '-z2LoCp2L0qWe2fPqtrnE',
      url: '/_next/static/chunks/app/client/(main)/journals/page-5f3bf51eec8e1a6a.js',
    },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/app/client/(main)/layout-a99e41683d7cde9f.js' },
    {
      revision: '-z2LoCp2L0qWe2fPqtrnE',
      url: '/_next/static/chunks/app/client/(main)/messages/page-99ec3bfa680ee0da.js',
    },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/app/client/(main)/page-d437384a2bbf2171.js' },
    {
      revision: '-z2LoCp2L0qWe2fPqtrnE',
      url: '/_next/static/chunks/app/client/(main)/settings/page-ba5364705123c875.js',
    },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/app/client/auth/layout-beeb425d12ac46bc.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/app/client/auth/otp/page-7ef1e0cd877bc536.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/app/client/auth/page-1e91ba1cf06dc876.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/app/client/auth/signup/page-8bdcb19a123da416.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/app/client/intake/page-7884a38295cb5e24.js' },
    {
      revision: '-z2LoCp2L0qWe2fPqtrnE',
      url: '/_next/static/chunks/app/client/personal-details/page-2d26d6c1c21c4290.js',
    },
    {
      revision: '-z2LoCp2L0qWe2fPqtrnE',
      url: '/_next/static/chunks/app/client/profile-setup/page-086f2c48af7bd930.js',
    },
    {
      revision: '-z2LoCp2L0qWe2fPqtrnE',
      url: '/_next/static/chunks/app/client/response-sent/page-683913a317e22fc6.js',
    },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/app/error-2f938319f80b03ae.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/app/layout-6515f1be20692681.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/app/loading-0b8e331d9b184117.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/app/not-found-42404e2a68dc8718.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/app/page-ae6d3248261cc919.js' },
    {
      revision: '-z2LoCp2L0qWe2fPqtrnE',
      url: '/_next/static/chunks/app/practitioner/(main)/clients/%5BclientId%5D/dashboard/journals/%5BentryId%5D/page-0056f2d394443c2e.js',
    },
    {
      revision: '-z2LoCp2L0qWe2fPqtrnE',
      url: '/_next/static/chunks/app/practitioner/(main)/clients/%5BclientId%5D/dashboard/layout-8c1d607da24e399e.js',
    },
    {
      revision: '-z2LoCp2L0qWe2fPqtrnE',
      url: '/_next/static/chunks/app/practitioner/(main)/clients/%5BclientId%5D/dashboard/new-session/page-a98030ee0ef94e73.js',
    },
    {
      revision: '-z2LoCp2L0qWe2fPqtrnE',
      url: '/_next/static/chunks/app/practitioner/(main)/clients/%5BclientId%5D/dashboard/page-dd494745ef66d072.js',
    },
    {
      revision: '-z2LoCp2L0qWe2fPqtrnE',
      url: '/_next/static/chunks/app/practitioner/(main)/clients/%5BclientId%5D/messages/page-18d380f4ca02ec1e.js',
    },
    {
      revision: '-z2LoCp2L0qWe2fPqtrnE',
      url: '/_next/static/chunks/app/practitioner/(main)/clients/%5BclientId%5D/plans/%5BplanId%5D/page-37e5b51fb3af1971.js',
    },
    {
      revision: '-z2LoCp2L0qWe2fPqtrnE',
      url: '/_next/static/chunks/app/practitioner/(main)/clients/%5BclientId%5D/profile/page-9349193fc8fda645.js',
    },
    {
      revision: '-z2LoCp2L0qWe2fPqtrnE',
      url: '/_next/static/chunks/app/practitioner/(main)/clients/%5BclientId%5D/tasks/%5Bdate%5D/page-b3ffc86ddacfc011.js',
    },
    {
      revision: '-z2LoCp2L0qWe2fPqtrnE',
      url: '/_next/static/chunks/app/practitioner/(main)/clients/page-693ab49d63c5e6ad.js',
    },
    {
      revision: '-z2LoCp2L0qWe2fPqtrnE',
      url: '/_next/static/chunks/app/practitioner/(main)/forms/%5BformId%5D/page-32dbe3d8712934b1.js',
    },
    {
      revision: '-z2LoCp2L0qWe2fPqtrnE',
      url: '/_next/static/chunks/app/practitioner/(main)/forms/new/page-1a5a325d7485bba0.js',
    },
    {
      revision: '-z2LoCp2L0qWe2fPqtrnE',
      url: '/_next/static/chunks/app/practitioner/(main)/forms/page-5d1d66c608c91044.js',
    },
    {
      revision: '-z2LoCp2L0qWe2fPqtrnE',
      url: '/_next/static/chunks/app/practitioner/(main)/layout-4269faf353676c49.js',
    },
    {
      revision: '-z2LoCp2L0qWe2fPqtrnE',
      url: '/_next/static/chunks/app/practitioner/(main)/messages/page-470bf43d3b179dd6.js',
    },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/app/practitioner/(main)/page-0bbb4c3d592caae4.js' },
    {
      revision: '-z2LoCp2L0qWe2fPqtrnE',
      url: '/_next/static/chunks/app/practitioner/(main)/sessions/%5BsessionId%5D/page-6cb16d341c3c8036.js',
    },
    {
      revision: '-z2LoCp2L0qWe2fPqtrnE',
      url: '/_next/static/chunks/app/practitioner/(main)/sessions/page-8c62105f6567b939.js',
    },
    {
      revision: '-z2LoCp2L0qWe2fPqtrnE',
      url: '/_next/static/chunks/app/practitioner/(main)/settings/page-ec11968074dc04e9.js',
    },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/app/practitioner/auth/layout-534c80bbeecc83be.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/app/practitioner/auth/page-f7031cfcf8738aa7.js' },
    {
      revision: '-z2LoCp2L0qWe2fPqtrnE',
      url: '/_next/static/chunks/app/practitioner/auth/signup/page-4137da1953a0ba25.js',
    },
    {
      revision: '-z2LoCp2L0qWe2fPqtrnE',
      url: '/_next/static/chunks/app/practitioner/invite/layout-98aaa75af54d48bc.js',
    },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/app/practitioner/invite/page-a27e73b181e43769.js' },
    {
      revision: '-z2LoCp2L0qWe2fPqtrnE',
      url: '/_next/static/chunks/app/practitioner/invite/success/page-bdb97f96e04e3156.js',
    },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/app/practitioner/layout-cba055b97d41abd9.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/f85d6200-563f98cf76178a47.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/framework-75e4e36823871521.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/main-2e2297694b1b5189.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/main-app-92eb1c9f39f0ea5d.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/pages/_app-fe3ef6fd75a7b25b.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/pages/_error-943381cab371d3aa.js' },
    { revision: '846118c33b2c0e922d7b3a7676f81f6f', url: '/_next/static/chunks/polyfills-42372ed130431b0a.js' },
    { revision: '-z2LoCp2L0qWe2fPqtrnE', url: '/_next/static/chunks/webpack-df3333127cf4fa11.js' },
    { revision: '09d083b0534d6d9e', url: '/_next/static/css/09d083b0534d6d9e.css' },
    { revision: '602f5ad336f21e3d', url: '/_next/static/css/602f5ad336f21e3d.css' },
    { revision: '7f9bff774f4194fd', url: '/_next/static/css/7f9bff774f4194fd.css' },
    { revision: '8ee968ef79ad5028', url: '/_next/static/css/8ee968ef79ad5028.css' },
    { revision: 'b768cd3c08ab615c', url: '/_next/static/css/b768cd3c08ab615c.css' },
    { revision: 'befd9c0fdfa3d8a645d5f95717ed6420', url: '/_next/static/media/26a46d62cd723877-s.woff2' },
    { revision: '62f762afb90d7743f6916ea0cce473af', url: '/_next/static/media/47f136985ef5b5cb-s.woff2' },
    { revision: '774586d4bcb09cb42f38fc490d25b01b', url: '/_next/static/media/4ead58c4dcc3f285-s.woff2' },
    { revision: '43828e14271c77b87e3ed582dbff9f74', url: '/_next/static/media/55c55f0601d81cf3-s.woff2' },
    { revision: 'f0b86e7c24f455280b8df606b89af891', url: '/_next/static/media/581909926a08bbc8-s.woff2' },
    { revision: '52d04440a9faae0db9adc6cdc844099b', url: '/_next/static/media/636a5ac981f94f8b-s.p.woff2' },
    { revision: '26ed8f1835670f47c3daeff5e6d84b23', url: '/_next/static/media/6af6b543dd3be231-s.p.woff2' },
    { revision: '2591db816b61d44b6e87ba79d13622b2', url: '/_next/static/media/6fe53d21e6e7ebd8-s.woff2' },
    { revision: '01ba6c2a184b8cba08b0d57167664d75', url: '/_next/static/media/8e9860b6e62d6359-s.woff2' },
    { revision: '196acbb650c75807ea2f0ef36edbd186', url: '/_next/static/media/8ebc6e9dde468c4a-s.woff2' },
    { revision: 'e360c61c5bd8d90639fd4503c829c2dc', url: '/_next/static/media/97e0cb1ae144a2a9-s.woff2' },
    { revision: 'd54db44de5ccb18886ece2fda72bdfe0', url: '/_next/static/media/df0a9ae256c0569c-s.woff2' },
    { revision: '65850a373e258f1c897a2b3d75eb74de', url: '/_next/static/media/e4af272ccee01ff0-s.p.woff2' },
    { revision: 'c25b6715e7ff9251f02f3bad2537cd4d', url: '/_next/static/media/ef64ecae5e1bff42-s.woff2' },
    { revision: 'fe89f9f565f22acf40ad703bdc3c7dcc', url: '/_next/static/media/f7c8bed65df13031-s.woff2' },
    { revision: '7229b148c76ba2d4e575ce1af0f846f5', url: '/arrow-right.svg' },
    { revision: '0648b9323fa38340c395f47da2e69967', url: '/auth.jpg' },
    { revision: 'd00d9c0aa5479cc2366f6deb6a632914', url: '/background.svg' },
    { revision: '95f7b6385be66ad0fb32b121e1dbd197', url: '/home/book.svg' },
    { revision: '69a0ebd4347bbc49a022f7a7fce75ead', url: '/home/sms-tracking.svg' },
    { revision: '4564f00dbd5936ad96f8b50c089cec5a', url: '/icons/icon-192x192.png' },
    { revision: '4564f00dbd5936ad96f8b50c089cec5a', url: '/icons/icon-512x512.png' },
    { revision: 'cfeb4d72e50856a9d7a8fcf5668d7de4', url: '/infinity.png' },
    { revision: '043f4ea6de5afd369b96f63877db498e', url: '/infinity.svg' },
    { revision: '9f0e37d16e79938bfba7e00b659eeaaa', url: '/logo.svg' },
    { revision: '9ec7a037e0204e8a4ac295d59d30fe45', url: '/manifest.json' },
    { revision: 'c73d2d4625e07ecfe4953c26985ad881', url: '/sidebar/home.svg' },
    { revision: '57becfeb325c064565ed9a8d3fbeb673', url: '/sidebar/message.svg' },
    { revision: '2db1d2ff57a388c2d8821c22983c9d77', url: '/sidebar/note-2.svg' },
    { revision: '5ead0623c2a03418d9f4a8590a1abaca', url: '/sidebar/profile-2user.svg' },
    { revision: '64e0fc363d6ec764a681f9f404d09ae2', url: '/sw.js' },
  ]),
    I(
      ({ url: e }) => e.pathname.startsWith('/api/'),
      new K({
        cacheName: 'api-cache',
        plugins: [new O({ statuses: [0, 200] }), new en({ maxEntries: 50, maxAgeSeconds: 300 })],
      }),
    ),
    self.addEventListener('push', function (e) {
      console.log('[SW] Push event received:', e);
      let t = {};
      if (e.data)
        try {
          ((t = e.data.json()), console.log('[SW] Parsed push data as JSON:', t));
        } catch (s) {
          console.log('[SW] Failed to parse as JSON, trying as text:', s.message);
          try {
            let s = e.data.text();
            console.log('[SW] Raw text data:', s);
            try {
              ((t = JSON.parse(s)), console.log('[SW] Successfully parsed text as JSON:', t));
            } catch (e) {
              (console.log('[SW] Treating as plain text message'),
                (t = { title: 'New Notification', body: s || 'You have a new message.' }));
            }
          } catch (e) {
            (console.error('[SW] Error reading push data as text:', e),
              (t = { title: 'New Notification', body: 'You have a new message.' }));
          }
        }
      else
        (console.log('[SW] No data in push event, using default notification'),
          (t = { title: 'New Notification', body: 'You have a new message.' }));
      let s = t.title || 'New Notification',
        a = {
          body: t.body || 'You have a new message.',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-192x192.png',
          data: { url: t.url || '/', timestamp: Date.now() },
          requireInteraction: !1,
          silent: !1,
          tag: t.tag || 'default',
          actions: t.actions || [],
        };
      (console.log('[SW] Showing notification with options:', a),
        e.waitUntil(
          self.registration
            .showNotification(s, a)
            .then(() => {
              console.log('[SW] Notification shown successfully');
            })
            .catch((e) => {
              console.error('[SW] Error showing notification:', e);
            }),
        ));
    }),
    self.addEventListener('notificationclick', function (e) {
      (console.log('[SW] Notification click received:', e), e.notification.close());
      let t = e.notification.data?.url || '/';
      (console.log('[SW] Opening URL:', t),
        e.waitUntil(
          clients
            .matchAll({ type: 'window', includeUncontrolled: !0 })
            .then((e) => {
              for (let s of (console.log('[SW] Found window clients:', e.length), e))
                if (s.url === t && 'focus' in s) return (console.log('[SW] Focusing existing window'), s.focus());
              if (clients.openWindow) return (console.log('[SW] Opening new window'), clients.openWindow(t));
            })
            .catch((e) => {
              console.error('[SW] Error handling notification click:', e);
            }),
        ));
    }),
    self.addEventListener('notificationclose', function (e) {
      console.log('[SW] Notification closed:', e);
    }),
    self.addEventListener('install', function (e) {
      (console.log('[SW] Service Worker installing...'), self.skipWaiting());
    }),
    self.addEventListener('activate', function (e) {
      (console.log('[SW] Service Worker activating...'), e.waitUntil(self.clients.claim()));
    }),
    self.addEventListener('message', function (e) {
      (console.log('[SW] Message received:', e.data), e.data && 'SKIP_WAITING' === e.data.type && self.skipWaiting());
    }));
})();
