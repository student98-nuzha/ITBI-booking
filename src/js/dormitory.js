const SUPABASE_URL = 'https://tjismtujphgldjuyfoek.supabase.co';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqaXNtdHVqcGhnbGRqdXlmb2VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0OTIyMzEsImV4cCI6MjA2NjA2ODIzMX0.WsNAKO2UCRRQffqD28jkCWQ7I4dKmFywfIMrTjI-8x8';

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

  if (userEmail) {
    const emailInput = document.getElementById('email');
    if (emailInput) emailInput.value = userEmail;
  }

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

    const data = {
      Date_of_Application: document.getElementById('application_date').value,
      Desg_Org: document.getElementById('designation').value.trim(),
      Name_of_Applicant_or_Org: document.getElementById('applicant_name').value.trim(),
      Contact_Num: document.getElementById('contact_number').value.trim(),
      Guest_Name: document.getElementById('guest_name').value.trim(),
      Rel_with_Applicant: document.getElementById('relation').value.trim(),
      Arr_Date: document.getElementById('arrival_date').value,
      Dep_Date: document.getElementById('departure_date').value,
      Air_Con: document.getElementById('ac_yes').checked,
      Personal: document.getElementById('personal_yes').checked,
      Email: document.getElementById('email').value.trim(),
      Req_Status: 0
    };

    const refEl = document.getElementById('referred_by');
    if (refEl) {
      const email = refEl.value.trim();
  
      const url = `${SUPABASE_URL}/rest/v1/Teachers?t_email=eq.${encodeURIComponent(email)}`;
      const resp = await fetch(url, { headers: HEADERS });
      const teachers = await resp.json();
      if (!Array.isArray(teachers) || teachers.length === 0) {
        alert('Invalid referred-by email.');
        return;
      }
      data.Referred_By = teachers[0].t_id;
    }

    const insertUrl = `${SUPABASE_URL}/rest/v1/DorReq`;
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
    
    window.location.href = 'confirmation.html';
  });
});