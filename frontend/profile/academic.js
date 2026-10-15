const educationLevel = document.getElementById("educationLevel");
const institution = document.getElementById("institution");
const course = document.getElementById("course");
const semester = document.getElementById("semester");
const subject = document.getElementById("subject");
const marks = document.getElementById("marks");
const score = document.getElementById("score");
const addButton = document.getElementById("addAcademicButton");
const message = document.getElementById("academicMessage");
const recordsContainer = document.getElementById("academicRecords");
let academicRecords =
    JSON.parse(localStorage.getItem("academicRecords")) || [];

displayRecords();

addButton.addEventListener("click", function() {
    if (
        educationLevel.value === "" ||
        institution.value.trim() === "" ||
        course.value.trim() === "" ||
        semester.value.trim() === "" ||
        subject.value.trim() === "" ||
        marks.value === "" ||
        score.value.trim() === ""
    ) {
        message.textContent = "Please fill in all academic details.";
        return;
    }

    const record = {
        educationLevel: educationLevel.value,
        institution: institution.value.trim(),
        course: course.value.trim(),
        semester: semester.value.trim(),
        subject: subject.value.trim(),
        marks: marks.value,
        score: score.value.trim()
    };

    academicRecords.push(record);

    localStorage.setItem(
        "academicRecords",
        JSON.stringify(academicRecords)
    );

    educationLevel.value = "";
    institution.value = "";
    course.value = "";
    semester.value = "";
    subject.value = "";
    marks.value = "";
    score.value = "";
    message.textContent = "Academic record added successfully!";
    displayRecords();

});

function displayRecords() {
    recordsContainer.innerHTML = "";
    if (academicRecords.length === 0) {
        recordsContainer.innerHTML =
            "<p>No academic records added yet.</p>";
        return;
    }

    academicRecords.forEach(function(record, index) {
        const recordDiv = document.createElement("div");
        recordDiv.className = "academic-record";
        recordDiv.innerHTML = `
            <h3>${record.subject}</h3>
            <p><strong>Education:</strong> ${record.educationLevel}</p>
            <p><strong>Institution:</strong> ${record.institution}</p>
            <p><strong>Course:</strong> ${record.course}</p>
            <p><strong>Semester:</strong> ${record.semester}</p>
            <p><strong>Marks:</strong> ${record.marks}</p>
            <p><strong>CGPA / Percentage:</strong> ${record.score}</p>
            <button onclick="deleteRecord(${index})">
                Delete
            </button>
        `;
        recordsContainer.appendChild(recordDiv);
    });
}

function deleteRecord(index) {
    academicRecords.splice(index, 1);
    localStorage.setItem(
        "academicRecords",
        JSON.stringify(academicRecords)
    );
    displayRecords();
    message.textContent = "Academic record deleted.";

}