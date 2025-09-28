const { hello } = require('./hello');

function greet(name) {
  const helloMessage = hello();
  return `${helloMessage} Nice to meet you, ${name}!`;
}

module.exports = { greet };