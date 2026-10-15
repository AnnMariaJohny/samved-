document.addEventListener("DOMContentLoaded", function () {

    const careerRadios = document.querySelectorAll(
        'input[name="careerGoal"]'
    );

    const customBox = document.getElementById("customCareerBox");
    const customInput = document.getElementById("customCareer");
    const saveButton = document.querySelector(
        'button[onclick="saveCareerGoal()"]'
    );

    const message = document.getElementById("careerMessage");
    const careerList = document.getElementById("careerList");


    // Show/hide custom career box
    careerRadios.forEach(function (radio) {

        radio.addEventListener("change", function () {

            if (
                radio.value === "Other" ||
                radio.value === "I am not sure yet"
            ) {
                customBox.style.display = "block";
            } else {
                customBox.style.display = "none";
                customInput.value = "";
            }

        });

    });


    // Save career
    saveButton.onclick = function () {

        const selectedCareer =
            document.querySelector(
                'input[name="careerGoal"]:checked'
            );

        if (!selectedCareer) {
            alert("Please select a career goal");
            return;
        }


        let careerGoal = selectedCareer.value;


        // Custom career
        if (
            selectedCareer.value === "Other" ||
            selectedCareer.value === "I am not sure yet"
        ) {

            const typedCareer =
                customInput.value.trim();

            if (typedCareer === "") {
                alert("Please type the career you are interested in");
                customInput.focus();
                return;
            }

            careerGoal = typedCareer;
        }


        // Save to browser
        localStorage.setItem(
            "samvedCareerGoal",
            careerGoal
        );

        localStorage.setItem(
            "samvedCareerType",
            selectedCareer.value
        );


        showSavedCareer();


        message.textContent =
            "Career goal saved successfully!";
    };


    function showSavedCareer() {

        const savedCareer =
            localStorage.getItem("samvedCareerGoal");

        if (!savedCareer) {

            careerList.innerHTML =
                "<p>No career goal selected yet.</p>";

            return;
        }


        careerList.innerHTML = "";


        const item =
            document.createElement("div");

        item.className =
            "selected-career";


        const text =
            document.createElement("span");

        text.textContent =
            "🎯 " + savedCareer;


        const deleteButton =
            document.createElement("button");

        deleteButton.type = "button";
        deleteButton.className = "delete-career";
        deleteButton.textContent = "Delete";


        deleteButton.onclick = function () {

            localStorage.removeItem(
                "samvedCareerGoal"
            );

            localStorage.removeItem(
                "samvedCareerType"
            );


            careerRadios.forEach(function (radio) {
                radio.checked = false;
            });


            customInput.value = "";
            customBox.style.display = "none";

            message.textContent = "";

            showSavedCareer();
        };


        item.appendChild(text);
        item.appendChild(deleteButton);

        careerList.appendChild(item);
    }


    // Load saved career when page opens
    function loadCareer() {

        const savedCareer =
            localStorage.getItem("samvedCareerGoal");

        const savedType =
            localStorage.getItem("samvedCareerType");


        if (!savedCareer) {
            showSavedCareer();
            return;
        }


        careerRadios.forEach(function (radio) {

            if (radio.value === savedType) {

                radio.checked = true;

                if (
                    savedType === "Other"
                ) {

                    customBox.style.display = "block";
                    customInput.value = savedCareer;

                } else {

                    customBox.style.display = "none";
                }
            }

        });


        showSavedCareer();
    }


    loadCareer();

});