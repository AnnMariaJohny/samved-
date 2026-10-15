// Get saved skills
let skills =
    JSON.parse(localStorage.getItem("studentSkills")) || [];


// Show saved skills when page opens
displaySkills();


// Add a new skill
function addSkill() {

    const skillInput =
        document.getElementById("skill");

    const levelInput =
        document.getElementById("skillLevel");

    const message =
        document.getElementById("skillMessage");


    const skill =
        skillInput.value.trim();

    const level =
        levelInput.value;


    // Check skill
    if (skill === "") {

        message.textContent =
            "Please enter a skill.";

        return;
    }


    // Check level
    if (level === "") {

        message.textContent =
            "Please select a skill level.";

        return;
    }


    // Check duplicate
    const duplicate =
        skills.some(function(item) {

            return item.name.toLowerCase() ===
                   skill.toLowerCase();

        });


    if (duplicate) {

        message.textContent =
            "This skill has already been added.";

        return;
    }


    // Create skill
    const newSkill = {

        name: skill,
        level: level

    };


    // Add to array
    skills.push(newSkill);


    // Save to localStorage
    localStorage.setItem(
        "studentSkills",
        JSON.stringify(skills)
    );


    // Clear inputs
    skillInput.value = "";

    levelInput.value = "";


    // Message
    message.textContent =
        "Skill added successfully!";


    // Refresh list
    displaySkills();

}


// Display skills
function displaySkills() {

    const list =
        document.getElementById("skillsList");


    list.innerHTML = "";


    // No skills
    if (skills.length === 0) {

        list.innerHTML =
            "<p>No skills added yet.</p>";

        return;
    }


    // Display each skill
    skills.forEach(function(skill, index) {

        const skillCard =
            document.createElement("div");

        skillCard.className =
            "academic-record";


        skillCard.innerHTML = `

            <h3>${skill.name}</h3>

            <p>
                <strong>Level:</strong>
                ${skill.level}
            </p>

            <button
                type="button"
                onclick="deleteSkill(${index})">

                Delete

            </button>

        `;


        list.appendChild(skillCard);

    });

}


// Delete skill
function deleteSkill(index) {

    skills.splice(index, 1);
    localStorage.setItem(
        "studentSkills",
        JSON.stringify(skills)
    );


    displaySkills();


    document.getElementById("skillMessage").textContent =
        "Skill deleted successfully.";

}