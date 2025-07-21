const SUPABASE_URL = 'https://tjismtujphgldjuyfoek.supabase.co';
const SUPABASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqaXNtdHVqcGhnbGRqdXlmb2VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0OTIyMzEsImV4cCI6MjA2NjA2ODIzMX0.WsNAKO2UCRRQffqD28jkCWQ7I4dKmFywfIMrTjI-8x8';

const HEADERS = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_API_KEY,
  'Authorization': `Bearer ${SUPABASE_API_KEY}`,
  'Prefer': 'return=representation'
};

const applicationId = 1;

async function fetchApplicationData(id) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/DorReq?DReqID=eq.${id}&select=*`, {
    method: 'GET',
    headers: HEADERS
  });

  const data = await response.json();
  return data[0]; 
}

function populateApplicationHTML(app) {
  const container = document.getElementById('application-info');
  container.innerHTML = `
    <h2>Application Summary</h2>
    <p><strong>Name of Applicant/Org:</strong> ${app.Name_of_Applicant_or_Org}</p>
    <p><strong>Guest Name:</strong> ${app.Guest_Name}</p>
    <p><strong>Relationship with Applicant:</strong> ${app.Rel_with_Applicant}</p>
    <p><strong>Designation/Organization:</strong> ${app.Desg_Org}</p>
    <p><strong>Email:</strong> ${app.Email}</p>
    <p><strong>Contact Number:</strong> ${app.Contact_Num}</p>
    <p><strong>Arrival Date:</strong> ${app.Arr_Date}</p>
    <p><strong>Departure Date:</strong> ${app.Dep_Date}</p>
    <p><strong>Date of Application:</strong> ${app.Date_of_Application}</p>
    <p><strong>Room Type:</strong> ${app.Air_Con ? "Air Conditioned" : "Non-AC"}</p>
    <p><strong>Personal Stay:</strong> ${app.Personal ? "Yes" : "No"}</p>
    <p><strong>Status:</strong> ${statusLabel(app.Req_Status)}</p>
  `;
}

function statusLabel(code) {
  switch(code) {
    case 0: return "Pending";
    case 1: return "Approved";
    case 2: return "Rejected";
    default: return "Unknown";
  }
}

async function downloadPDF() {
  const element = document.getElementById('application-info');
  element.style.display = 'block';

  const appData = await fetchApplicationData(applicationId);
  populateApplicationHTML(appData);

  const opt = {
    margin:       0.5,
    filename:     `application_${applicationId}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save().then(() => {
    element.style.display = 'none';
  });
}