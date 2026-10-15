function saveValues() {

    const checkboxes = document.querySelectorAll(
        'input[name="value"]:checked'
    );

    const values = [];

    checkboxes.forEach(function(checkbox) {
        values.push(checkbox.value);
    });

    if (values.length === 0) {
        alert("Please select at least one value");
        return;
    }

    localStorage.setItem(
        "samvedValues",
        JSON.stringify(values)
    );

    displayValues();

    document.getElementById("valueMessage").textContent =
        "Values saved successfully!";
}


function displayValues() {

    const valuesList = document.getElementById("valuesList");

    const savedValues =
        JSON.parse(localStorage.getItem("samvedValues")) || [];

    if (savedValues.length === 0) {

        valuesList.innerHTML =
            "<p>No values selected yet.</p>";

        return;
    }

    valuesList.innerHTML = "";

    savedValues.forEach(function(value, index) {

        const item = document.createElement("div");

        item.className = "saved-value";

        const valueText = document.createElement("span");

        valueText.textContent = "✓ " + value;

        const deleteButton = document.createElement("button");

        deleteButton.className = "delete-value";
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";

        deleteButton.onclick = function() {
            deleteValue(index);
        };

        item.appendChild(valueText);
        item.appendChild(deleteButton);

        valuesList.appendChild(item);
    });
}


function deleteValue(index) {

    const savedValues =
        JSON.parse(localStorage.getItem("samvedValues")) || [];

    const deletedValue = savedValues[index];

    savedValues.splice(index, 1);

    localStorage.setItem(
        "samvedValues",
        JSON.stringify(savedValues)
    );

    const checkboxes = document.querySelectorAll(
        'input[name="value"]'
    );

    checkboxes.forEach(function(checkbox) {

        if (checkbox.value === deletedValue) {
            checkbox.checked = false;
        }

    });

    displayValues();
}


function loadValues() {

    const savedValues =
        JSON.parse(localStorage.getItem("samvedValues")) || [];

    const checkboxes = document.querySelectorAll(
        'input[name="value"]'
    );

    checkboxes.forEach(function(checkbox) {

        if (savedValues.includes(checkbox.value)) {
            checkbox.checked = true;
        }

    });

    displayValues();
}


loadValues();