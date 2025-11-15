let prompts = [];

// Load JSON + localStorage
async function loadData() {
    const res = await fetch("prompts.json");
    const jsonData = await res.json();

    const localData = JSON.parse(localStorage.getItem("prompts")) || [];

    prompts = [...jsonData, ...localData];

    loadTags();
    displayPrompts(prompts);
}
loadData();

// Display Cards
function displayPrompts(list) {
    const container = document.getElementById("promptList");
    container.innerHTML = "";

    list.forEach(p => {
        const card = document.createElement("div");
        card.className = "card";

        card.innerHTML = `
            <img src="${p.image}" alt="${p.title}">
            <h3>${p.title}</h3>
            <p>${p.prompt}</p>
            <span>${p.tags.join(", ")}</span>
        `;

        container.appendChild(card);
    });
}

// Load Tags
function loadTags() {
    const dropdown = document.getElementById("tagFilter");
    const allTags = new Set();

    prompts.forEach(p => p.tags.forEach(tag => allTags.add(tag)));

    allTags.forEach(tag => {
        const opt = document.createElement("option");
        opt.value = tag;
        opt.textContent = tag;
        dropdown.appendChild(opt);
    });

    dropdown.addEventListener("change", filterByTag);
}

// Filter Logic
function filterByTag() {
    const selected = document.getElementById("tagFilter").value;

    if (selected === "all") {
        displayPrompts(prompts);
    } else {
        const filtered = prompts.filter(p => p.tags.includes(selected));
        displayPrompts(filtered);
    }
}

// Add Prompt Form
document.getElementById("promptForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const newPrompt = {
        title: document.getElementById("title").value,
        prompt: document.getElementById("promptText").value,
        image: document.getElementById("imageUrl").value,
        tags: document.getElementById("tags").value.split(",").map(t => t.trim())
    };

    // Save to localStorage
    const saved = JSON.parse(localStorage.getItem("prompts")) || [];
    saved.push(newPrompt);
    localStorage.setItem("prompts", JSON.stringify(saved));

    // Update page
    prompts.push(newPrompt);
    displayPrompts(prompts);

    alert("Prompt added successfully!");
});
