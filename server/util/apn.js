'use strict';

const apn = require('apn');
const path = require('path');

let options = {
  token: {
    key: path.join(__dirname, '../../authkey.p8'),
    // Replace keyID and teamID with the values you've previously saved.
    keyId: '6RC2L35C6L',
    teamId: 'MN8Y3BHMSS'
  },
  production: false
};

module.exports = {
  notify: function(chart) {
    let apnProvider = new apn.Provider(options);

    // Replace deviceToken with your particular token:
    let deviceToken =
      '10D6C907BD1DF280EFCF2866A63E0A1A9724C7428E0AD6269E9638049669FD4E';

    // Prepare the notifications
    let notification = new apn.Notification();
    notification.expiry = Math.floor(Date.now() / 1000) + 24 * 3600; // will expire in 24 hours from now
    notification.badge = 1;
    notification.sound = 'ping.aiff';
    notification.alert = chart + ' chart updated';
    notification.payload = { messageFrom: 'Chart Watch' };

    // Replace this with your app bundle ID:
    notification.topic = 'com.example.Chart-Watch';

    // Send the actual notification
    apnProvider.send(notification, deviceToken);

    // Close the server
    apnProvider.shutdown();
  }
};
