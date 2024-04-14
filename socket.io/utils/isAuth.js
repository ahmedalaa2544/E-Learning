import { asyncHandelerScoket } from "./asyncHandelerScoket.js";
import jwt from "jsonwebtoken";

/**
 * Middleware to authenticate socket connections based on provided access token.
 * @param {object} socket - The socket object representing the connection.
 * @param {function} next - Callback function to continue the socket connection.
 * @returns {void} - The function either proceeds with the socket connection or disconnects with an error.
 */
export const isAuthSocket = asyncHandelerScoket((socket, next) => {
  // Check if the access token is provided and has the correct type
  let { accessToken } = socket.handshake.auth;

  if (!accessToken?.startsWith(process.env.BEARER_TOKEN)) {
    return next(new Error("A valid token is required"), { cause: 400 });
  }

  // Extract the token value without the prefix
  accessToken = accessToken.split(process.env.BEARER_TOKEN)[1];

  // Verify the JWT token
  jwt.verify(accessToken, process.env.TOKEN_SIGNTURE, (err, payload) => {
    if (err) {
      // Disconnect the socket if token verification fails
      socket.disconnect(true);
      console.error("Error in isAuthSocket:", err);
    }
    // Continue with the socket connection
    next();
  });
});
