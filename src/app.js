const { hello } = require('./hello');

/**
 * Greeting function that uses the hello function
 * @returns {string} A greeting message
 */
function greet() {
  return hello();
}

module.exports = { greet };