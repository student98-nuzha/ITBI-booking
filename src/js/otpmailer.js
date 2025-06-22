// Initialize EmailJS 
emailjs.init("_qxnq73OQAtlfdEkO");

console.log("code was here")

document.addEventListener('DOMContentLoaded', function () {
  // ============ OTP SENDER PAGE ============
  const emailInput = document.getElementById('email');
  const form = document.querySelector('form');

  if (emailInput && form) {
    const submitButton = form.querySelector('button[type="submit"]');
    const errorMessage = document.createElement('div');
    errorMessage.style.color = 'red';
    errorMessage.style.marginTop = '10px';
    errorMessage.style.display = 'none';
    form.appendChild(errorMessage);

    form.addEventListener('submit', async function (event) {
      event.preventDefault();

      const email = emailInput.value.trim();

      const isStudentEmail = /^u\d{7}@student\.cuet\.ac\.bd$/i.test(email);
      const isStaffEmail = /^[a-zA-Z0-9._%+~-]+@cuet\.ac\.bd$/i.test(email);

      if (!email || (!isStudentEmail && !isStaffEmail)) {
        errorMessage.textContent = 'Please enter a valid CUET email address';
        errorMessage.style.display = 'block';
        return;
      }

      const originalButtonText = submitButton.textContent;
      submitButton.disabled = true;
      submitButton.textContent = 'Sending OTP...';
      errorMessage.style.display = 'none';

      try {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store OTP in Supabase
        await fetch("https://tjismtujphgldjuyfoek.supabase.co/rest/v1/OTPs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqaXNtdHVqcGhnbGRqdXlmb2VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0OTIyMzEsImV4cCI6MjA2NjA2ODIzMX0.WsNAKO2UCRRQffqD28jkCWQ7I4dKmFywfIMrTjI-8x8",
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqaXNtdHVqcGhnbGRqdXlmb2VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0OTIyMzEsImV4cCI6MjA2NjA2ODIzMX0.WsNAKO2UCRRQffqD28jkCWQ7I4dKmFywfIMrTjI-8x8",
            "Prefer": "return=representation"
          },
          body: JSON.stringify({
            email: email,
            otp: otp,
            expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
          })
        });

        // Send OTP via EmailJS
        const response = await emailjs.send("service_8fz075n", "template_g64ielq", {
          to_email: email,
          otp_code: otp,
          from_name: "CUET IT Business Incubator"
        });

        if (response.status !== 200) {
          throw new Error('Failed to send OTP');
        }

        window.location.href = `verify.html?email=${encodeURIComponent(email)}`;
      } catch (error) {
        console.error('Error sending OTP:', error);
        errorMessage.textContent = 'Failed to send OTP. Please try again.';
        errorMessage.style.display = 'block';
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
    });
  }

  // ============ OTP VERIFICATION PAGE ============
  const otpInput = document.getElementById('verification-code');
  if (otpInput) {
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    const form = document.querySelector('form');
    const submitButton = form.querySelector('button[type="submit"]');
    const errorMessage = document.createElement('div');
    errorMessage.style.color = 'red';
    errorMessage.style.marginTop = '10px';
    errorMessage.style.display = 'none';
    form.appendChild(errorMessage);

    if (email) {
      const emailDisplay = document.createElement('p');
      emailDisplay.textContent = `Verification code sent to: ${email}`;
      emailDisplay.style.fontWeight = 'bold';
      emailDisplay.style.marginBottom = '15px';
      form.insertBefore(emailDisplay, form.querySelector('.form-group'));
    }

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      const enteredOtp = otpInput.value.trim();

      try {
        // Fetch the most recent OTP
        const response = await fetch(`https://tjismtujphgldjuyfoek.supabase.co/rest/v1/OTPs?email=eq.${encodeURIComponent(email)}&order=created_at.desc&limit=1&select=*`, {
          headers: {
            "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqaXNtdHVqcGhnbGRqdXlmb2VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0OTIyMzEsImV4cCI6MjA2NjA2ODIzMX0.WsNAKO2UCRRQffqD28jkCWQ7I4dKmFywfIMrTjI-8x8",
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqaXNtdHVqcGhnbGRqdXlmb2VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0OTIyMzEsImV4cCI6MjA2NjA2ODIzMX0.WsNAKO2UCRRQffqD28jkCWQ7I4dKmFywfIMrTjI-8x8"
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch OTP data');
        }

        const data = await response.json();
        if (data.length === 0) {
          errorMessage.textContent = 'OTP not found. Please request a new one.';
          errorMessage.style.display = 'block';
          return;
        }

        const otpData = data[0];
        console.log("OTP Data:", otpData);

        const now = new Date();
        if (now > new Date(otpData.expires_at)) {
          errorMessage.textContent = 'OTP has expired. Please request a new one.';
          errorMessage.style.display = 'block';
          return;
        }

        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Verifying...';
        errorMessage.style.display = 'none';

        if (enteredOtp === otpData.otp) {
          console.log("✅ OTP verified");

          // Mark as verified
          const patchResponse = await fetch(`https://tjismtujphgldjuyfoek.supabase.co/rest/v1/OTPs?id=eq.${otpData.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqaXNtdHVqcGhnbGRqdXlmb2VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0OTIyMzEsImV4cCI6MjA2NjA2ODIzMX0.WsNAKO2UCRRQffqD28jkCWQ7I4dKmFywfIMrTjI-8x8",
              "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqaXNtdHVqcGhnbGRqdXlmb2VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0OTIyMzEsImV4cCI6MjA2NjA2ODIzMX0.WsNAKO2UCRRQffqD28jkCWQ7I4dKmFywfIMrTjI-8x8"
            },
            body: JSON.stringify({ verified: true })
          });

          if (patchResponse.ok) {
            window.location.href = 'booking.html';
          } else {
            console.error('Failed to update OTP verification status');
            errorMessage.textContent = 'Verification failed. Please try again.';
            errorMessage.style.display = 'block';
          }
        } else {
          console.log("❌ Invalid OTP");
          errorMessage.textContent = 'Invalid verification code. Please try again.';
          errorMessage.style.display = 'block';
        }

        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      } catch (err) {
        console.error('Verification error:', err);
        errorMessage.textContent = 'Something went wrong during verification.';
        errorMessage.style.display = 'block';
      }
    });
  }
});