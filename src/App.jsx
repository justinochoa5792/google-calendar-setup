import { useEffect, useRef, useState } from "react";
import "./App.css";

function App() {
  const tokenClientRef = useRef(null);
  const [gapiInited, setGapiInited] = useState(false);
  const [gisInited, setGisInited] = useState(false);
  const CLIENT_ID = import.meta.env.VITE_APP_GOOGLE_CLIENT_ID;
  const API_KEY = import.meta.env.VITE_APP_API_KEY;

  const DISCOVERY_DOC =
    "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest";

  const SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

  let tokenClient;

  function gapiLoaded() {
    gapi.load("client", initializeGapiClient);
  }

  useEffect(() => {
    const initGapi = () => {
      window.gapi.load("client", async () => {
        await window.gapi.client.init({
          apiKey: API_KEY,
          discoveryDocs: [
            "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
          ],
        });
        setGapiInited(true);
      });
    };

    const initGis = () => {
      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: "https://www.googleapis.com/auth/calendar",
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
    tokenClient.callback = async (resp) => {
      if (resp.error !== undefined) {
        throw resp;
      }
      // document.getElementById("signout_button").style.visibility = "visible";
      // document.getElementById("authorize_button").innerText = "Refresh";
      await listUpcomingEvents();
    };

    if (gapi.client.getToken() === null) {
      // Prompt the user to select a Google Account and ask for consent to share their data
      // when establishing a new session.
      tokenClient.requestAccessToken({
        prompt: "consent",
      });
    } else {
      // Skip display of account chooser and consent dialog for an existing session.
      tokenClient.requestAccessToken({
        prompt: "",
      });
    }
  }

  function handleSignoutClick() {
    const token = gapi.client.getToken();
    if (token !== null) {
      google.accounts.oauth2.revoke(token.access_token);
      gapi.client.setToken("");
      // document.getElementById("content").innerText = "";
      // document.getElementById("authorize_button").innerText = "Authorize";
      // document.getElementById("signout_button").style.visibility = "hidden";
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
    } catch (err) {
      // document.getElementById("content").innerText = err.message;
      return;
    }

    const events = response.result.items;
    // if (!events || events.length == 0) {
    //   document.getElementById("content").innerText = "No events found.";
    //   return;
    // }
    // Flatten to string to display
    const output = events.reduce(
      (str, event) =>
        `${str}${event.summary} (${event.start.dateTime || event.start.date})\n`,
      "Events:\n",
    );
    // document.getElementById("content").innerText = output;
  }

  return (
    <>
      <section id="center">
        <h1>Hello World</h1>
        <button onClick={handleAuthClick}>Authorize</button>
      </section>
    </>
  );
}

export default App;
