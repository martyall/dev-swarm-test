const { hello } = require('./hello');

/**
 * Creates a personalized greeting message
 * @param {string} name - The name to include in the greeting
 * @returns {string} Personalized greeting message
 */
function greet(name) {
    return `${hello()} Nice to meet you, ${name}!`;
}

module.exports = { greet };