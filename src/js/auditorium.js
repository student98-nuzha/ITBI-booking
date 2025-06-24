// auditorium.js
// Ensure you include this in HTML before:<script src="../js/auditorium.js"></script>

// Supabase REST API credentials
const SUPABASE_URL = 'https://tjismtujphgldjuyfoek.supabase.co';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqaXNtdHVqcGhnbGRqdXlmb2VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0OTIyMzEsImV4cCI6MjA2NjA2ODIzMX0.WsNAKO2UCRRQffqD28jkCWQ7I4dKmFywfIMrTjI-8x8';

// Common fetch headers for Supabase REST
const HEADERS = {
  'Content-Type': 'application/json',
  'apikey': API_KEY,
  'Authorization': `Bearer ${API_KEY}`,
  'Prefer': 'return=representation'
};

document.addEventListener('DOMContentLoaded', () => {
  const userType = localStorage.getItem('userType');
  const userEmail = localStorage.getItem('userEmail');
  const form = document.querySelector('form');
  const submitBtn = form.querySelector('button[type="submit"]');

  // Auto-fill email field
  if (userEmail) {
    const emailInput = document.getElementById('email');
    if (emailInput) emailInput.value = userEmail;
  }

  // Dynamically add "Referred by" for students/staff
  if (userType === 'student' || userType === 'staff') {
    const wrapper = document.createElement('div');
    wrapper.className = 'form-group';

    const label = document.createElement('label');
    label.htmlFor = 'referred_by';
    label.textContent = 'Referred by *';

    const input = document.createElement('input');
    input.type = 'email';
    input.id = 'referred_by';
    input.name = 'referred_by';
    input.placeholder = 'someone@cuet.ac.bd';
    input.required = true;
    input.pattern = '^[a-zA-Z0-9._%+-]+@cuet\\.ac\\.bd$';

    wrapper.append(label, input);
    submitBtn.insertAdjacentElement('beforebegin', wrapper);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Collect form data
    const data = {
      Date_of_Application: document.getElementById('application_date').value,
      Desg_Org: document.getElementById('Designation').value.trim(),
      Email: document.getElementById('email').value.trim(),
      Name_of_Applicant_or_Org: document.getElementById('applicant_name').value.trim(),
      Contact_Num: document.getElementById('contact_number').value.trim(),
      Event_Name: document.getElementById('event_name').value.trim(),
      Exp_Attendee_Count: parseInt(document.getElementById('attendees').value, 10),
      Date_of_Event: document.getElementById('event_date').value,
      St_Time: document.getElementById('start_time').value,
      En_Time: document.getElementById('end_time').value,
      Event_Desc: document.getElementById('event_description').value.trim(),
      Special_Requirements: document.getElementById('special_requirements').value.trim() || null,
      Req_Status: 0
    };

    // Handle referred_by lookup if present
    const refEl = document.getElementById('referred_by');
    if (refEl) {
      const email = refEl.value.trim();
      // GET teacher by email
      const url = `${SUPABASE_URL}/rest/v1/Teachers?t_email=eq.${encodeURIComponent(email)}`;
      const resp = await fetch(url, { headers: HEADERS });
      const teachers = await resp.json();
      if (!Array.isArray(teachers) || teachers.length === 0) {
        alert('Invalid referred-by email.');
        return;
      }
      data.Referred_By = teachers[0].t_id;
    }

    // POST to AudReq table
    const insertUrl = `${SUPABASE_URL}/rest/v1/AudReq`;
    const insertResp = await fetch(insertUrl, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(data)
    });

    if (!insertResp.ok) {
      console.error('Insert failed:', await insertResp.text());
      alert('Submission failed. Please try again.');
      return;
    }

    // Redirect on success
    window.location.href = 'booking.html';
  });
});
