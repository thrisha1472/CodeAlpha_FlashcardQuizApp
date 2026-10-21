const STORAGE_KEY = "codealpha-flashcard-quiz-app-v1";

const starterCards = [
  { question: "What does HTML stand for?", answer: "HyperText Markup Language. It structures content on web pages.", category: "Web Development" },
  { question: "What is CSS used for?", answer: "CSS styles web pages, including colors, layouts, spacing, and fonts.", category: "Web Development" },
  { question: "What does JavaScript add to a website?", answer: "JavaScript adds behavior and interactivity, such as responding to clicks and updating content.", category: "Programming" },
  { question: "What is a variable?", answer: "A named place to store a value that a program can use.", category: "Programming" },
  { question: "What is an algorithm?", answer: "A clear sequence of steps used to solve a problem or complete a task.", category: "Computer Science" }
];

const $ = (id) => document.getElementById(id);
const flashcard = $("flashcard");
const cardCounter = $("cardCounter");
const cardCategory = $("cardCategory");
const sideLabel = $("sideLabel");
const cardText = $("cardText");
const tapHint = $("tapHint");
const showAnswerBtn = $("showAnswerBtn");
const prevBtn = $("prevBtn");
const nextBtn = $("nextBtn");
const deckCount = $("deckCount");
const deckList = $("deckList");
const progressDots = $("progressDots");
const cardDialog = $("cardDialog");
const cardForm = $("cardForm");
const questionInput = $("questionInput");
const answerInput = $("answerInput");
const categoryInput = $("categoryInput");
const formError = $("formError");
const toast = $("toast");

let cards = loadCards();
let currentIndex = 0;
let showingAnswer = false;
let editingIndex = null;
let toastTimer;

function loadCards() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter(card =>
          card && typeof card.question === "string" &&
          typeof card.answer === "string"
        ).map(card => ({
          question: card.question,
          answer: card.answer,
          category: typeof card.category === "string" && card.category.trim()
            ? card.category.trim() : "General"
        }));
      }
    }
  } catch (error) {
    console.warn("Could not load saved flashcards.", error);
  }
  return starterCards.map(card => ({ ...card }));
}

function saveCards() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    return true;
  } catch (error) {
    console.error("Could not save flashcards.", error);
    showToast("Could not save. Check your browser storage settings.");
    return false;
  }
}

function render() {
  const hasCards = cards.length > 0;
  const current = cards[currentIndex];

  deckCount.textContent = String(cards.length);
  cardCounter.textContent = hasCards
    ? `CARD ${currentIndex + 1} OF ${cards.length}`
    : "NO CARDS YET";

  prevBtn.disabled = !hasCards || currentIndex === 0;
  nextBtn.disabled = !hasCards || currentIndex === cards.length - 1;
  showAnswerBtn.disabled = !hasCards;
  $("editBtn").disabled = !hasCards;
  $("deleteBtn").disabled = !hasCards;

  if (!hasCards) {
    cardCategory.textContent = "Empty deck";
    sideLabel.textContent = "READY WHEN YOU ARE";
    cardText.textContent = "Add your first flashcard";
    tapHint.textContent = "Create a question and answer to begin studying.";
    $("cardSymbol").textContent = "+";
    showAnswerBtn.innerHTML = 'Show Answer <span aria-hidden="true">↗</span>';
    deckList.innerHTML = '<div class="empty-state">Your deck is empty.<br>Add a flashcard to get started.</div>';
    progressDots.innerHTML = "";
    return;
  }

  cardCategory.textContent = current.category;
  sideLabel.textContent = showingAnswer ? "ANSWER" : "QUESTION";
  cardText.textContent = showingAnswer ? current.answer : current.question;
  tapHint.textContent = showingAnswer
    ? "Ready? Move to the next card when you are."
    : "Think of your answer, then reveal the card.";
  $("cardSymbol").textContent = showingAnswer ? "A" : "Q";
  showAnswerBtn.innerHTML = showingAnswer
    ? 'Show Question <span aria-hidden="true">↺</span>'
    : 'Show Answer <span aria-hidden="true">↗</span>';

  deckList.replaceChildren();
  cards.forEach((card, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `deck-item${index === currentIndex ? " active" : ""}`;
    button.setAttribute("aria-current", index === currentIndex ? "true" : "false");
    const number = document.createElement("span");
    number.className = "deck-index";
    number.textContent = String(index + 1).padStart(2, "0");
    const title = document.createElement("span");
    title.className = "deck-item-text";
    title.textContent = card.question;
    button.append(number, title);
    button.addEventListener("click", () => {
      currentIndex = index;
      showingAnswer = false;
      render();
    });
    deckList.appendChild(button);
  });

  progressDots.replaceChildren();
  cards.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = `dot${index === currentIndex ? " active" : ""}`;
    dot.setAttribute("aria-label", `Go to card ${index + 1}`);
    dot.setAttribute("aria-current", index === currentIndex ? "step" : "false");
    dot.addEventListener("click", () => {
      currentIndex = index;
      showingAnswer = false;
      render();
    });
    progressDots.appendChild(dot);
  });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}

