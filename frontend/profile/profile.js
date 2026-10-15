const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const ageInput = document.getElementById("age");
const locationInput = document.getElementById("location");
const educationInput = document.getElementById("education");
const editButton = document.getElementById("editButton");
const saveButton = document.getElementById("saveButton");
const message = document.getElementById("profileMessage");
const welcomeMessage = document.getElementById("welcomeMessage");

nameInput.value =
    localStorage.getItem("studentName") || "";

emailInput.value =
    localStorage.getItem("registeredEmail") || "";

ageInput.value =
    localStorage.getItem("studentAge") || "";

locationInput.value =
    localStorage.getItem("studentLocation") || "";

educationInput.value =
    localStorage.getItem("studentEducation") || "";

function updateWelcomeMessage() {

    const studentName =
        localStorage.getItem("studentName");

    if (studentName) {

        welcomeMessage.textContent =
            "Welcome back, " + studentName + "! 👋";

    } else {

        welcomeMessage.textContent =
            "Welcome to SAMVED! 👋";
    }
}

updateWelcomeMessage();

// PROFILE COMPLETION

function updateProfileCompletion() {

    const profileSaved =
        localStorage.getItem("samved_profile_saved") === "true";

    if (profileSaved) {

        localStorage.setItem(
            "samved_profile_complete",
            "true"
        );

    } else {

        localStorage.removeItem(
            "samved_profile_complete"
        );
    }
}

function hasSavedData(storageKey) {

    const data =
        localStorage.getItem(storageKey);

    if (!data) {
        return false;
    }

    try {

        const parsed =
            JSON.parse(data);

        if (Array.isArray(parsed)) {
            return parsed.length > 0;
        }

        if (
            typeof parsed === "object" &&
            parsed !== null
        ) {
            return Object.keys(parsed).length > 0;
        }

        return Boolean(parsed);

    } catch (error) {

        return data.trim() !== "";
    }
}

function isSectionComplete(section) {

    switch (section) {

        case "profile":

            return (
                localStorage.getItem(
                    "samved_profile_complete"
                ) === "true"
            );


        case "academic":

            return (
                localStorage.getItem(
                    "samved_academic_complete"
                ) === "true" ||
                hasSavedData("samvedAcademic") ||
                hasSavedData("academicRecords") ||
                hasSavedData("academicData")
            );


        case "interests":

            return (
                localStorage.getItem(
                    "samved_interests_complete"
                ) === "true" ||
                hasSavedData("samvedInterests") ||
                hasSavedData("studentInterests") ||
                hasSavedData("selectedInterests") ||
                hasSavedData("interests")
            );


        case "skills":

            return (
                localStorage.getItem(
                    "samved_skills_complete"
                ) === "true" ||
                hasSavedData("samvedSkills") ||
                hasSavedData("studentSkills")
            );


        case "strengths":

            return (
                localStorage.getItem(
                    "samved_strengths_complete"
                ) === "true" ||
                hasSavedData("samvedStrengths")
            );


        case "values":

            return (
                localStorage.getItem(
                    "samved_values_complete"
                ) === "true" ||
                hasSavedData("samvedValues")
            );


        case "career":

            return (
                localStorage.getItem(
                    "samved_career_complete"
                ) === "true" ||
                Boolean(
                    localStorage.getItem(
                        "samvedCareerGoal"
                    )
                )
            );


        case "assessment":

            return (
                localStorage.getItem(
                    "samved_assessment_complete"
                ) === "true" ||
                hasSavedData("samvedAssessment")
            );


        default:

            return false;
    }
}

function updateProgress() {

    // DO NOT call updateProfileCompletion() here.
    // Profile completion only happens when Save
    // Profile is clicked.

    const sections = [
        "profile",
        "academic",
        "interests",
        "skills",
        "strengths",
        "values",
        "career",
        "assessment"
    ];

    let completed = 0;

    sections.forEach(function(section) {

        if (isSectionComplete(section)) {
            completed++;
        }

    });

    const total =
        sections.length;

    const percentage =
        Math.round(
            (completed / total) * 100
        );


    document.getElementById(
        "progressText"
    ).textContent =
        completed +
        " of " +
        total +
        " sections completed";


    document.getElementById(
        "completionFill"
    ).style.width =
        percentage + "%";


    document.getElementById(
        "completionPercentage"
    ).textContent =
        percentage + "%";

    updateModuleStatus(
        "academicStatus",
        "academic",
        "Complete your academic profile",
        "Academic details completed!"
    );

    updateModuleStatus(
        "interestsStatus",
        "interests",
        "Choose your interests",
        "Interests completed!"
    );

    updateModuleStatus(
        "skillsStatus",
        "skills",
        "Add your skills",
        "Skills completed!"
    );

    updateModuleStatus(
        "strengthsStatus",
        "strengths",
        "Discover your strengths",
        "Strengths completed!"
    );

    updateModuleStatus(
        "valuesStatus",
        "values",
        "Define what matters to you",
        "Values completed!"
    );

    updateModuleStatus(
        "careerStatus",
        "career",
        "Set your career direction",
        "Career goal completed!"
    );

    updateModuleStatus(
        "assessmentStatus",
        "assessment",
        "Discover your direction",
        "Assessment completed!"
    );
}


function updateModuleStatus(
    elementId,
    section,
    incompleteText,
    completeText
) {

    const element =
        document.getElementById(elementId);

    if (!element) {
        return;
    }

    if (isSectionComplete(section)) {

        element.textContent =
            completeText;

    } else {

        element.textContent =
            incompleteText;
    }
}

editButton.addEventListener(
    "click",
    function() {

        nameInput.disabled = false;
        ageInput.disabled = false;
        locationInput.disabled = false;
        educationInput.disabled = false;

        editButton.style.display =
            "none";

        saveButton.style.display =
            "block";

        message.textContent = "";
    }
);

saveButton.addEventListener(
    "click",
    function() {

        // Save updated details

        localStorage.setItem(
            "studentName",
            nameInput.value.trim()
        );

        localStorage.setItem(
            "studentAge",
            ageInput.value
        );

        localStorage.setItem(
            "studentLocation",
            locationInput.value.trim()
        );

        localStorage.setItem(
            "studentEducation",
            educationInput.value
        );

        localStorage.setItem(
            "samved_profile_saved",
            "true"
        );

        localStorage.setItem(
            "samved_profile_complete",
            "true"
        );


        // Disable fields again

        nameInput.disabled = true;
        ageInput.disabled = true;
        locationInput.disabled = true;
        educationInput.disabled = true;


        editButton.style.display =
            "block";

        saveButton.style.display =
            "none";


        message.textContent =
            "Profile saved successfully!";


        updateWelcomeMessage();

        updateProgress();
    }
);

function logout() {

    localStorage.removeItem("loggedIn");

    window.location.href =
        "../auth/login.html";
}

updateProfileCompletion();

updateProgress();