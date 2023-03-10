(function(window) {
    var version = '1.0.1';
    var sessionId = getSessionId();
    var apiKey = null;
    var apiUrl = 'http://171.244.10.38/api/v1/track';
    if (window.Teachiez_TA) {
        console.warn('Teachiez_TA is already loaded.');
        return;
    }
    function getSessionId() {
      var storedId = localStorage.getItem('sessionId');
      if (storedId) {
        return storedId;
      }
      var newId = generateUuid();
      localStorage.setItem('sessionId', newId);
      return newId;
    }

    function generateUuid() {
      var d = new Date().getTime();
      var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
      return uuid;
    }

    function trackEvent(event_type, event_values) {
        if(!apiKey){
            console.error('Teachiez API is not set');
            return;
        }
        var data = {
            session: sessionId,
            event_type: event_type,
            event_values: event_values,
            url: window.location.href,
            referrer: document.referrer
        };
        var xhr = new XMLHttpRequest();
        xhr.open('POST', apiUrl);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('x-api-key', apiKey);
        xhr.send(JSON.stringify(data));
    }
    function setApiKey(api){
        apiKey = api;
    }
      // Attach event listeners to track user behavior
    window.addEventListener('load', function() {
        // Track page view
        trackEvent('page_view', '');
        // Track link clicks
        var links = document.getElementsByTagName('a');
        for (var i = 0; i < links.length; i++) {
            links[i].addEventListener('click', function() {
            var linkUrl = this.getAttribute('href');
            trackEvent('link_click', linkUrl);
            });
        }
        // Track form submissions
        var forms = document.getElementsByTagName('form');
        for (var i = 0; i < forms.length; i++) {
            forms[i].addEventListener('submit', function() {
            var formData = new FormData(this);
            var formValues = {};
            for (var pair of formData.entries()) {
                formValues[pair[0]] = pair[1];
            }
            trackEvent('form_submission', formValues);
            });
        }
        });
        window.Teachiez_TA = {
            setApiKey: setApiKey,
            version: version,
            trackEvent: trackEvent
        };
  })(window);
