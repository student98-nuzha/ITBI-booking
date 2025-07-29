document.addEventListener('DOMContentLoaded', async () => {
  const css = `
    .request-item {
      position: relative;
      padding: 20px 10px 10px;
      margin-bottom: 12px;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .request-item .badge {
      position: absolute;
      top: 8px;
      left: 8px;
      padding: 2px 6px;
      font-size: 12px;
      font-weight: bold;
      border-radius: 4px;
      color: #fff;
    }
    .request-item .badge.AUD { background: #FF8C00; }   /* Orange for AUD */
    .request-item .badge.DOR { background: #28A745; }   /* Green for DOR */
    .request-item .request-header {
      margin-top: 24px;
      display: flex;
      justify-content: space-between;
      font-size: 16px;
    }
    .request-item .request-details {
      margin-top: 6px;
      font-size: 14px;
      color: #555;
    }
    .request-item .menu-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      background: transparent;
      border: none;
      cursor: pointer;
      font-size: 18px;
      line-height: 1;
      color: #333;
    }
    .toast-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
    }
    .toast {
      background: rgba(0, 0, 0, 0.8);
      color: #fff;
      padding: 10px 14px;
      margin-top: 8px;
      border-radius: 6px;
      min-width: 150px;
      font-size: 14px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.3s ease, transform 0.3s ease;
    }
    .toast.show {
      opacity: 1;
      transform: translateY(0);
    }
    .request-actions {
      margin-top: 10px;
      display: flex;
      gap: 10px;
    }
    .request-actions button {
      padding: 8px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    .approve-btn {
      background: #28A745;
      color: #fff;
    }
    .reject-btn {
      background: #DC3545;
      color: #fff;
    }
    .details-btn {
      background: #007BFF;
      color: #fff;
    }
  `;
  const styleTag = document.createElement('style');
  styleTag.textContent = css;
  document.head.appendChild(styleTag);

  const userEmail = localStorage.getItem('userEmail');
  const userType = localStorage.getItem('userType');
  if (!userEmail) {
    showToast('No user email provided.');
    return;
  }

  console.log('User Email:', userEmail);

  const [audReqs, dorReqs] = await Promise.all([
    fetchRequests('AudReq', userEmail),
    fetchRequests('DorReq', userEmail)
  ]);

  const allReqs = [
    ...audReqs.map(r => ({ ...r, badge: 'AUD', idField: 'AReqID' })),
    ...dorReqs.map(r => ({ ...r, badge: 'DOR', idField: 'DReqID' }))
  ];

  const bookingList = document.getElementById('booking-list');
  const sidebar = document.getElementById('my-bookings');
  if (allReqs.length) {
    sidebar.style.display = 'block';
    allReqs.forEach(req => {
      const card = document.createElement('div');
      card.className = 'request-item';

      // badge
      const badge = document.createElement('div');
      badge.className = `badge ${req.badge}`;
      badge.textContent = req.badge;
      card.appendChild(badge);

      // menu button
      const menuBtn = document.createElement('button');
      menuBtn.className = 'menu-btn';
      menuBtn.textContent = '⋮';
      card.appendChild(menuBtn);
      menuBtn.addEventListener('click', async e => {
        e.stopPropagation();
        if (!confirm('Delete this request?')) return;
        const table = req.badge === 'AUD' ? 'AudReq' : 'DorReq';
        const ok = await deleteRequest(table, req.idField, req[req.idField]);
        if (ok) {
          card.remove();
          showToast('Request deleted');
        } else {
          showToast('Delete failed');
        }
      });

      // header
      const header = document.createElement('div');
      header.className = 'request-header';
      header.innerHTML = `
        <strong>${req.badge === 'AUD' ? req.Event_Name : req.Guest_Name}</strong>
        <span>${req.badge === 'AUD' ? req.Date_of_Event : req.Arr_Date}</span>
      `;
      card.appendChild(header);

      // details
      const details = document.createElement('div');
      details.className = 'request-details';
      details.innerHTML = req.badge === 'AUD'
        ? `<p>Status: ${getStatusText(req.Req_Status)}</p><p>Attendees: ${req.Exp_Attendee_Count}</p>`
        : `<p>Status: ${getStatusText(req.Req_Status)}</p><p>Departure: ${req.Dep_Date}</p>`;
      card.appendChild(details);

      // expand on click
      card.addEventListener('click', () => card.classList.toggle('expanded'));

      bookingList.appendChild(card);
    });
  } else {
    showToast('No bookings found for this user.');
  }

  // Handle My Requests for all users
  const requestList = document.getElementById('request-list');
  const requestSidebar = document.getElementById('my-requests');

  // Fetch all pending requests that either:
  // - Were referred by this user's email
  // - Or where this user is the requester
  const [audPendingReqs, dorPendingReqs] = await Promise.all([
    fetchPendingRequestsForUser('AudReq', userEmail),
    fetchPendingRequestsForUser('DorReq', userEmail)
  ]);

  const allPendingReqs = [
    ...audPendingReqs.map(r => ({ ...r, badge: 'AUD', idField: 'AReqID' })),
    ...dorPendingReqs.map(r => ({ ...r, badge: 'DOR', idField: 'DReqID' }))
  ];

  if (allPendingReqs.length) {
    requestSidebar.style.display = 'block';
    allPendingReqs.forEach(req => {
      const card = document.createElement('div');
      card.className = 'request-item';

      // badge
      const badge = document.createElement('div');
      badge.className = `badge ${req.badge}`;
      badge.textContent = req.badge;
      card.appendChild(badge);

      // header
      const header = document.createElement('div');
      header.className = 'request-header';
      header.innerHTML = `
        <strong>${req.badge === 'AUD' ? req.Event_Name : req.Guest_Name}</strong>
        <span>${req.badge === 'AUD' ? req.Date_of_Event : req.Arr_Date}</span>
      `;
      card.appendChild(header);

      // details
      const details = document.createElement('div');
      details.className = 'request-details';
      details.innerHTML = `
        <p>Status: ${getStatusText(req.Req_Status)}</p>
        <p>Email: ${req.Email}</p>
        <p>Referred By: ${req.Referred_By || 'None'}</p>
        ${req.badge === 'AUD' ? `<p>Attendees: ${req.Exp_Attendee_Count}</p>` : `<p>Departure: ${req.Dep_Date}</p>`}
      `;
      card.appendChild(details);

      // actions
      const actions = document.createElement('div');
      actions.className = 'request-actions';
      const approveBtn = document.createElement('button');
      approveBtn.className = 'approve-btn';
      approveBtn.textContent = 'Approve';
      approveBtn.addEventListener('click', () => updateRequestStatus(req.badge, req.idField, req[req.idField], 1));

      const rejectBtn = document.createElement('button');
      rejectBtn.className = 'reject-btn';
      rejectBtn.textContent = 'Reject';
      rejectBtn.addEventListener('click', () => updateRequestStatus(req.badge, req.idField, req[req.idField], -1));

      const detailsBtn = document.createElement('button');
      detailsBtn.className = 'details-btn';
      detailsBtn.textContent = 'View Details';
      detailsBtn.addEventListener('click', () => viewRequestDetails(req.badge, req[req.idField]));

      actions.appendChild(approveBtn);
      actions.appendChild(rejectBtn);
      actions.appendChild(detailsBtn);
      card.appendChild(actions);

      requestList.appendChild(card);
    });
  } else {
    showToast('No pending requests found for this user.');
  }

  // Navigation for user types
  const nav = document.querySelector('nav ul');
  if (!userType || !nav) return;

  const li = document.createElement('li');
  console.log('User Type:', userType);
  if (userType === 'director') {
    li.innerHTML = `<a href="director-panel.html">Director Panel</a>`;
    nav.appendChild(li);
  } else if (userType === 'admin' || userEmail === 'u2104076@student.cuet.ac.bd') {
    li.innerHTML = `<a href="admin-panel.html">Admin Panel</a>`;
    nav.appendChild(li);
  } else if (userType === 'teacher') {
    li.innerHTML = `<a href="teacher-panel.html">Teacher Panel</a>`;
    nav.appendChild(li);
  }
});

