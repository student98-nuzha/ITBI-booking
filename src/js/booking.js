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
  `;
  const styleTag = document.createElement('style');
  styleTag.textContent = css;
  document.head.append(styleTag);

  const userEmail = localStorage.getItem('userEmail');
  if (!userEmail) return;

  console.log(userEmail)

  const [audReqs, dorReqs] = await Promise.all([
    fetchRequests('AudReq', userEmail),
    fetchRequests('DorReq', userEmail)
  ]);

  const allReqs = [
    ...audReqs.map(r => ({ ...r, badge: 'AUD', idField: 'AReqID' })),
    ...dorReqs.map(r => ({ ...r, badge: 'DOR', idField: 'DReqID' }))
  ];

  const bookingList = document.getElementById('booking-list');
  const sidebar     = document.getElementById('my-bookings');
  if (!allReqs.length) return;

  sidebar.style.display = 'block';
  allReqs.forEach(req => {
    const card = document.createElement('div');
    card.className = 'request-item';

    // badge
    const badge = document.createElement('div');
    badge.className = `badge ${req.badge}`;  
    badge.textContent = req.badge;
    card.append(badge);

    // menu button
    const menuBtn = document.createElement('button');
    menuBtn.className   = 'menu-btn';
    menuBtn.textContent = '⋮';
    card.append(menuBtn);
    menuBtn.addEventListener('click', async e => {
      e.stopPropagation();
      if (!confirm('Delete this request?')) return;
      const table = req.badge === 'AUD' ? 'AudReq' : 'DorReq';
      const ok    = await deleteRequest(table, req.idField, req[req.idField]);
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
    card.append(header);

    // details
    const details = document.createElement('div');
    details.className = 'request-details';
    details.innerHTML = req.badge === 'AUD'
      ? `<p>Status: ${getStatusText(req.Req_Status)}</p><p>Attendees: ${req.Exp_Attendee_Count}</p>`
      : `<p>Status: ${getStatusText(req.Req_Status)}</p><p>Departure: ${req.Dep_Date}</p>`;
    card.append(details);

    // expand on click
    card.addEventListener('click', () => card.classList.toggle('expanded'));

    bookingList.append(card);
  });


    const userType = localStorage.getItem('userType'); 
  const nav = document.querySelector('nav ul');
  if (!userType || !nav) return;

  const li = document.createElement('li');
  console.log(userType)
  if (userType === 'director' || userEmail === 'u2104076@student.cuet.ac.bd') {
    li.innerHTML = `<a href="director-panel.html">Director Panel</a>`;
    nav.appendChild(li);
  } else if (userType === 'admin') {
    li.innerHTML = `<a href="admin-panel.html">Admin Panel</a>`;
    nav.appendChild(li);
  } else if (userType === 'teacher') {
    li.innerHTML = `<a href="student-panel.html">Teacher Panel</a>`;
    nav.appendChild(li);
  }
});


function showToast(msg) {
  let c = document.querySelector('.toast-container');
  if (!c) {
    c = document.createElement('div');
    c.className = 'toast-container';
    document.body.append(c);
  }
  const t = document.createElement('div');
  t.className   = 'toast';
  t.textContent = msg;
  c.append(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => {
    t.classList.remove('show');
    t.addEventListener('transitionend', () => t.remove(), { once: true });
  }, 3000);
}

async function fetchRequests(table, email) {
  const supabaseUrl = 'https://tjismtujphgldjuyfoek.supabase.co';
  const anonKey     = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqaXNtdHVqcGhnbGRqdXlmb2VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0OTIyMzEsImV4cCI6MjA2NjA2ODIzMX0.WsNAKO2UCRRQffqD28jkCWQ7I4dKmFywfIMrTjI-8x8';
  const resp = await fetch(
    `${supabaseUrl}/rest/v1/${table}?Email=eq.${encodeURIComponent(email)}`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` }
    }
  );
  return resp.ok ? resp.json() : [];
}

async function deleteRequest(table, idField, id) {
  const supabaseUrl = 'https://tjismtujphgldjuyfoek.supabase.co';
  const anonKey     = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqaXNtdHVqcGhnbGRqdXlmb2VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0OTIyMzEsImV4cCI6MjA2NjA2ODIzMX0.WsNAKO2UCRRQffqD28jkCWQ7I4dKmFywfIMrTjI-8x8';
  const resp = await fetch(
    `${supabaseUrl}/rest/v1/${table}?${idField}=eq.${id}`, {
      method: 'DELETE',
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` }
    }
  );
  return resp.ok;
}


function getStatusText(s) {
  return { 0:'Pending',1:'Approved',2:'Rejected' }[s] || 'Unknown';
}



