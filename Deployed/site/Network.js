'use strict';

var os = require('os');

// http://stackoverflow.com/questions/3653065/get-local-ip-address-in-node-js
exports.DisplayLocalIPAddresses = () => {
    var networkInterfaces = os.networkInterfaces();

    Object.keys(networkInterfaces).forEach(ifname => {
        var alias = 0;

        networkInterfaces[ifname].forEach(function(iface) {
            if ('IPv4' !== iface.family || iface.internal !== false) {
                // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                return;
            }

            if (alias >= 1) {
                // this single interface has multiple ipv4 addresses
                console.log('This machine has IP address:', iface.address, '(interface: ' + ifname + ':' + alias + ')');
            } else {
                // this interface has only one ipv4 adress
                console.log('This machine has IP address:', iface.address, '(interface: ' + ifname + ')');
            }
            ++alias;
        });
    });
}
