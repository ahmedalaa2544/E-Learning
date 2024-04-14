/**
 * Higher-order function to create an asynchronous socket handler.
 * @param {function} socketOperation - Asynchronous socket operation to be wrapped.
 * @returns {function} - Asynchronous function to handle socket events.
 */
export const asyncHandelerScoket = (socketOperation) => {
  return async (socket, ...args) => {
    try {
      // Execute the provided asynchronous socket operation
      return await socketOperation(socket, ...args);
    } catch (err) {
      // Log the error and emit an 'error' event to the socket with the error message
      // console.log(err);
      return socket.emit("error", err.message);
    }
  };
};
