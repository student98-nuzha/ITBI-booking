document.addEventListener('DOMContentLoaded', async () => {
  const SUPABASE_URL = 'https://tjismtujphgldjuyfoek.supabase.co/rest/v1';
  const HEADERS = {
    apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqaXNtdHVqcGhnbGRqdXlmb2VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0OTIyMzEsImV4cCI6MjA2NjA2ODIzMX0.WsNAKO2UCRRQffqD28jkCWQ7I4dKmFywfIMrTjI-8x8',
    Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqaXNtdHVqcGhnbGRqdXlmb2VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0OTIyMzEsImV4cCI6MjA2NjA2ODIzMX0.WsNAKO2UCRRQffqD28jkCWQ7I4dKmFywfIMrTjI-8x8',
    Prefer: 'return=minimal'
  };

  const statusColors = {
    '-1': 'red',
    0: 'gray',
    1: 'blue',
    2: 'green'
  };

  let directorID = null;

  async function fetchDirectorInfo() {
    const email = localStorage.getItem("userEmail");
    if (!email) return;

    const res = await fetch(`${SUPABASE_URL}/Teachers?t_email=eq.${encodeURIComponent(email)}`, {
      headers: HEADERS
    });

    const data = await res.json();
    if (data.length > 0) {
      directorID = data[0].t_id;
    }
  }

  async function fetchRequests(endpoint) {
    const res = await fetch(`${SUPABASE_URL}/${endpoint}?select=*`, { headers: HEADERS });
    return res.ok ? await res.json() : [];
  }

  function createRequestBox(req, type) {
    const div = document.createElement('div');
    div.className = 'application-item';

    const statusColor = statusColors[req.Req_Status] || 'gray';
    const name = req.Name_of_Applicant_or_Org;
    const date = req.Date_of_Application;

    div.innerHTML = `
      <div class="status-dot" style="background:${statusColor}; position:absolute; top:5px; right:5px; width:12px; height:12px; border-radius:50%;"></div>
      <div class="application-info">
        <h3>${name} - ${date}</h3>
        <p>${type === 'aud' ? req.Event_Name : req.Guest_Name}</p>
      </div>
      <div class="application-actions">
        <button class="btn">View Details</button>
        ${req.Req_Status === 0 || req.Req_Status === 1 ? `
          <button class="btn btn-success approve-btn">Approve</button>
          <button class="btn btn-danger disapprove-btn">Disapprove</button>` : ''}
        ${req.Req_Status === 2 || req.Req_Status === -1 ? `
          <button class="btn btn-danger delete-btn">Delete</button>` : ''}
      </div>
    `;

    // Approve button
    div.querySelector('.approve-btn')?.addEventListener('click', async () => {
      await handleApproval(req, type);
      div.remove();
      addToHistory(req, type, 2); // Approved
    });

    // Disapprove button
    div.querySelector('.disapprove-btn')?.addEventListener('click', async () => {
      await handleDisapproval(req, type);
      div.remove();
      addToHistory(req, type, -1); // Disapproved
    });

    // Delete button
    div.querySelector('.delete-btn')?.addEventListener('click', async () => {
      if (confirm("Are you sure you want to delete this request?")) {
        await handleDelete(req, type);
        div.remove();
      }
    });

    return div;
  }

  function addToHistory(req, type, status) {
    req.Req_Status = status;
    const box = createRequestBox(req, type);
    document.getElementById('approvalHistory').appendChild(box);
  }

  async function handleApproval(req, type) {
    const endpoint = type === 'aud' ? 'AudReq' : 'DorReq';
    const idField = type === 'aud' ? 'AReqID' : 'DReqID';

    console.log("directorID:", directorID);
    const payload = {
      Req_Status: 2,
      Primary_Appr_By: directorID
    };

    await fetch(`${SUPABASE_URL}/${endpoint}?${idField}=eq.${req[idField]}`, {
      method: 'PATCH',
      headers: {
        ...HEADERS,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  }

  async function handleDisapproval(req, type) {
    const endpoint = type === 'aud' ? 'AudReq' : 'DorReq';
    const idField = type === 'aud' ? 'AReqID' : 'DReqID';

    const payload = {
      Req_Status: -1,
      Primary_Appr_By: null
    };

    await fetch(`${SUPABASE_URL}/${endpoint}?${idField}=eq.${req[idField]}`, {
      method: 'PATCH',
      headers: {
        ...HEADERS,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  }

  async function handleDelete(req, type) {
    const endpoint = type === 'aud' ? 'AudReq' : type === 'dor' ? 'DorReq' : null;
    const idField = type === 'aud' ? 'AReqID' : type === 'dor' ? 'DReqID' : null;

    if (!endpoint || !idField || !req[idField]) {
      console.error("Missing data for delete:", { type, endpoint, idField, req });
      alert("Cannot delete this request due to missing ID.");
      return;
    }

    const reqID = req[idField];

    const res = await fetch(`${SUPABASE_URL}/${endpoint}?${idField}=eq.${reqID}`, {
      method: 'DELETE',
      headers: HEADERS
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Delete failed:", res.status, err);
      alert("Failed to delete the request. Please check console.");
    }
  }

  function displayRequests(containerId, data, type) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    data.forEach(req => {
      const box = createRequestBox(req, type);
      container.appendChild(box);
    });
  }

  function setupScrolling() {
    const sections = document.querySelectorAll('.request-section');
    sections.forEach(section => {
      const list = section.querySelector('.application-list');
      const up = section.querySelector('.scroll-up');
      const down = section.querySelector('.scroll-down');
      if (up && down && list) {
        up.onclick = () => list.scrollBy({ top: -100, behavior: 'smooth' });
        down.onclick = () => list.scrollBy({ top: 100, behavior: 'smooth' });
      }
    });
  }

  await fetchDirectorInfo();

  const [audReqs, dorReqs] = await Promise.all([
    fetchRequests('AudReq'),
    fetchRequests('DorReq')
  ]);

  const pendingAud = audReqs.filter(r => r.Req_Status >= 0 && r.Req_Status < 2);
  const historyAud = audReqs.filter(r => r.Req_Status === 2 || r.Req_Status === -1);

  const pendingDor = dorReqs.filter(r => r.Req_Status >= 0 && r.Req_Status < 2);
  const historyDor = dorReqs.filter(r => r.Req_Status === 2 || r.Req_Status === -1);

  displayRequests('auditoriumRequests', pendingAud, 'aud');
  displayRequests('dormitoryRequests', pendingDor, 'dor');

  historyAud.forEach(req => {
    const box = createRequestBox(req, 'aud');
    document.getElementById('approvalHistory').appendChild(box);
  });

  historyDor.forEach(req => {
    const box = createRequestBox(req, 'dor');
    document.getElementById('approvalHistory').appendChild(box);
  });

  setupScrolling();
});
