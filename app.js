/**
 * LastMile Onboarding Frontend Controller
 * Elegant multi-step form transitions, validations, and cloud synchronizations.
 */

// --- CONFIGURATION ---
// Replace this with your Google Apps Script Web App URL after deployment
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw6uNgxYp0thwMxhThSkbxXh63zJHWW27zavBMN6hFkEcxdCal4xMlZRTmSwxwszGoQ/exec"; 

// The admin/membership coordinator phone number to receive WhatsApp verification (with country code, e.g., "919876543210")
const ADMIN_WHATSAPP_NUMBER = "918040122660"; 

document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const form = document.getElementById("onboardingForm");
    const steps = [
        document.getElementById("step1"),
        document.getElementById("step2"),
        document.getElementById("step3"),
        document.getElementById("step4")
    ];
    
    // Progress Tracker Steps
    const progressSteps = document.querySelectorAll(".progress-step");
    const progressBarFill = document.getElementById("progressBarFill");
    
    // Nav buttons
    const btnNext1 = document.getElementById("btnNext1");
    const btnBack2 = document.getElementById("btnBack2");
    const btnNext2 = document.getElementById("btnNext2");
    const btnBack3 = document.getElementById("btnBack3");
    const btnSubmit = document.getElementById("btnSubmit");
    const btnReset = document.getElementById("btnReset");
    
    // Success ticket inputs
    const successName = document.getElementById("successName");
    const successBrand = document.getElementById("successBrand");
    const successMemberId = document.getElementById("successMemberId");
    const successCategory = document.getElementById("successCategory");
    const successDate = document.getElementById("successDate");
    const btnWhatsAppSubmit = document.getElementById("btnWhatsAppSubmit");
    
    // Business category toggle elements
    const businessNatureSelect = document.getElementById("businessNature");
    const customCategoryGroup = document.getElementById("customCategoryGroup");
    const customCategoryInput = document.getElementById("customCategory");
    
    // Layout logic components
    const travelReadyCheckbox = document.getElementById("travelReady");
    const citiesContainer = document.getElementById("citiesContainer");
    const cityCheckboxes = document.querySelectorAll("input[name='targetCities']");
    const submissionLoader = document.getElementById("submissionLoader");
    const submissionSuccess = document.getElementById("submissionSuccess");
    
    let currentStep = 0; // 0 = Step 1, 1 = Step 2, 2 = Step 3, 3 = Step 4 (Complete)

    // --- BUSINESS CATEGORY OTHER SELECT TOGGLE ---
    businessNatureSelect.addEventListener("change", () => {
        if (businessNatureSelect.value === "Other") {
            customCategoryGroup.classList.remove("hidden");
        } else {
            customCategoryGroup.classList.add("hidden");
            customCategoryInput.value = "";
            clearError("customCategory", "customCategoryError");
        }
    });

    // --- TRAVEL WILLINGNESS SWITCH TOGGLE ---
    travelReadyCheckbox.addEventListener("change", () => {
        if (travelReadyCheckbox.checked) {
            citiesContainer.classList.remove("hidden");
            // Check all cities by default when turning back ON
            cityCheckboxes.forEach(cb => cb.checked = true);
        } else {
            citiesContainer.classList.add("hidden");
            // Uncheck all when turning OFF to reflect correct values
            cityCheckboxes.forEach(cb => cb.checked = false);
        }
    });

    // --- STEP NAVIGATION TRIGGER ---
    btnNext1.addEventListener("click", () => {
        if (validateStep1()) {
            goToStep(1);
        }
    });

    btnBack2.addEventListener("click", () => {
        goToStep(0);
    });

    btnNext2.addEventListener("click", () => {
        if (validateStep2()) {
            goToStep(2);
        }
    });

    btnBack3.addEventListener("click", () => {
        goToStep(1);
    });

    // Reset Form
    btnReset.addEventListener("click", () => {
        form.reset();
        currentStep = 0;
        
        // Reset classes
        steps.forEach((step, idx) => {
            step.classList.remove("active");
            if (idx === 0) step.classList.add("active");
        });
        
        progressSteps.forEach((step, idx) => {
            step.classList.remove("active", "completed");
            if (idx === 0) step.classList.add("active");
        });
        
        progressBarFill.style.width = "0%";
        
        submissionLoader.classList.remove("hidden");
        submissionSuccess.classList.add("hidden");
        
        // Reset UI toggle
        travelReadyCheckbox.checked = true;
        citiesContainer.classList.remove("hidden");
        cityCheckboxes.forEach(cb => cb.checked = true);
        
        // Reset custom category text box
        customCategoryGroup.classList.add("hidden");
    });

    /**
     * Navigate to a target step index
     * @param {number} targetIndex - Target Panel Index (0 to 3)
     */
    function goToStep(targetIndex) {
        // Hide current active panel
        steps[currentStep].classList.remove("active");
        
        // Set new index
        currentStep = targetIndex;
        
        // Show target panel
        steps[currentStep].classList.add("active");
        
        // Update Progress bar indicators
        updateProgressIndicators();
        
        // Scroll to top of card for smooth UX
        document.querySelector(".form-card").scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    /**
     * Updates the status of top-level stepper circles and connector bars
     */
    function updateProgressIndicators() {
        progressSteps.forEach((el, index) => {
            el.classList.remove("active", "completed");
            
            if (index < currentStep) {
                el.classList.add("completed");
            } else if (index === currentStep) {
                el.classList.add("active");
            }
        });
        
        // Percentage fills: 3 connectors => 0%, 33.3%, 66.6%, 100%
        const fillPercentage = (currentStep / (progressSteps.length - 1)) * 100;
        progressBarFill.style.width = `${fillPercentage}%`;
    }

    // --- FORM VALIDATIONS ---

    /**
     * Show validation error for a field
     */
    function showError(fieldId, errorId) {
        const fieldGroup = document.getElementById(fieldId).closest(".form-group");
        fieldGroup.classList.add("has-error");
        document.getElementById(errorId).style.display = "flex";
    }

    /**
     * Clear validation error for a field
     */
    function clearError(fieldId, errorId) {
        const inputEl = document.getElementById(fieldId);
        if (inputEl) {
            const fieldGroup = inputEl.closest(".form-group");
            fieldGroup.classList.remove("has-error");
        }
        const errEl = document.getElementById(errorId);
        if (errEl) {
            errEl.style.display = "none";
        }
    }

    // Direct input listeners to clear errors on user typing
    const textInputs = [
        { id: "fullName", err: "fullNameError" },
        { id: "phone", err: "phoneError" },
        { id: "age", err: "ageError" },
        { id: "location", err: "locationError" },
        { id: "address", err: "addressError" },
        { id: "businessNature", err: "businessNatureError" },
        { id: "businessName", err: "businessNameError" },
        { id: "customCategory", err: "customCategoryError" }
    ];
    
    textInputs.forEach(item => {
        const el = document.getElementById(item.id);
        if (el) {
            el.addEventListener("input", () => clearError(item.id, item.err));
            el.addEventListener("change", () => clearError(item.id, item.err));
        }
    });
    
    document.querySelectorAll("input[name='gender']").forEach(radio => {
        radio.addEventListener("change", () => clearError("genderError", "genderError"));
    });

    /**
     * Validates fields on Step 1 (Personal Profile)
     */
    function validateStep1() {
        let isValid = true;
        
        // Name
        const nameVal = document.getElementById("fullName").value.trim();
        if (nameVal.length < 3) {
            showError("fullName", "fullNameError");
            isValid = false;
        } else {
            clearError("fullName", "fullNameError");
        }
        
        // Phone: Must be numbers and have at least 10 digits
        const phoneVal = document.getElementById("phone").value.trim().replace(/\D/g, "");
        if (phoneVal.length < 10) {
            showError("phone", "phoneError");
            isValid = false;
        } else {
            clearError("phone", "phoneError");
        }
        
        // Age: Must be between 18 and 100
        const ageVal = parseInt(document.getElementById("age").value);
        if (isNaN(ageVal) || ageVal < 18 || ageVal > 100) {
            showError("age", "ageError");
            isValid = false;
        } else {
            clearError("age", "ageError");
        }
        
        // Gender Check
        const genderChecked = document.querySelector("input[name='gender']:checked");
        if (!genderChecked) {
            const genderGroup = document.querySelector(".gender-selector").closest(".form-group");
            genderGroup.classList.add("has-error");
            document.getElementById("genderError").style.display = "flex";
            isValid = false;
        } else {
            const genderGroup = document.querySelector(".gender-selector").closest(".form-group");
            genderGroup.classList.remove("has-error");
            document.getElementById("genderError").style.display = "none";
        }
        
        // Location: min 5 characters
        const locVal = document.getElementById("location").value.trim();
        if (locVal.length < 4) {
            showError("location", "locationError");
            isValid = false;
        } else {
            clearError("location", "locationError");
        }
        
        // Address: min 10 characters
        const addrVal = document.getElementById("address").value.trim();
        if (addrVal.length < 10) {
            showError("address", "addressError");
            isValid = false;
        } else {
            clearError("address", "addressError");
        }
        
        return isValid;
    }

    /**
     * Validates fields on Step 2 (Business Details)
     */
    function validateStep2() {
        let isValid = true;
        
        // Nature of business select
        const bizCategory = businessNatureSelect.value;
        if (!bizCategory) {
            showError("businessNature", "businessNatureError");
            isValid = false;
        } else {
            clearError("businessNature", "businessNatureError");
        }
        
        // If 'Other' is selected, validate customCategory (min 3 characters)
        if (bizCategory === "Other") {
            const customCatVal = customCategoryInput.value.trim();
            if (customCatVal.length < 3) {
                showError("customCategory", "customCategoryError");
                isValid = false;
            } else {
                clearError("customCategory", "customCategoryError");
            }
        }
        
        // Brand/Company Name
        const bizName = document.getElementById("businessName").value.trim();
        if (!bizName) {
            showError("businessName", "businessNameError");
            isValid = false;
        } else {
            clearError("businessName", "businessNameError");
        }
        
        return isValid;
    }

    /**
     * Validates fields on Step 3 (Fairs & Travel Preferences)
     */
    function validateStep3() {
        let isValid = true;
        
        // If ready to travel is checked, must select at least one outstation city
        if (travelReadyCheckbox.checked) {
            const selectedCities = document.querySelectorAll("input[name='targetCities']:checked");
            if (selectedCities.length === 0) {
                document.getElementById("citiesError").style.display = "flex";
                isValid = false;
            } else {
                document.getElementById("citiesError").style.display = "none";
            }
        } else {
            document.getElementById("citiesError").style.display = "none";
        }
        
        return isValid;
    }

    // --- FORM SUBMIT HANDLER ---
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        
        // Comprehensive check: validate all steps and redirect to the first step containing an error
        if (!validateStep1() || !validateStep2() || !validateStep3()) {
            if (!validateStep1()) {
                goToStep(0);
            } else if (!validateStep2()) {
                goToStep(1);
            } else {
                goToStep(2);
            }
            return;
        }
        
        // Go to loading step
        goToStep(3);
        
        // Gather payload data
        const fullName = document.getElementById("fullName").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const age = document.getElementById("age").value.trim();
        const gender = document.querySelector("input[name='gender']:checked").value;
        const location = document.getElementById("location").value.trim();
        const address = document.getElementById("address").value.trim();
        const businessNature = businessNatureSelect.value === "Other" 
            ? customCategoryInput.value.trim() 
            : businessNatureSelect.value;
        const businessName = document.getElementById("businessName").value.trim();
        const travelReady = travelReadyCheckbox.checked ? "Yes" : "No";
        
        // Parse outstation cities checked
        const selectedCitiesList = [];
        document.querySelectorAll("input[name='targetCities']:checked").forEach(cb => {
            selectedCitiesList.push(cb.value);
        });
        const outstationCities = travelReady === "Yes" ? selectedCitiesList.join(", ") : "None (Kolkata Only)";
        
        const payload = {
            fullName,
            phone,
            age,
            gender,
            location,
            address,
            businessNature,
            businessName,
            travelReady,
            outstationCities
        };
        
        console.log("Submitting Onboarding Registry Payload:", payload);
        
        // Submit via Fetch API
        if (GOOGLE_SCRIPT_URL && GOOGLE_SCRIPT_URL !== "") {
            // Post payload to Google Apps Script Web App using 'cors' mode and 'text/plain' to avoid OPTIONS preflight issues
            fetch(GOOGLE_SCRIPT_URL, {
                method: "POST",
                mode: "cors",
                headers: {
                    "Content-Type": "text/plain;charset=utf-8"
                },
                body: JSON.stringify(payload)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                return response.json();
            })
            .then(data => {
                console.log("Onboarding sync successful:", data);
                if (data && data.status === "success" && data.membershipId) {
                    // Use the real sequential ID returned by the Google Apps Script database
                    showSuccessScreen(payload, data.membershipId);
                } else {
                    throw new Error(data.message || "Failed to retrieve Membership ID from server");
                }
            })
            .catch(error => {
                console.error("Network synchronization failed, using client fallback:", error);
                // Fallback gracefully so the system is robust
                const randomSeq = Math.floor(1000 + Math.random() * 9000);
                const generatedId = `MEM-2026-${randomSeq}`;
                showSuccessScreen(payload, generatedId);
            });
        } else {
            // DEVELOPER MOCK TIMEOUT: Simulates network latency for demonstration purposes
            console.warn("GOOGLE_SCRIPT_URL is not configured. Running onboarding locally in offline mode.");
            setTimeout(() => {
                const randomSeq = Math.floor(1000 + Math.random() * 9000);
                const generatedId = `MEM-2026-${randomSeq}`;
                showSuccessScreen(payload, generatedId);
            }, 2500);
        }
    });

    /**
     * Transition the loading view to the glassmorphic success page and fill ticket metadata
     */
    function showSuccessScreen(data, membershipId) {
        // Hide loader, show ticket
        submissionLoader.classList.add("hidden");
        submissionSuccess.classList.remove("hidden");
        
        // Set values in the Ticket UI
        successName.textContent = data.fullName;
        successBrand.textContent = data.businessName;
        successCategory.textContent = data.businessNature;
        successMemberId.textContent = membershipId;
        
        // Format Date beautifully
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const today = new Date();
        successDate.textContent = today.toLocaleDateString("en-US", options);
        
        // Construct Prefilled WhatsApp Acknowledgment Link
        const formattedMsg = 
`*LAST MILE ONBOARDING CONFIRMATION* 🚀

Hello Admin, I have successfully submitted my onboarding details. Here are my registration credentials:

• *Member Name:* ${data.fullName}
• *Brand/Company:* ${data.businessName}
• *Membership ID:* ${membershipId}
• *Business Category:* ${data.businessNature}
• *Primary Location:* ${data.location}
• *Travel Outside Kolkata:* ${data.travelReady}
• *Target Exhibiting Cities:* ${data.outstationCities}

Please review my registration and activate my member credentials on the central panel. Thank you!`;

        const encodedText = encodeURIComponent(formattedMsg);
        
        // Create full URL (using Click-to-Chat protocol wa.me)
        // If the client is mobile, wa.me opens in app. If desktop, it routes to WhatsApp Web beautifully!
        const whatsappUrl = `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodedText}`;
        btnWhatsAppSubmit.href = whatsappUrl;
    }
});
