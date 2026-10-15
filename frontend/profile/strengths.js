function saveStrengths() {

    const checkboxes = document.querySelectorAll(
        'input[name="strength"]:checked'
    );

    const strengths = [];

    checkboxes.forEach(function(checkbox) {
        strengths.push(checkbox.value);
    });

    if (strengths.length === 0) {
        alert("Please select at least one strength");
        return;
    }

    localStorage.setItem(
        "samvedStrengths",
        JSON.stringify(strengths)
    );

    displayStrengths();

    document.getElementById("strengthMessage").textContent =
        "Strengths saved successfully!";
}


function displayStrengths() {

    const strengthsList = document.getElementById("strengthsList");

    const savedStrengths =
        JSON.parse(localStorage.getItem("samvedStrengths")) || [];

    if (savedStrengths.length === 0) {

        strengthsList.innerHTML =
            "<p>No strengths selected yet.</p>";

        return;
    }

    strengthsList.innerHTML = "";

    savedStrengths.forEach(function(strength, index) {

        const item = document.createElement("div");

        item.style.display = "flex";
        item.style.justifyContent = "space-between";
        item.style.alignItems = "center";
        item.style.marginBottom = "10px";
        item.style.padding = "10px";
        item.style.background = "#f4fff1";
        item.style.borderRadius = "8px";

        const strengthText = document.createElement("span");

        strengthText.textContent = "✓ " + strength;

        const deleteButton = document.createElement("button");

        deleteButton.textContent = "Delete";

        deleteButton.type = "button";

        deleteButton.onclick = function() {
            deleteStrength(index);
        };

        item.appendChild(strengthText);
        item.appendChild(deleteButton);

        strengthsList.appendChild(item);
    });
}


function deleteStrength(index) {

    const savedStrengths =
        JSON.parse(localStorage.getItem("samvedStrengths")) || [];

    savedStrengths.splice(index, 1);

    localStorage.setItem(
        "samvedStrengths",
        JSON.stringify(savedStrengths)
    );

    // Uncheck the deleted strength
    const checkboxes = document.querySelectorAll(
        'input[name="strength"]'
    );

    checkboxes.forEach(function(checkbox) {

        if (checkbox.value === savedStrengths[index]) {
            checkbox.checked = false;
        }

    });

    displayStrengths();
}


function loadStrengths() {

    const savedStrengths =
        JSON.parse(localStorage.getItem("samvedStrengths")) || [];

    const checkboxes = document.querySelectorAll(
        'input[name="strength"]'
    );

    checkboxes.forEach(function(checkbox) {

        if (savedStrengths.includes(checkbox.value)) {
            checkbox.checked = true;
        }

    });

    displayStrengths();
}


loadStrengths();