function showToast(msg) {
  let c = document.querySelector('.toast-container');
  if (!c) {
    c = document.createElement('div');
    c.className = 'toast-container';
    document.body.appendChild(c);
  }
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  c.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => {
    t.classList.remove('show');
    t.addEventListener('transitionend', () => t.remove(), { once: true });
  }, 3000);
}

async function fetchRequests(table, email) {
  const supabaseUrl = 'https://tjismtujphgldjuyfoek.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqaXNtdHVqcGhnbGRqdXlmb2VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0OTIyMzEsImV4cCI6MjA2NjA2ODIzMX0.WsNAKO2UCRRQffqD28jkCWQ7I4dKmFywfIMrTjI-8x8';
  const resp = await fetch(
    `${supabaseUrl}/rest/v1/${table}?Email=eq.${encodeURIComponent(email)}`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` }
    }
  );
  return resp.ok ? await resp.json() : [];
}

async function fetchPendingRequests(table) {
  const supabaseUrl = 'https://tjismtujphgldjuyfoek.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqaXNtdHVqcGhnbGRqdXlmb2VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0OTIyMzEsImV4cCI6MjA2NjA2ODIzMX0.WsNAKO2UCRRQffqD28jkCWQ7I4dKmFywfIMrTjI-8x8';
  const resp = await fetch(
    `${supabaseUrl}/rest/v1/${table}?Req_Status=eq.0`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` }
    }
  );
  return resp.ok ? await resp.json() : [];
}

