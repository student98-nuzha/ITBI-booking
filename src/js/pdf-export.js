document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("bookingForm");
  const pdfButton = document.getElementById("generatePDF");

  form.addEventListener("submit", function (e) {
    e.preventDefault(); // prevent actual form submission for demo

    const formData = new FormData(form);
    const values = {};
    formData.forEach((value, key) => {
      values[key] = value;
    });

    // Build the printable HTML content
    const printableHTML = `
      <h2>Booking Application Summary</h2>
      <p><strong>Application Date:</strong> ${values.application_date}</p>
      <p><strong>Designation & Organization:</strong> ${values.designation}</p>
      <p><strong>Applicant Name:</strong> ${values.applicant_name}</p>
      <p><strong>Contact Number:</strong> ${values.contact_number}</p>
      <p><strong>Guest Name:</strong> ${values.guest_name}</p>
      <p><strong>Relation:</strong> ${values.relation}</p>
      <p><strong>Arrival Date:</strong> ${values.arrival_date}</p>
      <p><strong>Departure Date:</strong> ${values.departure_date}</p>
      <p><strong>Air Conditioned:</strong> ${values.air_conditioned}</p>
      <p><strong>Personal Usage:</strong> ${values.personal_usage}</p>
    `;

    const printableDiv = document.getElementById("printableContent");
    printableDiv.innerHTML = printableHTML;
    printableDiv.style.display = "block"; // make it visible so html2pdf can see it
  });

  pdfButton.addEventListener("click", function () {
    const element = document.getElementById("printableContent");
    if (element.innerHTML.trim() === "") {
      alert("Please fill and submit the form first.");
      return;
    }
    html2pdf()
      .set({
        margin: 0.5,
        filename: "dormitory-application.pdf",
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
      })
      .from(element)
      .save();
  });
});
