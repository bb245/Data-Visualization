var ipint = require('ipint');

function aton(incoming_ip) {

        return ipint.ipToInt(incoming_ip);
}

function ntoa(incoming_int_ip){

        return ipint.intToIp(incoming_int_ip);
}
exports.aton = aton;
exports.ntoa = ntoa;
