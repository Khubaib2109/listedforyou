const CONFIG = {
  // Add a real endpoint when ready, for example Formspree, Basin, Tally, Supabase Edge Function or your own API.
  // If empty, the form runs in demo mode and saves the latest submission in this browser.
  formEndpoint: "",
  businessEmail: "hello@listedforyou.com.au"
};

const body = document.body;
const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector("#site-nav");
const form = document.querySelector("#request-form");
const itemTemplate = document.querySelector("#item-template");
const itemsList = document.querySelector("#items-list");
const addItemButton = document.querySelector("#add-item");
const downloadButton = document.querySelector("#download-summary");
const statusBox = document.querySelector("#form-status");

navToggle.addEventListener("click", () => {
  const isOpen = navToggle.getAttribute("aria-expanded") === "true";
  navToggle.setAttribute("aria-expanded", String(!isOpen));
  body.classList.toggle("nav-open", !isOpen);
});

siteNav.addEventListener("click", (event) => {
  if (event.target.matches("a")) {
    navToggle.setAttribute("aria-expanded", "false");
    body.classList.remove("nav-open");
  }
});

function addItem() {
  const fragment = itemTemplate.content.cloneNode(true);
  itemsList.appendChild(fragment);
  refreshItemNumbers();
}

function refreshItemNumbers() {
  const cards = [...itemsList.querySelectorAll("[data-item-card]")];
  cards.forEach((card, index) => {
    card.querySelector("[data-item-number]").textContent = index + 1;
    const removeButton = card.querySelector("[data-remove-item]");
    removeButton.hidden = cards.length === 1;
  });
}

function showStatus(message, type = "success") {
  statusBox.textContent = message;
  statusBox.className = `form-status visible ${type}`;
}

function clearInvalidStates() {
  form.querySelectorAll(".invalid").forEach((field) => field.classList.remove("invalid"));
}

function validateForm() {
  clearInvalidStates();
  const requiredFields = [...form.querySelectorAll("[required]")];
  const invalidFields = requiredFields.filter((field) => {
    if (field.type === "checkbox") {
      return !field.checked;
    }
    return !field.value.trim();
  });

  invalidFields.forEach((field) => field.classList.add("invalid"));

  if (invalidFields.length) {
    invalidFields[0].focus();
    showStatus("Please fill in the required fields before submitting.", "error");
    return false;
  }

  return true;
}

function collectSubmission() {
  const formData = new FormData(form);
  const cards = [...itemsList.querySelectorAll("[data-item-card]")];
  const items = cards.map((card, index) => {
    const photos = [...card.querySelector('input[name="photos"]').files].map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type
    }));

    return {
      itemNumber: index + 1,
      title: card.querySelector('input[name="itemTitle"]').value.trim(),
      minimumPrice: card.querySelector('input[name="minimumPrice"]').value.trim(),
      condition: card.querySelector('select[name="condition"]').value,
      details: card.querySelector('input[name="details"]').value.trim(),
      photos
    };
  });

  return {
    submittedAt: new Date().toISOString(),
    customer: {
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      suburb: formData.get("suburb")
    },
    preferences: {
      urgency: formData.get("urgency"),
      contactMethod: formData.get("contactMethod"),
      notes: formData.get("notes")
    },
    items
  };
}

function buildEmailBody(submission) {
  const lines = [
    "New Listed For You request",
    "",
    `Name: ${submission.customer.fullName}`,
    `Email: ${submission.customer.email}`,
    `Phone: ${submission.customer.phone}`,
    `Suburb: ${submission.customer.suburb}`,
    `Urgency: ${submission.preferences.urgency}`,
    `Preferred contact: ${submission.preferences.contactMethod}`,
    "",
    "Notes:",
    submission.preferences.notes || "None",
    "",
    "Items:"
  ];

  submission.items.forEach((item) => {
    lines.push(
      "",
      `Item ${item.itemNumber}: ${item.title}`,
      `Minimum price: ${item.minimumPrice || "Not provided"}`,
      `Condition: ${item.condition}`,
      `Details: ${item.details || "None"}`,
      `Photo files selected: ${item.photos.length ? item.photos.map((photo) => photo.name).join(", ") : "None"}`
    );
  });

  return lines.join("\n");
}

function downloadSubmission(submission = collectSubmission()) {
  const blob = new Blob([JSON.stringify(submission, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `listed-for-you-request-${date}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function submitToEndpoint(submission) {
  const payload = new FormData(form);
  payload.append("submissionJson", JSON.stringify(submission));

  const response = await fetch(CONFIG.formEndpoint, {
    method: "POST",
    body: payload,
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error("Form endpoint rejected the request.");
  }
}

function saveDemoSubmission(submission) {
  localStorage.setItem("listedForYouLatestSubmission", JSON.stringify(submission));
  const subject = encodeURIComponent("New Listed For You request");
  const body = encodeURIComponent(buildEmailBody(submission));
  const mailto = `mailto:${CONFIG.businessEmail}?subject=${subject}&body=${body}`;
  window.location.href = mailto;
}

form.addEventListener("change", (event) => {
  if (!event.target.matches('input[type="file"]')) {
    return;
  }

  const card = event.target.closest("[data-item-card]");
  const preview = card.querySelector("[data-photo-preview]");
  preview.innerHTML = "";

  [...event.target.files].slice(0, 8).forEach((file) => {
    const image = document.createElement("img");
    image.alt = file.name;
    image.src = URL.createObjectURL(file);
    image.addEventListener("load", () => URL.revokeObjectURL(image.src), { once: true });
    preview.appendChild(image);
  });
});

itemsList.addEventListener("click", (event) => {
  if (!event.target.matches("[data-remove-item]")) {
    return;
  }

  event.target.closest("[data-item-card]").remove();
  refreshItemNumbers();
});

addItemButton.addEventListener("click", addItem);

downloadButton.addEventListener("click", () => {
  if (!validateForm()) {
    return;
  }

  downloadSubmission();
  showStatus("Request summary downloaded. Photo files stay on your device unless you connect a form endpoint.", "success");
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!validateForm()) {
    return;
  }

  const submission = collectSubmission();

  try {
    if (CONFIG.formEndpoint) {
      await submitToEndpoint(submission);
      showStatus("Thanks. Your request has been submitted and we will review it soon.", "success");
      form.reset();
      itemsList.innerHTML = "";
      addItem();
      return;
    }

    saveDemoSubmission(submission);
    showStatus("Demo request prepared. Your email app should open with the request details. Connect a form endpoint to receive uploads directly.", "success");
  } catch (error) {
    showStatus("Something went wrong while submitting. Please try again or email us directly.", "error");
  }
});

addItem();