function openDialog(mode) {
  formError.textContent = "";
  editingIndex = mode === "edit" ? currentIndex : null;
  $("dialogTitle").textContent = mode === "edit" ? "Edit flashcard" : "Add a flashcard";
  $("dialogEyebrow").textContent = mode === "edit" ? "REFINE YOUR CARD" : "MAKE IT YOURS";
  $("saveCardBtn").textContent = mode === "edit" ? "Save changes" : "Save flashcard";

  if (mode === "edit" && cards[currentIndex]) {
    questionInput.value = cards[currentIndex].question;
    answerInput.value = cards[currentIndex].answer;
    categoryInput.value = cards[currentIndex].category;
  } else {
    cardForm.reset();
  }
  cardDialog.showModal();
  questionInput.focus();
}

function closeDialog() {
  cardDialog.close();
  formError.textContent = "";
}

$("addBtn").addEventListener("click", () => openDialog("add"));
$("editBtn").addEventListener("click", () => {
  if (cards.length) openDialog("edit");
});
$("closeDialogBtn").addEventListener("click", closeDialog);
$("cancelBtn").addEventListener("click", closeDialog);

showAnswerBtn.addEventListener("click", () => {
  if (!cards.length) {
    openDialog("add");
    return;
  }
  showingAnswer = !showingAnswer;
  render();
});

prevBtn.addEventListener("click", () => {
  if (currentIndex > 0) {
    currentIndex -= 1;
    showingAnswer = false;
    render();
  }
});

nextBtn.addEventListener("click", () => {
  if (currentIndex < cards.length - 1) {
    currentIndex += 1;
    showingAnswer = false;
    render();
  }
});

$("deleteBtn").addEventListener("click", () => {
  if (!cards.length) return;
  const question = cards[currentIndex].question;
  if (!window.confirm(`Delete this flashcard?\n\n"${question}"`)) return;
  cards.splice(currentIndex, 1);
  if (currentIndex >= cards.length) currentIndex = Math.max(0, cards.length - 1);
  showingAnswer = false;
  saveCards();
  render();
  showToast("Flashcard deleted.");
});

cardForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const question = questionInput.value.trim();
  const answer = answerInput.value.trim();
  const category = categoryInput.value.trim() || "General";

  if (!question || !answer) {
    formError.textContent = "Please enter both a question and an answer.";
    return;
  }

  const newCard = { question, answer, category };
  if (editingIndex !== null) {
    cards[editingIndex] = newCard;
    currentIndex = editingIndex;
  } else {
    cards.push(newCard);
    currentIndex = cards.length - 1;
  }

  showingAnswer = false;
  saveCards();
  render();
  closeDialog();
  showToast(editingIndex !== null ? "Flashcard updated." : "Flashcard added.");
});

cardDialog.addEventListener("click", (event) => {
  if (event.target === cardDialog) closeDialog();
});

document.addEventListener("keydown", (event) => {
  if (cardDialog.open) return;
  if (event.key === "ArrowRight" && currentIndex < cards.length - 1) {
    currentIndex += 1;
    showingAnswer = false;
    render();
  } else if (event.key === "ArrowLeft" && currentIndex > 0) {
    currentIndex -= 1;
    showingAnswer = false;
    render();
  }
});

render();
