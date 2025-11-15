// Load JSON File
fetch("prompts.json")
    .then(res => res.json())
    .then(data => {
        loadTags(data);
        displayPrompts(data);
    });

// Display Prompt Cards
function displayPrompts(prompts) {
    const container = document.getElementById("promptList");
    container.innerHTML = "";

    prompts.forEach(p => {
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

// Load Dropdown Tags
function loadTags(prompts) {
    const allTags = new Set();

    prompts.forEach(p => p.tags.forEach(tag => allTags.add(tag)));

    const dropdown = document.getElementById("tagFilter");

    allTags.forEach(tag => {
        const opt = document.createElement("option");
        opt.value = tag;
        opt.textContent = tag;
        dropdown.appendChild(opt);
    });

    dropdown.addEventListener("change", () => filterByTag(prompts));
}

// Filter Logic
function filterByTag(prompts) {
    const selected = document.getElementById("tagFilter").value;

    if (selected === "all") {
        displayPrompts(prompts);
    } else {
        const filtered = prompts.filter(p => p.tags.includes(selected));
        displayPrompts(filtered);
    }
}
