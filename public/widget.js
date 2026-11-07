(function () {
  'use strict';

  // Prevent multiple executions
  if (window.__LEADZMAKER_WIDGET_LOADED__) return;
  window.__LEADZMAKER_WIDGET_LOADED__ = true;

  var scriptEl = document.currentScript || document.querySelector('script[src*="widget.js"]');
  var serverOrigin = 'https://leadzmaker-chatbot.vercel.app';
  if (scriptEl && scriptEl.src) {
    try {
      var url = new URL(scriptEl.src);
      serverOrigin = url.origin;
    } catch (e) {}
  }

  var currentHost = (window.location.hostname || '').toLowerCase();
  // Disable widget and tracking on CRM / salesflow-ai / teals portal sites
  if (currentHost.indexOf('salesflow-ai') !== -1 || currentHost.indexOf('teals-livechat') !== -1) {
    return;
  }

  function detectSlugFromHostname(hostname) {
    var h = (hostname || '').toLowerCase();
    if (h.indexOf('amzsolutionshub.com') !== -1) return 'amz-solutions-hub';
    if (h.indexOf('amzinnovators.com') !== -1) return 'amz-innovators';
    if (h.indexOf('authorsbreeze.com') !== -1) return 'authors-breeze';
    if (h.indexOf('probookpublishing.com') !== -1) return 'pro-book-publishing';
    if (h.indexOf('amzwritershub.com') !== -1) return 'amz-writers-hub';
    return null;
  }

  var explicitSlug = scriptEl && (scriptEl.getAttribute('data-property-slug') || scriptEl.getAttribute('data-property'));
  var detectedSlug = detectSlugFromHostname(window.location.hostname);
  var propertySlug = explicitSlug || detectedSlug || 'leadzmaker';

  // Only suppress floating widget if already inside an iframe or directly on the admin livechat hub
  var isInsideIframe = false;
  try {
    isInsideIframe = window.self !== window.top;
  } catch (e) {
    isInsideIframe = true;
  }
  var isLiveChatAdmin = window.location.pathname === '/admin/livechat' || window.location.pathname.indexOf('/admin') === 0;
  var suppressWidget = isInsideIframe || isLiveChatAdmin;

  // Preserve initial external referrer across SPA route transitions
  var initialReferrer = 'Direct';
  try {
    var savedRef = sessionStorage.getItem('lm_initial_referrer');
    if (savedRef) {
      initialReferrer = savedRef;
    } else if (document.referrer) {
      var refHost = '';
      try { refHost = new URL(document.referrer).hostname.toLowerCase(); } catch (e) {}
      if (refHost && refHost !== currentHost && refHost.indexOf('leadzmaker.com') === -1) {
        initialReferrer = document.referrer;
      }
      sessionStorage.setItem('lm_initial_referrer', initialReferrer);
    }
  } catch (e) {}

  // PER-TAB SESSION ID GENERATED STRICTLY ONCE PER TAB
  var tabSessionId;
  try {
    tabSessionId = sessionStorage.getItem('lm_tab_session_id');
  } catch (e) {}

  if (!tabSessionId) {
    tabSessionId = 'tab_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
    try {
      sessionStorage.setItem('lm_tab_session_id', tabSessionId);
    } catch (e) {}
  }

  // Persistent visitor token across reloads
  var visitorToken;
  try {
    visitorToken = localStorage.getItem('lm_visitor_token');
  } catch (e) {}

  if (!visitorToken) {
    visitorToken = 'vis_' + Math.random().toString(36).substring(2, 10);
    try {
      localStorage.setItem('lm_visitor_token', visitorToken);
    } catch (e) {}
  }

  function sendTracking(isNew) {
    if (suppressWidget) return;
    try {
      var currentUrl = window.location.pathname + (window.location.search || '');
      var referrer = initialReferrer || document.referrer || 'Direct';

      fetch(serverOrigin + '/api/visitor/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: tabSessionId,
          visitorToken: visitorToken,
          propertySlug: propertySlug,
          currentPage: currentUrl || '/',
          referrer: referrer,
          isNewPageView: isNew
        })
      }).catch(function () {});
    } catch (e) {}
  }

  // Initial track on page load
  sendTracking(true);

  // Hook SPA navigation (pushState / popstate) for instant Active Page updates
  try {
    var origPushState = history.pushState;
    if (origPushState) {
      history.pushState = function () {
        var ret = origPushState.apply(this, arguments);
        setTimeout(function () { sendTracking(false); }, 50);
        return ret;
      };
    }
    window.addEventListener('popstate', function () {
      setTimeout(function () { sendTracking(false); }, 50);
    });
  } catch (e) {}

  function sendPing() {
    if (suppressWidget) return;
    try {
      var currentPath = window.location.pathname || '/';
      fetch(serverOrigin + '/api/visitor/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: tabSessionId,
          visitorToken: visitorToken,
          propertySlug: propertySlug,
          currentPage: currentPath,
          referrer: initialReferrer || document.referrer || 'Direct'
        })
      }).catch(function () {});
    } catch (e) {}
  }

  // 8-Second Active Heartbeat Ping for real-time live visitor monitoring
  setInterval(function () {
    if (typeof document !== 'undefined' && document.hidden) return;
    sendPing();
  }, 8000);

  // Immediate ping when visitor switches tabs or focuses the window
  if (typeof document.addEventListener !== 'undefined') {
    document.addEventListener('visibilitychange', function () {
      sendPing();
    });
  }
  window.addEventListener('focus', sendPing);
  window.addEventListener('pageshow', function () {
    sendTracking(false);
  });

  // Throttled user interaction ping (max once per 8 seconds)
  var lastInteractionPing = 0;
  function onUserActive() {
    var now = Date.now();
    if (now - lastInteractionPing > 8000) {
      lastInteractionPing = now;
      sendPing();
    }
  }
  window.addEventListener('mousemove', onUserActive, { passive: true });
  window.addEventListener('scroll', onUserActive, { passive: true });
  window.addEventListener('touchstart', onUserActive, { passive: true });
  window.addEventListener('keydown', onUserActive, { passive: true });

  // Instant departure notification on tab close / mobile swipe
  function handleOffline() {
    if (suppressWidget) return;
    try {
      var payload = JSON.stringify({
        sessionId: tabSessionId,
        visitorToken: visitorToken,
        propertySlug: propertySlug
      });
      var url = serverOrigin + '/api/visitor/offline?sessionId=' + encodeURIComponent(tabSessionId);
      if (navigator.sendBeacon) {
        var blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
      } else {
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true
        }).catch(function () {});
      }
    } catch (e) {}
  }

  window.addEventListener('beforeunload', handleOffline);
  window.addEventListener('pagehide', handleOffline);
  window.addEventListener('unload', handleOffline);

  // Embed Live Chat Iframe
  if (!suppressWidget) {
    var iframe = document.createElement('iframe');
    iframe.id = 'leadzmaker-livechat-iframe';
    iframe.src = serverOrigin + '/widget?property=' + encodeURIComponent(propertySlug) + '&page=' + encodeURIComponent(window.location.pathname || '/') + '&ref=' + encodeURIComponent(initialReferrer || document.referrer || 'Direct') + '&session=' + encodeURIComponent(tabSessionId) + '&token=' + encodeURIComponent(visitorToken) + '&_v=20261108_1';
    iframe.style.position = 'fixed';
    iframe.style.bottom = '20px';
    iframe.style.right = '20px';
    iframe.style.width = '80px';
    iframe.style.height = '80px';
    iframe.style.border = 'none';
    iframe.style.zIndex = '9999999';
    iframe.style.colorScheme = 'none';
    iframe.style.background = 'transparent';
    iframe.allow = 'autoplay';

    window.addEventListener('message', function (e) {
      if (e.data && (e.data.type === 'LM_WIDGET_RESIZE' || e.data.type === 'TEALS_WIDGET_RESIZE')) {
        if (e.data.isOpen === true) {
          iframe.style.width = '400px';
          iframe.style.height = '580px';
        } else if (e.data.isOpen === 'bubble') {
          // Show greeting bubble - expand enough to not clip
          iframe.style.width = '340px';
          iframe.style.height = '130px';
        } else {
          iframe.style.width = '80px';
          iframe.style.height = '80px';
        }
      }
    });

    if (document.body) {
      document.body.appendChild(iframe);
    } else {
      window.addEventListener('DOMContentLoaded', function () {
        document.body.appendChild(iframe);
      });
    }
  }
})();
