document.addEventListener('DOMContentLoaded', async () => {
  const userEmail = localStorage.getItem('userEmail');
  if (!userEmail) return;

  // Fetch both Aud and Dor requests
  const [audReqs, dorReqs] = await Promise.all([
    fetchRequests('AudReq', userEmail),
    fetchRequests('DorReq', userEmail)
  ]);

  const allReqs = [
    ...audReqs.map(r => ({ ...r, badge: 'AUD' })),
    ...dorReqs.map(r => ({ ...r, badge: 'DOR' }))
  ];

  const bookingList = document.getElementById('booking-list');
  const sidebar = document.getElementById('my-bookings');

  if (allReqs.length) {
    sidebar.style.display = 'block';
    allReqs.forEach(req => {
      const card = document.createElement('div');
      card.className = 'request-item';
      card.setAttribute('data-badge', req.badge);

      // Header
      const header = document.createElement('div');
      header.className = 'request-header';
      header.innerHTML = `
        <strong>${req.badge === 'AUD' ? req.Event_Name : req.Guest_Name}</strong>
        <span>${req.badge === 'AUD' ? req.Date_of_Event : req.Arr_Date}</span>
      `;
      card.append(header);

      // Details
      const details = document.createElement('div');
      details.className = 'request-details';
      details.innerHTML = req.badge === 'AUD'
        ? `<p>Status: ${getStatusText(req.Req_Status)}</p><p>Attendees: ${req.Exp_Attendee_Count}</p>`
        : `<p>Status: ${getStatusText(req.Req_Status)}</p><p>Departure: ${req.Dep_Date}</p>`;
      card.append(details);

      // Toggle expand
      card.addEventListener('click', () => card.classList.toggle('expanded'));

      bookingList.append(card);
    });
  }
});

// Helper to fetch from Supabase REST
async function fetchRequests(table, email) {
  const supabaseUrl = 'https://tjismtujphgldjuyfoek.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqaXNtdHVqcGhnbGRqdXlmb2VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0OTIyMzEsImV4cCI6MjA2NjA2ODIzMX0.WsNAKO2UCRRQffqD28jkCWQ7I4dKmFywfIMrTjI-8x8';
  const url = `${supabaseUrl}/rest/v1/${table}?Email=eq.${encodeURIComponent(email)}`;
  const resp = await fetch(url, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`
    }
  });
  return resp.ok ? await resp.json() : [];
}

function getStatusText(status) {
  const statusMap = { 0: 'Pending', 1: 'Approved', 2: 'Rejected' };
  return statusMap[status] || 'Unknown';
}