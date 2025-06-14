// Create this as a bookmarklet by adding "javascript:" before pasting into a bookmark URL
(function() {
  console.clear();
  console.log("%c🔍 WebSocket Event Monitor Active", "font-size: 16px; font-weight: bold; color: blue;");
  
  // Create a wrapper for the original WebSocket constructor
  const OriginalWebSocket = window.WebSocket;
  
  // Override the WebSocket constructor
  window.WebSocket = function(url, protocols) {
    console.log("%c🔌 WebSocket Connection", "font-size: 14px; color: purple;", url);
    
    // Create an instance of the original WebSocket
    const socket = new OriginalWebSocket(url, protocols);
    
    // Override send method
    const originalSend = socket.send;
    socket.send = function(data) {
      try {
        const parsedData = JSON.parse(data);
        console.log("%c📤 WebSocket Send", "color: orange;", parsedData);
      } catch (e) {
        console.log("%c📤 WebSocket Send", "color: orange;", data);
      }
      originalSend.call(this, data);
    };
    
    // Override onmessage
    socket.addEventListener('message', function(event) {
      try {
        const parsedData = JSON.parse(event.data);
        console.log("%c📥 WebSocket Received", "color: green;", parsedData);
      } catch (e) {
        console.log("%c📥 WebSocket Received", "color: green;", event.data);
      }
    });
    
    // Override other events
    socket.addEventListener('open', function() {
      console.log("%c✅ WebSocket Connected", "color: green;");
    });
    
    socket.addEventListener('close', function(event) {
      console.log("%c❌ WebSocket Closed", "color: red;", event.code, event.reason);
    });
    
    socket.addEventListener('error', function(error) {
      console.log("%c⚠️ WebSocket Error", "color: red;", error);
    });
    
    return socket;
  };
  
  // Check if socket.io is being used
  if (window.io) {
    console.log("%c🔍 Socket.io detected, monitoring events...", "color: blue;");
    
    // Store original socket.io connect
    const originalConnect = window.io.connect;
    
    window.io.connect = function() {
      const socket = originalConnect.apply(this, arguments);
      
      // Store the original emit function
      const originalEmit = socket.emit;
      
      // Override the emit function
      socket.emit = function(event, ...args) {
        console.log("%c📤 Socket.io Emit", "color: orange;", event, args);
        return originalEmit.apply(this, arguments);
      };
      
      // Create a wrapper for the on function to log received events
      const originalOn = socket.on;
      socket.on = function(event, callback) {
        return originalOn.call(this, event, function(...args) {
          console.log("%c📥 Socket.io Received", "color: green;", event, args);
          return callback.apply(this, args);
        });
      };
      
      return socket;
    };
  }
  
  alert("WebSocket Monitor is now active. Check your console for WebSocket events.");
})();
