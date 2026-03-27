import { useEffect, useRef, useState } from "react";
import "./App.css";

function App() {
  const tokenClientRef = useRef(null);
  const [gapiInited, setGapiInited] = useState(false);
  const [gisInited, setGisInited] = useState(false);
  const [calendarResult, setCalendarResult] = useState([]);
  const CLIENT_ID = import.meta.env.VITE_APP_GOOGLE_CLIENT_ID;
  const API_KEY = import.meta.env.VITE_APP_API_KEY;
  const isReady = gapiInited && gisInited;
  const DISCOVERY_DOC =
    "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest";

  const SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

  useEffect(() => {
    const initGapi = () => {
      window.gapi.load("client", async () => {
        await window.gapi.client.init({
          apiKey: API_KEY,
          discoveryDocs: [DISCOVERY_DOC],
        });
        setGapiInited(true);
      });
    };

    const initGis = () => {
      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: "",
      });
      setGisInited(true);
    };

    if (window.gapi) initGapi();
    else
      document
        .querySelector('script[src*="api.js"]')
        .addEventListener("load", initGapi);

    if (window.google) initGis();
    else
      document
        .querySelector('script[src*="gsi"]')
        .addEventListener("load", initGis);
  }, []);

  function handleAuthClick() {
    tokenClientRef.current.callback = async (resp) => {
      if (resp.error !== undefined) {
        throw resp;
      }
      await listUpcomingEvents();
    };

    if (window.gapi.client.getToken() === null) {
      tokenClientRef.current.requestAccessToken({ prompt: "consent" });
    } else {
      tokenClientRef.current.requestAccessToken({ prompt: "" });
    }
  }

  async function listUpcomingEvents() {
    let response;
    try {
      const request = {
        "calendarId": "primary",
        "timeMin": new Date().toISOString(),
        "showDeleted": false,
        "singleEvents": true,
        "maxResults": 10,
        "orderBy": "startTime",
      };
      response = await gapi.client.calendar.events.list(request);
      console.log(response);
      setCalendarResult(response.result.items);
    } catch (err) {
      console.error(err);
      return;
    }
  }

  return (
    <>
      <section id="center">
        <h1>Hello World</h1>
        <button onClick={handleAuthClick} disabled={!isReady}>
          Authorize
        </button>
        {calendarResult.map((el) => {
          return (
            <>
              <span>{el.summary}</span>
            </>
          );
        })}
      </section>
    </>
  );
}

export default App;
