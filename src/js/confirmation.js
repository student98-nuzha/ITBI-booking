const SUPABASE_URL = 'https://tjismtujphgldjuyfoek.supabase.co';
const SUPABASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqaXNtdHVqcGhnbGRqdXlmb2VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0OTIyMzEsImV4cCI6MjA2NjA2ODIzMX0.WsNAKO2UCRRQffqD28jkCWQ7I4dKmFywfIMrTjI-8x8';

const HEADERS = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_API_KEY,
  'Authorization': `Bearer ${SUPABASE_API_KEY}`,
  'Prefer': 'return=representation'
};

async function fetchApplicationData(id) {
  try {
    let response = await fetch(`${SUPABASE_URL}/rest/v1/DorReq?DReqID=eq.${id}&select=*`, {
      method: 'GET',
      headers: HEADERS
    });
    let data = await response.json();
    if (data && data.length > 0) {
      return { type: 'dormitory', data: data[0] };
    }

    response = await fetch(`${SUPABASE_URL}/rest/v1/AudReq?AReqID=eq.${id}&select=*`, {
      method: 'GET',
      headers: HEADERS
    });
    data = await response.json();
    if (data && data.length > 0) {
      return { type: 'auditorium', data: data[0] };
    }

    throw new Error('No application found');
  } catch (error) {
    console.error('Error fetching application:', error);
    return null;
  }
}

function populateApplicationHTML(app) {
  if (!app || !app.data) {
    document.getElementById('application-info').innerHTML = `
      <div style="text-align: center; padding: 20px;">
        <h2>Application Not Found</h2>
        <p>Please check your application ID or try again later.</p>
        <a href="booking.html" class="btn">Back to Booking</a>
      </div>
    `;
    return;
  }

  const container = document.getElementById('application-info');
  if (app.type === 'dormitory') {
    container.innerHTML = `
      <h2>Dormitory Application Summary</h2>
      <p><strong>Name of Applicant/Org:</strong> ${app.data.Name_of_Applicant_or_Org}</p>
      <p><strong>Guest Name:</strong> ${app.data.Guest_Name}</p>
      <p><strong>Relationship with Applicant:</strong> ${app.data.Rel_with_Applicant}</p>
      <p><strong>Designation/Organization:</strong> ${app.data.Desg_Org}</p>
      <p><strong>Email:</strong> ${app.data.Email}</p>
      <p><strong>Contact Number:</strong> ${app.data.Contact_Num}</p>
      <p><strong>Arrival Date:</strong> ${app.data.Arr_Date}</p>
      <p><strong>Departure Date:</strong> ${app.data.Dep_Date}</p>
      <p><strong>Date of Application:</strong> ${app.data.Date_of_Application}</p>
      <p><strong>Room Type:</strong> ${app.data.Air_Con ? "Air Conditioned" : "Non-AC"}</p>
      <p><strong>Personal Stay:</strong> ${app.data.Personal ? "Yes" : "No"}</p>
      <p><strong>Status:</strong> ${statusLabel(app.data.Req_Status)}</p>
    `;
  } else {
    container.innerHTML = `
      <h2>Auditorium Application Summary</h2>
      <p><strong>Name of Applicant/Org:</strong> ${app.data.Name_of_Applicant_or_Org}</p>
      <p><strong>Event Name:</strong> ${app.data.Event_Name}</p>
      <p><strong>Designation/Organization:</strong> ${app.data.Desg_Org}</p>
      <p><strong>Email:</strong> ${app.data.Email}</p>
      <p><strong>Contact Number:</strong> ${app.data.Contact_Num}</p>
      <p><strong>Event Date:</strong> ${app.data.Date_of_Event}</p>
      <p><strong>Start Time:</strong> ${app.data.St_Time}</p>
      <p><strong>End Time:</strong> ${app.data.En_Time}</p>
      <p><strong>Expected Attendees:</strong> ${app.data.Exp_Attendee_Count}</p>
      <p><strong>Status:</strong> ${statusLabel(app.data.Req_Status)}</p>
    `;
  }
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
  try {
    const id = sessionStorage.getItem('applicationId');
    if (!id) {
      alert('No application ID found in session.');
      return;
    }

    const element = document.getElementById('application-info');
    element.style.display = 'block';

    const appData = await fetchApplicationData(id);
    populateApplicationHTML(appData);

    if (!appData) return;

    const opt = {
      margin: 1,
      filename: `application-${id}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    await html2pdf().set(opt).from(element).save();
    element.style.display = 'none';

  } catch (error) {
    console.error('PDF Generation failed:', error);
    alert('Failed to generate PDF. Please try again.');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const downloadBtn = document.querySelector('button[onclick="downloadPDF()"]');
  if (downloadBtn) {
    downloadBtn.removeAttribute('onclick');
    downloadBtn.addEventListener('click', downloadPDF);
  }
});
