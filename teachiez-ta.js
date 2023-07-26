(function(window) {
  var version = '1.0';
  var sessionId = getSessionId();
  let userId = null;
  var apiKey = null;
  var apiUrl = 'https://chun.website/api/v1/';
  var crmModalContainerId = 'crmModalContainer';
  var crmPopupDuration = null;
  var crmPopupClick = null;
  var crmPopupId = null;
  let doPingPopup = true;
  let stopPingPopup = false;
  var crmDuration = 0;
  var crmClick = 0;
  var showPopup = false;
  var lsTTL = 60000*60*24;
  var intervalShowPopupCounterId = null;
  var intervalPingPopupCounterId = null;

  if (window.Teachiez_TA) {
      console.warn('Teachiez_TA is already loaded.');
      return;
  }
  getIp();
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

  function trackEvent(event_type, event_values, classList_value) {
    if(!apiKey){
        console.error('Teachiez API is not set');
        return;
    }
    var data = {
        session: sessionId,
        event_type: event_type,
        event_values: event_values,
        path: window.location.pathname,
        url: window.location.href,
        referrer: document.referrer,
        device: getDeviceType(),
        ip: getIp(),
        element_classes: classList_value,
        popup: crmPopupId
    };
    // Send form data to server
    var xhr = new XMLHttpRequest();
    xhr.open("POST", apiUrl+'track', true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("x-api-key",apiKey);
    xhr.send(JSON.stringify(data));
  }
  function setApiKey(api){
    apiKey = api;
  }
  function getDeviceType() {
    const userAgent = navigator.userAgent;
    if (/android/i.test(userAgent)) {
      return "Android";
    } else if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
      return "iOS";
    } else if (/windows phone/i.test(userAgent)) {
      return "Windows Phone";
    } else if (/Macintosh|MacIntel|MacPPC|Mac68K/.test(userAgent)) {
      return "Mac";
    } else if (/Windows|Win32|Win64|WOW64/.test(userAgent)) {
      return "Windows";
    } else if (/Linux/i.test(userAgent)) {
      return "Linux";
    }
    return "Unknown";
  }
  function setWithExpiry(key, value, ttl) {
    const now = new Date()
  
    // `item` is an object which contains the original value
    // as well as the time when it's supposed to expire
    const item = {
      value: value,
      expiry: now.getTime() + ttl,
    }
    localStorage.setItem(key, JSON.stringify(item))
  }
  function getWithExpiry(key) {
    const itemStr = localStorage.getItem(key)
    // if the item doesn't exist, return null
    if (!itemStr) {
      return 0
    }
    const item = JSON.parse(itemStr)
    const now = new Date()
    // compare the expiry time of the item with the current time
    if (now.getTime() > item.expiry) {
      // If the item is expired, delete the item from storage
      // and return null
      localStorage.removeItem(key)
      return 0
    }
    return item.value
  }      
  function getIp(){
    var ip = getWithExpiry('crm_ip');
    if (ip != 0) {
      return ip;
    }
    fetch('https://api.ipify.org?format=json')
      .then(response => response.json())
      .then(data => setWithExpiry('crm_ip', data.ip, lsTTL))
      .catch(error => console.error(error));

    return getWithExpiry('crm_ip');
  }
  function startCountTimeShowPopup() {
    var startTime = getWithExpiry('crm_start_time');
    if (!startTime) {
      startTime = new Date().getTime();
      setWithExpiry('crm_start_time', startTime, lsTTL/24);
    }
    // update the timer every second
    intervalShowPopupCounterId = setInterval(() => {
      // get the current time
      const currentTime = new Date().getTime();
      // calculate the elapsed time in seconds
      var elapsedTime = Math.floor((currentTime - startTime) / 1000);
      console.log (elapsedTime);
      if (crmPopupDuration != null && elapsedTime >= crmPopupDuration) {
        localStorage.removeItem('crm_start_time');
        clearInterval(intervalShowPopupCounterId);
        showCrmModal();
      }
    }, 1000);

  }
  function startCountTimePingPopup() {
    // update the timer every 5 seconds
    intervalPingPopupCounterId = setInterval(() => {
      doPingPopup = true;
      localStorage.removeItem('crm_start_time');
      popups();

    }, 10000);
    
  }
  function popups() {
    if (!doPingPopup) {
      return;
    }
    var data = {
      session: sessionId,
      url: window.location.href,
      ip: getIp(),
    };
    fetch(apiUrl+'popups',{
          method: "POST",
          body: JSON.stringify(data),
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          }
        })
      .then(response => response.json())
      .then(data => {
        clearInterval(intervalPingPopupCounterId);
        clearInterval(intervalShowPopupCounterId);
        doPingPopup = false;
        if (data.data !== undefined) {
          crmPopupDuration = data.data.popup.duration;
          crmPopupClick = data.data.popup.click;
          crmPopupId = data.data.popup.id;
          var pending_duration = data.data.popup.pending_duration;
          setWithExpiry('crm_popup_pending', 1, pending_duration*1000);
          startCountTimeShowPopup();
        }else{
          crmPopupDuration = null;
          crmPopupClick = null;
          crmPopupId = null;
          startCountTimePingPopup();
        }

      })
    .catch(error => console.error(error));
  }       
  function showCrmModal() {
    showPopup = true;
    if (crmPopupId == undefined) {
      return;
    }
    var data = {
      session: sessionId,
      url: window.location.href,
      popup: crmPopupId,
      ip: getIp(),
    };
    fetch(apiUrl+'ping',{
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.data!== undefined) {
          try{
            const modalContainer = document.createElement('div');
            modalContainer.setAttribute('id',crmModalContainerId);
            modalContainer.innerHTML = data.data.content;
            document.body.appendChild(modalContainer);
            jQuery('#crm-banner-modal').modal('show');
            addEventIntoLinks();
            addEventIntoButtons();
            clearInterval(intervalShowPopupCounterId);
            clearInterval(intervalPingPopupCounterId);
          }catch(e){
            console.error(e);
          }

        }

      })
    .catch(error => console.error(error));
  }
  function addEventIntoLinks(){
    // Track link clicks
    var links = document.getElementsByTagName('a');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function() {
        var linkUrl = this.getAttribute('href');
        trackEvent('event_click', linkUrl,Array.from(this.classList));
        try {
          jQuery('#crm-banner-modal').modal('hide');
        } catch (error) {
          
        }
      });
    }    
  }       
  function addEventIntoButtons(){
    // track btn click
    // Select all buttons on the page
    const buttons = document.querySelectorAll('button');
    // Loop through the NodeList and add the event listener to each button
    buttons.forEach(button => {
      button.addEventListener('click', function(event) {
        crmClick ++;
        const dataAttributes = button.dataset;
        // Convert the DOMStringMap object to a regular object
        const dataObject = Object.fromEntries(Object.entries(dataAttributes));
        trackEvent('event_click', dataObject,Array.from(event.target.classList));
        try {
          jQuery('#crm-banner-modal').modal('hide');
        } catch (error) {
          
        }
      });
    });
  }       
    // Attach event listeners to track user behavior
  window.addEventListener('load', function() {
    // trackEvent('event_view', 'first visit','');
    // startCountTimeShowPopup();
    // popups();
    // addEventIntoLinks();
    // addEventIntoButtons();

    // const formSelectors = document.querySelectorAll('form');
    // formSelectors.forEach((form) => {
    //     form.addEventListener('submit', function(){
    //         var formData = new FormData(this);
    //         var formValues = {};
    //         for (var pair of formData.entries()) {
    //             formValues[pair[0]] = pair[1];
    //         }
    //         trackEvent('event_submission', formValues,'');
    //     });
    // });

  });
  window.Teachiez_TA = {
      setApiKey: setApiKey,
      version: version,
      trackEvent: trackEvent
  };
})(window);
