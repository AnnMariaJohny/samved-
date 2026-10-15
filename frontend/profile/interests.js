let selectedInterests =
    JSON.parse(localStorage.getItem("studentInterests")) || [];


// Get all interest buttons
const buttons =
    document.querySelectorAll(".interest-option");


// Show previously saved interests
buttons.forEach(function(button) {

    const interest =
        button.textContent.trim();

    if (selectedInterests.includes(interest)) {
        button.classList.add("selected");
    }

});


// Select / deselect an interest
function toggleInterest(button) {

    const interest =
        button.textContent.trim();


    if (selectedInterests.includes(interest)) {

        // REMOVE interest
        selectedInterests =
            selectedInterests.filter(function(item) {
                return item !== interest;
            });

        button.classList.remove("selected");

    } else {

        // ADD interest
        selectedInterests.push(interest);

        button.classList.add("selected");

    }

}


// SAVE interests
function saveInterests() {

    // THIS IS THE IMPORTANT PART:
    // Save even if the array is empty.

    localStorage.setItem(
        "studentInterests",
        JSON.stringify(selectedInterests)
    );
    

    // Show message
    const message =
        document.getElementById("interestMessage");

    message.textContent =
        "Interests saved successfully!";


    // Update the list
    displayInterests();

}


// Display selected interests
function displayInterests() {

    const list =
        document.getElementById("selectedInterestsList");


    list.innerHTML = "";


    // Nothing selected
    if (selectedInterests.length === 0) {

        list.innerHTML =
            "<p>No interests saved yet.</p>";

        return;
    }


    // Show each interest
    selectedInterests.forEach(function(interest) {

        const item =
            document.createElement("div");

        item.className =
            "selected-interest";

        item.textContent =
            interest;

        list.appendChild(item);

    });

}


// Display saved interests when page opens
displayInterests();