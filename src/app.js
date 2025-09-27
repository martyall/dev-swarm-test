const { hello } = require('./hello.js');

function greet(name) {
    const greeting = hello();
    return `${greeting} Nice to meet you, ${name}!`;
}

module.exports = { greet };