import * as socket from "socket.io";
import socketMain from "../../socket.io/socketMain.js";
import { isAuthSocket } from "../../socket.io/utils/isAuth.js";
import { asyncHandelerScoket } from "../../socket.io/utils/asyncHandelerScoket.js";
/**
 * Initializes the WebSocket server and handles incoming connections.
 * @param {http.Server} server - The HTTP server instance to attach WebSocket to.
 */
const socketInit = (server) => {
  // Create a new instance of WebSocket Server attached to the provided HTTP server
  const io = new socket.Server(server, {
    // Configure CORS settings
    cors: {
      origin: process.env.ORIGIN, // Allow connections from specified origin
      credentials: true, // Allow credentials to be sent with requests
    },
  });

  // Middleware to authenticate socket connections
  io.use(isAuthSocket);

  // Event listener for incoming socket connections
  io.on(
    "connection",
    asyncHandelerScoket((socket) => {
      // Handle connection by invoking socketMain function
      socketMain(io, socket);
    })
  );
};

export default socketInit;