async function fetchPendingRequestsForUser(table, email) {
  const supabaseUrl = 'https://tjismtujphgldjuyfoek.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqaXNtdHVqcGhnbGRqdXlmb2VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0OTIyMzEsImV4cCI6MjA2NjA2ODIzMX0.WsNAKO2UCRRQffqD28jkCWQ7I4dKmFywfIMrTjI-8x8';
  const query = `or=(Referred_By.eq.${encodeURIComponent(email)},Email.eq.${encodeURIComponent(email)})`;
  const resp = await fetch(
    `${supabaseUrl}/rest/v1/${table}?Req_Status=eq.0&${query}`, {
      headers: { 
        apikey: anonKey, 
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    }
  );
  if (!resp.ok) {
    console.error(`Failed to fetch pending requests for ${table}:`, resp.statusText);
    return [];
  }
  return await resp.json();
}

async function isTeacher(email) {
  const supabaseUrl = 'https://tjismtujphgldjuyfoek.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqaXNtdHVqcGhnbGRqdXlmb2VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0OTIyMzEsImV4cCI6MjA2NjA2ODIzMX0.WsNAKO2UCRRQffqD28jkCWQ7I4dKmFywfIMrTjI-8x8';
  const resp = await fetch(
    `${supabaseUrl}/rest/v1/teachers?Email=eq.${encodeURIComponent(email)}`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` }
    }
  );
  if (resp.ok) {
    const data = await resp.json();
    return data.length > 0;
  }
  return false;
}

async function deleteRequest(table, idField, id) {
  const supabaseUrl = 'https://tjismtujphgldjuyfoek.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqaXNtdHVqcGhnbGRqdXlmb2VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0OTIyMzEsImV4cCI6MjA2NjA2ODIzMX0.WsNAKO2UCRRQffqD28jkCWQ7I4dKmFywfIMrTjI-8x8';
  const resp = await fetch(
    `${supabaseUrl}/rest/v1/${table}?${idField}=eq.${id}`, {
      method: 'DELETE',
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` }
    }
  );
  return resp.ok;
}

async function updateRequestStatus(table, idField, id, status) {
  const supabaseUrl = 'https://tjismtujphgldjuyfoek.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqaXNtdHVqcGhnbGRqdXlmb2VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0OTIyMzEsImV4cCI6MjA2NjA2ODIzMX0.WsNAKO2UCRRQffqD28jkCWQ7I4dKmFywfIMrTjI-8x8';
  const resp = await fetch(
    `${supabaseUrl}/rest/v1/${table}?${idField}=eq.${id}`, {
      method: 'PATCH',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ Req_Status: status })
    }
  );
  if (resp.ok) {
    showToast(status === 1 ? 'Request approved' : 'Request rejected');
    setTimeout(() => location.reload(), 1000);
  } else {
    showToast('Action failed');
  }
}

function viewRequestDetails(table, id) {
  showToast(`Viewing details for ${table} request ID: ${id}`);
  // Implement actual details view logic here (e.g., redirect to a details page or show a modal)
}

function getStatusText(s) {
  return { 0: 'Pending', 1: 'Referral Approved', 2: 'Rejected' }[s] || 'Unknown';
}