// Questions and answer IDs come from Java, so this page always submits the active version.
let questions = [];
let questionVersion = null;
let currentQuestion = 0;
let answers = {};
let busy = false;

const statusElement = document.getElementById("assessmentStatus");
const nextButton = document.getElementById("nextButton");
const backButton = document.getElementById("backButton");

function setStatus(message, isError = false) {
    statusElement.textContent = message;
    statusElement.style.color = isError ? "#b42318" : "";
}

function showBusy(value) {
    busy = value;
    nextButton.disabled = value || questions.length === 0;
    backButton.disabled = value;
}

function displayQuestion() {
    if (!questions.length) {
        return;
    }
    const question = questions[currentQuestion];
    document.getElementById("questionNumber").textContent =
        "Question " + (currentQuestion + 1) + " of " + questions.length;
    document.getElementById("questionText").textContent = question.text;
    const container = document.getElementById("answers");
    container.replaceChildren();

    question.options.forEach((option) => {
        const label = document.createElement("label");
        label.className = "answer-option";
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "assessmentAnswer";
        radio.value = option.id;
        radio.checked = answers[question.id] === option.id;
        const text = document.createElement("span");
        text.textContent = option.label;
        label.append(radio, text);
        container.appendChild(label);
    });

    document.getElementById("progressFill").style.width =
        ((currentQuestion + 1) / questions.length * 100) + "%";
    backButton.style.display = currentQuestion === 0 ? "none" : "block";
    nextButton.textContent =
        currentQuestion === questions.length - 1 ? "Finish" : "Next";
}

function rememberSelectedAnswer() {
    const selected = document.querySelector('input[name="assessmentAnswer"]:checked');
    if (selected && questions[currentQuestion]) {
        answers[questions[currentQuestion].id] = selected.value;
    }
    return Boolean(selected);
}

function nextQuestion() {
    if (busy || !questions.length) {
        return;
    }
    if (!rememberSelectedAnswer()) {
        setStatus("Please select an answer before continuing.", true);
        return;
    }
    setStatus("");
    if (currentQuestion < questions.length - 1) {
        currentQuestion++;
        displayQuestion();
    } else {
        finishAssessment();
    }
}

function previousQuestion() {
    if (busy || currentQuestion === 0) {
        return;
    }
    rememberSelectedAnswer();
    currentQuestion--;
    setStatus("");
    displayQuestion();
}

async function finishAssessment() {
    const responseAnswers = questions.map((question) => ({
        questionId: question.id,
        optionId: answers[question.id]
    }));
    if (responseAnswers.some((answer) => !answer.optionId)) {
        setStatus("Please answer every question before finishing.", true);
        return;
    }
    showBusy(true);
    setStatus("Saving your answers...");
    try {
        await window.SamvedApi.request(
            "PUT",
            "/api/v1/assessments/current/responses",
            { questionVersion, answers: responseAnswers }
        );
        const result = await window.SamvedApi.request(
            "GET", "/api/v1/assessments/current/result"
        );
        const summary = document.getElementById("assessmentResultSummary");
        const dimensions = Array.isArray(result.leadingDimensions)
            ? result.leadingDimensions.map((dimension) =>
                dimension.toLowerCase().replaceAll("_", " ")).join(", ")
            : "";
        summary.textContent = dimensions
            ? "Your strongest interest signals: " + dimensions +
              ". These reflect your choices and do not predict a career outcome."
            : "Your answers are ready for career guidance.";
        document.getElementById("assessmentCard").style.display = "none";
        document.getElementById("result").style.display = "block";
        window.dispatchEvent(new Event("samved-profile-saved"));
    } catch (error) {
        setStatus(error.message || "Could not save or load your answers. Please try again.", true);
    } finally {
        showBusy(false);
    }
}

async function loadAssessment() {
    showBusy(true);
    try {
        const current = await window.SamvedApi.request(
            "GET", "/api/v1/assessments/current"
        );
        if (!Array.isArray(current.questions) || !current.questions.length) {
            throw new Error("No assessment questions are available.");
        }
        questionVersion = current.questionVersion;
        questions = current.questions;
        answers = {};
        (current.answers || []).forEach((answer) => {
            answers[answer.questionId] = answer.optionId;
        });
        currentQuestion = Math.max(0, questions.findIndex(
            (question) => !answers[question.id]
        ));
        displayQuestion();
        setStatus("Choose the answer that feels closest to you.");
    } catch (error) {
        setStatus(error.message || "Could not load the assessment. Reload this page to retry.", true);
    } finally {
        showBusy(false);
    }
}

loadAssessment();
