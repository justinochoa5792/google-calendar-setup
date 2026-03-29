import { useEffect, useRef, useState } from "react";
import "./App.css";

function App() {
  const tokenClientRef = useRef(null);
  const [gapiInited, setGapiInited] = useState(false);
  const [gisInited, setGisInited] = useState(false);
  const [createdEvents, setCreatedEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({ summary: "", start: "", end: "" });

  const CLIENT_ID = import.meta.env.VITE_APP_GOOGLE_CLIENT_ID;
  const API_KEY = import.meta.env.VITE_APP_API_KEY;
  const DISCOVERY_DOC =
    "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest";
  const SCOPES = "https://www.googleapis.com/auth/calendar";
  const isReady = gapiInited && gisInited;

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
      if (resp.error !== undefined) throw resp;
      console.log("auth success"); // add this
      await listInterviews();
    };

    if (window.gapi.client.getToken() === null) {
      tokenClientRef.current.requestAccessToken({ prompt: "consent" });
    } else {
      tokenClientRef.current.requestAccessToken({ prompt: "" });
    }
  }

  async function listInterviews() {
    try {
      const response = await window.gapi.client.calendar.events.list({
        calendarId: "primary",
        timeMin: new Date().toISOString(),
        showDeleted: false,
        singleEvents: true,
        orderBy: "startTime",
        privateExtendedProperty: "type=interview",
      });
      setCreatedEvents(response.result.items || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function createEvent() {
    try {
      const event = {
        summary: newEvent.summary,
        start: {
          dateTime: new Date(newEvent.start).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: new Date(newEvent.end).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        extendedProperties: {
          private: { type: "interview" },
        },
      };

      await window.gapi.client.calendar.events.insert({
        calendarId: "primary",
        resource: event,
      });

      await listInterviews();
      setNewEvent({ summary: "", start: "", end: "" });
    } catch (err) {
      console.error("Error creating event:", err);
    }
  }

  return (
    <>
      <section id="center">
        <h1>Hello World</h1>
        <button onClick={handleAuthClick} disabled={!isReady}>
          Authorize
        </button>

        <input
          type="text"
          placeholder="Event title"
          value={newEvent.summary}
          onChange={(e) =>
            setNewEvent({ ...newEvent, summary: e.target.value })
          }
        />
        <input
          type="datetime-local"
          value={newEvent.start}
          onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })}
        />
        <input
          type="datetime-local"
          value={newEvent.end}
          onChange={(e) => setNewEvent({ ...newEvent, end: e.target.value })}
        />
        <button onClick={createEvent} disabled={!isReady}>
          Create Event
        </button>

        {createdEvents.length === 0 ? (
          <p>No interviews scheduled</p>
        ) : (
          createdEvents.map((event) => (
            <div key={event.id}>
              <p>
                <strong>{event.summary}</strong>
              </p>
              <p>Start: {event.start.dateTime}</p>
              <p>End: {event.end.dateTime}</p>
            </div>
          ))
        )}
      </section>
    </>
  );
}

export default App;
