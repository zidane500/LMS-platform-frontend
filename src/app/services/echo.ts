import Echo from "laravel-echo";
import Pusher from "pusher-js";
import axios from "axios";

(window as any).Pusher = Pusher;

const echo = new Echo({
  broadcaster: "reverb",
  key: import.meta.env.VITE_REVERB_APP_KEY,

  // ✅ Fix 3 — "0.0.0.0" est l'adresse serveur, le browser doit utiliser "localhost"
  wsHost:
    import.meta.env.VITE_REVERB_HOST === "0.0.0.0"
      ? "localhost"
      : (import.meta.env.VITE_REVERB_HOST ?? "localhost"),

  wsPort: Number(import.meta.env.VITE_REVERB_PORT) || 8081,
  wssPort: Number(import.meta.env.VITE_REVERB_PORT) || 8081,
  forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? "http") === "https",
  enabledTransports: ["ws", "wss"],

  // ✅ Fix 1+2 — authorizer dynamique : lit le token AU MOMENT de l'auth,
  // pas au chargement du module (le token peut ne pas encore exister)
  authorizer: (channel: { name: string }) => ({
    authorize: (
      socketId: string,
      callback: (error: Error | null, data?: any) => void,
    ) => {
      // ✅ Fix 1 — bonne clé localStorage
      const token = localStorage.getItem("auth_token");

      axios
        .post(
          "/broadcasting/auth",
          {
            socket_id: socketId,
            channel_name: channel.name,
          },
          {
            headers: {
              Authorization: `Bearer ${token ?? ""}`,
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          },
        )
        .then((response) => {
          callback(null, response.data);
        })
        .catch((error) => {
          console.error(
            "[Echo] Auth error:",
            error.response?.status,
            error.response?.data,
          );
          callback(error);
        });
    },
  }),
});

export default echo;
