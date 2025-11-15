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
function displayPrompts(list = prompts) {
    const container = document.getElementById("promptList");
    container.innerHTML = "";

    list.forEach((p, index) => {
        const card = document.createElement("div");
        card.className = "card";

        card.innerHTML = `
            <img src="${p.image}" alt="${p.title}">
            <h3>${p.title}</h3>
            <p class="promptText">${p.prompt}</p>

            <button class="copy-btn" onclick="copyPrompt('${p.prompt.replace(/'/g, "\\'")}')">📋 Copy</button>

            <span>${p.tags.join(", ")}</span>

            <div class="card-actions">
                <button class="delete-btn" onclick="deletePrompt(${index})">🗑 Delete</button>
                <button class="edit-btn" onclick="editPrompt(${index})">✏ Edit</button>
            </div>
        `;

        container.appendChild(card);
    });
}

//
function savePrompts() {
    localStorage.setItem("prompts", JSON.stringify(prompts));
}

function loadPrompts() {
    const data = localStorage.getItem("prompts");
    if (data) {
        prompts.length = 0;
        prompts.push(...JSON.parse(data));
    }
}

loadPrompts();


//

function copyPrompt(text) {
    navigator.clipboard.writeText(text).then(() => {

        // Find all copy buttons
        const btns = document.querySelectorAll(".copy-btn");

        // Find the button that matches this text
        btns.forEach(btn => {
            if (btn.getAttribute("onclick").includes(text)) {
                btn.textContent = "✔ Copied!";
                btn.style.background = "#28a745";

                setTimeout(() => {
                    btn.textContent = "📋 Copy";
                    btn.style.background = "#111";
                }, 1200);
            }
        });

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
// delet promt
function deletePrompt(index) {
    prompts.splice(index, 1);
    savePrompts();
    displayPrompts();
}

//
let editIndex = null;

function editPrompt(index) {
    editIndex = index;

    document.getElementById("editTitle").value = prompts[index].title;
    document.getElementById("editText").value = prompts[index].prompt;
    document.getElementById("editTags").value = prompts[index].tags.join(", ");

    document.getElementById("editPopup").style.display = "flex";
}

function closePopup() {
    document.getElementById("editPopup").style.display = "none";
}

function saveEdit() {
    prompts[editIndex].title = document.getElementById("editTitle").value;
    prompts[editIndex].prompt = document.getElementById("editText").value;
    prompts[editIndex].tags = document.getElementById("editTags").value.split(",").map(t => t.trim());

    savePrompts();
    displayPrompts();
    closePopup();
}

//  
function searchPrompt() {
    const text = document.getElementById("searchInput").value.toLowerCase();
    const filtered = prompts.filter(p =>
        p.title.toLowerCase().includes(text) ||
        p.prompt.toLowerCase().includes(text) ||
        p.tags.join(" ").toLowerCase().includes(text)
    );

    displayPrompts(filtered);
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
