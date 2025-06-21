emailjs.init("_qxnq73OQAtlfdEkO");

console.log("code was here")

if (document.querySelector('#email')) {
    document.addEventListener('DOMContentLoaded', function() {
        const form = document.querySelector('form');
        const emailInput = document.getElementById('email');
        const submitButton = form.querySelector('button[type="submit"]');
        const errorMessage = document.createElement('div');
        errorMessage.style.color = 'red';
        errorMessage.style.marginTop = '10px';
        errorMessage.style.display = 'none';
        form.appendChild(errorMessage);

        form.addEventListener('submit', async function(event) {
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
                
                sessionStorage.setItem('otpData', JSON.stringify({
                    email: email,
                    otp: otp,
                    timestamp: new Date().getTime()
                }));
                
                // Send OTP via EmailJS
                const response = await emailjs.send("service_8fz075n", "template_g64ielq", {
                    to_email: email,
                    otp_code: otp,
                    from_name: "CUET IT Business Incubator"
                });
                
                if (response.status !== 200) {
                    throw new Error('Failed to send OTP');
                }
                
                // Redirect to verification page with email parameter
                window.location.href = `verify.html?email=${encodeURIComponent(email)}`;
                
            } catch (error) {
                console.error('Error sending OTP:', error);
                errorMessage.textContent = 'Failed to send OTP. Please try again.';
                errorMessage.style.display = 'block';
            } finally {
                // Reset button state
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }
        });
    });
}

console.log("code was here 2")

// Check if we're on the verification page
if (document.querySelector('#verification-code')) {
    document.addEventListener('DOMContentLoaded', function() {
        const urlParams = new URLSearchParams(window.location.search);
        const email = urlParams.get('email');
        const form = document.querySelector('form');
        const otpInput = document.getElementById('verification-code');
        const submitButton = form.querySelector('button[type="submit"]');
        const errorMessage = document.createElement('div');
        errorMessage.style.color = 'red';
        errorMessage.style.marginTop = '10px';
        errorMessage.style.display = 'none';
        form.appendChild(errorMessage);
        
        // Display email if available
        if (email) {
            const emailDisplay = document.createElement('p');
            emailDisplay.textContent = `Verification code sent to: ${email}`;
            emailDisplay.style.fontWeight = 'bold';
            emailDisplay.style.marginBottom = '15px';
            form.insertBefore(emailDisplay, form.querySelector('.form-group'));
        }
        
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            
            const enteredOtp = otpInput.value.trim();
            
            // Get stored OTP data
            const otpData = JSON.parse(sessionStorage.getItem('otpData'));
            
            if (!otpData) {
                errorMessage.textContent = 'OTP session expired. Please go back and request a new OTP.';
                errorMessage.style.display = 'block';
                return;
            }
            
            // Check if OTP is expired (10 minutes)
            const currentTime = new Date().getTime();
            if (currentTime - otpData.timestamp > 10 * 60 * 1000) {
                errorMessage.textContent = 'OTP has expired. Please go back and request a new OTP.';
                errorMessage.style.display = 'block';
                return;
            }
            
            // Show loading state
            const originalButtonText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.textContent = 'Verifying...';
            errorMessage.style.display = 'none';
            
            // Simulate verification delay
            setTimeout(() => {
                if (enteredOtp === otpData.otp) {
                    // Clear OTP data
                    sessionStorage.removeItem('otpData');
                    
                    // Redirect to booking page
                    window.location.href = 'booking.html';
                } else {
                    errorMessage.textContent = 'Invalid verification code. Please try again.';
                    errorMessage.style.display = 'block';
                }
                
                // Reset button state
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }, 1000);
        });
        
        // Resend OTP functionality
        const resendLink = document.createElement('a');
        resendLink.href = '#';
        resendLink.textContent = "Didn't receive code? Resend";
        resendLink.style.display = 'block';
        resendLink.style.marginTop = '10px';
        resendLink.style.textAlign = 'center';
        form.appendChild(resendLink);
        
        resendLink.addEventListener('click', async function(e) {
            e.preventDefault();
            
            if (!email) {
                errorMessage.textContent = 'Email not found. Please go back and try again.';
                errorMessage.style.display = 'block';
                return;
            }
            
            try {
                // Generate new OTP
                const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
                
                // Update stored OTP data
                sessionStorage.setItem('otpData', JSON.stringify({
                    email: email,
                    otp: newOtp,
                    timestamp: new Date().getTime()
                }));
                
                // Send new OTP via EmailJS
                const response = await emailjs.send("service_8fz075n", "template_g64ielq", {
                    to_email: email,
                    otp_code: newOtp,
                    from_name: "CUET IT Business Incubator"
                });
                
                if (response.status !== 200) {
                    throw new Error('Failed to resend OTP');
                }
                
                // Show success message
                const successMsg = document.createElement('div');
                successMsg.textContent = 'New verification code sent!';
                successMsg.style.color = 'green';
                successMsg.style.marginTop = '10px';
                successMsg.style.textAlign = 'center';
                form.insertBefore(successMsg, resendLink);
                
                // Remove success message after 3 seconds
                setTimeout(() => {
                    successMsg.remove();
                }, 3000);
                
            } catch (error) {
                console.error('Resend error:', error);
                errorMessage.textContent = 'Failed to resend OTP. Please try again.';
                errorMessage.style.display = 'block';
            }
        });
    });
}

console.log("code was here 3")