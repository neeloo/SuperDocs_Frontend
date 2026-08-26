import { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:8080/api";
function App() {

  const [document, setDocument] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [events, setEvents] = useState([]);

  const [field, setField] = useState("budget");
  const [oldValue, setOldValue] = useState("10000");
  const [newValue, setNewValue] = useState("");

  const [writer, setWriter] = useState("WRITER-A");

  useEffect(() => {
    loadDocument();
    loadEvents();
    loadConflicts();

    const interval = setInterval(() => {
      loadDocument();
      loadEvents();
      loadConflicts();
    }, 2000);

    return () => clearInterval(interval);

  }, []);

  async function loadDocument() {

    const response =await fetch(`${API}/documents/1`);

    const data = await response.json();

    setDocument(data);
  }

  async function loadEvents() {

    const response =await fetch(`${API}/documents/1/events?afterVersion=0`);

    const data = await response.json();

    setEvents(data);
  }

  async function loadConflicts() {

    const response =await fetch(`${API}/conflicts/document/1`);

    const data = await response.json();

    setConflicts(data);
  }

  async function submitEdit() {

    if (!document) return;
    const response =await fetch(`${API}/documents/1/edits`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          writerId: writer,
          baseVersion: document.version,
          fieldName: field,
          oldValue: oldValue,
          newValue: newValue
        })
      });

    const result = await response.text();
    alert(result);
    loadDocument();
    loadEvents();
    loadConflicts();
  }

  async function resolveConflict(conflictId,decision) {
    await fetch(`${API}/conflicts/${conflictId}/resolve`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json"},
        body: JSON.stringify({
          decision: decision
        })
      }
    );

    loadDocument();
    loadConflicts();
  }
  if (!document) {
    return (<div className="container"> Loading...</div> );
  }

  return (
    <div className="container">
      <h1>Soft Collaboration Reconciler</h1>
      <div className="document-header">
        <h2>{document.name}</h2>
        <span> Version: {document.version}</span>
      </div>
      <div className="card">
        <h3>Current Document</h3>
        <pre>{document.content}</pre>
      </div>
      <div className="card">
        <h3>Make Edit</h3>
        <select value={writer} onChange={(e) => setWriter(e.target.value) }>
          <option value="WRITER-A">Writer A</option>
          <option value="WRITER-B"> Writer B</option>
        </select>

        <input value={field} onChange={(e) =>setField(e.target.value)}placeholder="Field"/> <input
          value={oldValue}
          onChange={(e) =>
            setOldValue(e.target.value)
          }
          placeholder="Old value"
        />
        <input
          value={newValue}
          onChange={(e) =>
            setNewValue(e.target.value)
          }
          placeholder="New value"
        />

        <button onClick={submitEdit}>Submit Edit  </button>

      </div>

      <div className="card">

        <h3>Incoming Changes</h3>
        {events.map(event => (

          <div
            className="event"
            key={event.id}
          >

            <strong>
              {event.writerId}
            </strong>

            <p>
              {event.fieldName}
            </p>

            <p>
              {event.oldValue}
              {" → "}
              {event.newValue}
            </p>

            <small>
              Version {event.baseVersion}
              {" → "}
              {event.newVersion}
            </small>

          </div>

        ))}

      </div>

      <div className="card">

        <h3>Conflict Queue</h3>

        {conflicts.length === 0 && (
          <p>No conflicts</p>
        )}

        {conflicts.map(conflict => (

          <div
            className="conflict"
            key={conflict.id}
          >

            <h4>
              Conflict: {conflict.fieldName}
            </h4>

            <p>
              Your value:
              <strong>
                {" "}{conflict.localValue}
              </strong>
            </p>

            <p>
              Remote value:
              <strong>
                {" "}{conflict.remoteValue}
              </strong>
            </p>

            <button
              onClick={() =>
                resolveConflict(
                  conflict.id,
                  "ACCEPT_LOCAL"
                )
              }
            >
              Accept Mine
            </button>

            <button
              onClick={() =>
                resolveConflict(
                  conflict.id,
                  "ACCEPT_REMOTE"
                )
              }
            >
              Accept Remote
            </button>

          </div>

        ))}

      </div>

    </div>
  );
}

export default App;