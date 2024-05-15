import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";
import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";
import { HarmBlockThreshold, HarmCategory } from "https://esm.run/@google/generative-ai";


const version = "0.0";

//inputs
const ApiKeyInput = document.querySelector("#apiKeyInput");
const maxTokensInput = document.querySelector("#maxTokens");
const temperatureInput = document.querySelector("#temperature");
const messageInput = document.querySelector("#messageInput");

//forms
const addPersonalityForm = document.querySelector("#form-add-personality");
const editPersonalityForm = document.querySelector("#form-edit-personality");

//buttons
const sendMessageButton = document.querySelector("#btn-send");
const clearAllButton = document.querySelector("#btn-clearall-personality");
const whatsNewButton = document.querySelector("#btn-whatsnew");
const submitNewPersonalityButton = document.querySelector("#btn-submit-personality");
const importPersonalityButton = document.querySelector("#btn-import-personality");
const addPersonalityButton = document.querySelector("#btn-add-personality");
const hideOverlayButton = document.querySelector("#btn-hide-overlay");
const submitPersonalityEditButton = document.querySelector("#btn-submit-personality-edit");
const hideSidebarButton = document.querySelector("#btn-hide-sidebar");
const showSidebarButton = document.querySelector("#btn-show-sidebar");
const deleteAllChatsButton = document.querySelector("#btn-reset-chat");
const newChatButton = document.querySelector("#btn-new-chat");

//containers
const sidebar = document.querySelector(".sidebar");
const messageContainer = document.querySelector(".message-container");
const personalityCards = document.getElementsByClassName("card-personality");
const formsOverlay = document.querySelector(".overlay");
const sidebarViews = document.getElementsByClassName("sidebar-section");
const defaultPersonalityCard = document.querySelector("#card-personality-default");
const chatHistorySection = document.querySelector("#chatHistorySection");

//nav elements
const tabs = document.getElementsByClassName("navbar-tab");
const tabHighlight = document.querySelector(".navbar-tab-highlight");

//outputs
const temperatureLabel = document.querySelector("#label-temperature");

//misc
const badge = document.querySelector("#btn-whatsnew");

//-------------------------------

//load api key from local storage into input field
ApiKeyInput.value = localStorage.getItem("API_KEY");
if (!localStorage.getItem("maxTokens")) maxTokensInput.value = 1000;

//set initial temperature
temperatureInput.value = localStorage.getItem("TEMPERATURE");
if (!localStorage.getItem("TEMPERATURE")) temperatureInput.value = 70;
temperatureLabel.textContent = temperatureInput.value/100;

//define AI settings
const safetySettings = [

    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },

];
const systemPrompt = "If needed, format your answer using markdown." +
    "Today's date is" + new Date().toDateString() + "." +
    "End of system prompt.";

//setup tabs
let currentTab = undefined;
tabHighlight.style.width = `calc(100% / ${tabs.length})`;
[...tabs].forEach(tab => {
    tab.addEventListener("click", () => {
        navigateTo(tab);
    })
});

[...sidebarViews].forEach(view => {
    hideElement(view);
});

navigateTo(tabs[0]);

//load personalities on launch
const personalitiesArray = JSON.parse(getLocalPersonalities());
if (personalitiesArray) {
    for (let personality of personalitiesArray) {
        insertPersonality(personality);
    }
}
let personalityToEditIndex = 0;

//add default personality card event listeners and initial state
const shareButton = defaultPersonalityCard.querySelector(".btn-share-card");
const editButton = defaultPersonalityCard.querySelector(".btn-edit-card");
const input = defaultPersonalityCard.querySelector("input");

shareButton.addEventListener("click", () => {
    sharePersonality(defaultPersonalityCard);
}
);

editButton.addEventListener("click", () => {
    alert("You cannot edit the default personality card.");
    return;
});

input.addEventListener("change", () => {
    // Darken all cards
    [...personalityCards].forEach(card => {
        card.style.outline = "0px solid rgb(150 203 236)";
        darkenBg(card);
    })
    // Lighten selected card
    input.parentElement.style.outline = "3px solid rgb(150 203 236)";
    lightenBg(input.parentElement);
});

if (input.checked) {
    lightenBg(input.parentElement);
    input.parentElement.style.outline = "3px solid rgb(150 203 236)";
}

//setup version number on badge and header
badge.querySelector("#badge-version").textContent = `v${version}`;
document.getElementById('header-version').textContent += ` v${version}`;

//show whats new on launch if new version
const prevVersion = localStorage.getItem("version");
if (prevVersion != version) {
    localStorage.setItem("version", version);
    badge.classList.add("badge-highlight");
    setTimeout(() => {
        badge.classList.remove("badge-highlight");
    }, 7000);
}

//indexedDB setup
let db = new Dexie("chatDB");
let currentChat = null;
db.version(3).stores({
    chats: `
        ++id,
        title,
        timestamp,
        content`,
});


//get all chats and load them in the template
let chats = await getAllChatIdentifiers();
for (let chat of chats) {
    insertChatHistory(chat);
}


//event listeners
hideOverlayButton.addEventListener("click", closeOverlay);

addPersonalityButton.addEventListener("click", showAddPersonalityForm);

submitNewPersonalityButton.addEventListener("click", submitNewPersonality);

submitPersonalityEditButton.addEventListener("click", () => { submitPersonalityEdit(personalityToEditIndex) });

temperatureInput.addEventListener("input", () => {
    temperatureLabel.textContent = temperatureInput.value/100;
});

sendMessageButton.addEventListener("click", async () => {
    try {
        await run(messageInput,  getSelectedPersonality(), getChatHistory());
    } catch (error) {
        console.error(error);
        alert(error)
    }
});

newChatButton.addEventListener("click", () => {
    if (!currentChat) {
        return
    }
    currentChat = null;
    messageContainer.innerHTML = "";
    document.querySelector("input[name='currentChat']:checked").checked = false;
});

//enter key to send message but support shift+enter for new line
messageInput.addEventListener("keydown", (e) => {
    if (e.key == "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessageButton.click();
    }
});

whatsNewButton.addEventListener("click", showWhatsNew);

hideSidebarButton.addEventListener("click", () => {
    hideElement(sidebar);
});

showSidebarButton.addEventListener("click", () => {
    showElement(sidebar);
});

clearAllButton.addEventListener("click", () => {
    localStorage.removeItem("personalities");
    [...personalityCards].forEach(card => {
        if (card != defaultPersonalityCard) {
            card.remove();
        }
    });
});

deleteAllChatsButton.addEventListener("click", deleteAllChats);

importPersonalityButton.addEventListener("click", () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = function (e) {
            const personalityJSON = JSON.parse(e.target.result);
            insertPersonality(personalityJSON);
            setLocalPersonality(personalityJSON);
        };
        reader.readAsText(file);
    });
    fileInput.click();
    fileInput.remove();
});

window.addEventListener("resize", () => {
    //show sidebar if window is resized to desktop size
    if (window.innerWidth > 768) {
        showElement(document.querySelector(".sidebar"));
    }
});

messageInput.addEventListener("input", () => {
    //auto resize message input
    if (messageInput.value.split("\n").length == 1) {
        messageInput.style.height = "2.5rem";
    }
    else {
        messageInput.style.height = "";
        messageInput.style.height = messageInput.scrollHeight + "px";
    }
});

//-------------------------------

//functions
function hideElement(element) {
    element.style.transition = 'opacity 0.2s';
    element.style.opacity = '0';
    setTimeout(function () {
        element.style.display = 'none';
    }, 200);
}

function showElement(element) {
    // Wait for other transitions to complete (0.2s delay)
    setTimeout(function () {
        // Change display property
        element.style.display = 'flex';
        // Wait for next frame for display change to take effect
        requestAnimationFrame(function () {
            // Start opacity transition
            element.style.transition = 'opacity 0.2s';
            element.style.opacity = '1';
        });
    }, 200);
}

function darkenBg(element) {
    let elementBackgroundImageURL = element.style.backgroundImage.match(/url\((.*?)\)/)[1].replace(/('|")/g, '');
    element.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('${elementBackgroundImageURL}')`;
}

function lightenBg(element) {

    let elementBackgroundImageURL = element.style.backgroundImage.match(/url\((.*?)\)/)[1].replace(/('|")/g, '');
    element.style.backgroundImage = `url('${elementBackgroundImageURL}')`;
}

function navigateTo(tab) {
    if (tab == tabs[currentTab]) {
        return;
    }
    tab.classList.add("navbar-tab-active");

    // set the highlight to match the size of the tab element
    let tabIndex = [...tabs].indexOf(tab);
    if (tabIndex < 0 || tabIndex >= sidebarViews.length) {
        console.error("Invalid tab index: " + tabIndex);
        return;
    }

    if (currentTab != undefined) {
        hideElement(sidebarViews[currentTab]);
        tabs[currentTab].classList.remove("navbar-tab-active");
    }
    showElement(sidebarViews[tabIndex]);
    currentTab = tabIndex;


    tabHighlight.style.left = `calc(100% / ${tabs.length} * ${tabIndex})`;

}

async function getAllChatIdentifiers() {
    try {
        let identifiers = [];
        await db.chats.orderBy('timestamp').each(
            chat => {
                identifiers.push({ id: chat.id, title: chat.title });
            }
        )
        return identifiers;
    } catch (error) {
        //to be implemented
        console.log(error);
    }
}

async function getAllChats() {
    try {
        const chats = await db.chats.orderBy('timestamp').toArray(); // Get all objects
        chats.reverse() //reverse in order to have the latest chat at the top
        return chats;
    } catch (error) {
        console.error("Error getting titles:", error);
        throw error;
    }
}

async function getChatById(id) {
    try {
        const chat = await db.chats.get(id);
        return chat;
    } catch (error) {
        console.log(error);
    }
}

async function onChatSelect(chatID, inputElement) {
    try {
        messageContainer.innerHTML = "";
        let chat = await getChatById(chatID);
        for await (let msg of chat.content) {
            await insertMessage(msg.role, msg.txt, msg.personality);
        }
        currentChat = chatID;
        messageContainer.scrollTo(0, messageContainer.scrollHeight);
        inputElement.click();
    } catch (error) {
        console.error(error);
    }
}

async function deleteChat(id) {
    try {
        await db.chats.delete(id);
        const input = chatHistorySection.querySelector(`#chat${id}`);
        input.nextElementSibling.remove();
        input.remove();
        if (currentChat == id) {
            messageContainer.innerHTML = "";
            currentChat = null;
        }
    } catch (error) {
        return console.error(error);
    }
}

async function deleteAllChats() {
    try {
        await db.chats.clear();
        messageContainer.innerHTML = "";
        chatHistorySection.innerHTML = "";
        currentChat = "";
    }
    catch (error) {
        console.error("error deleting chats: ", error);
    }
}

function getSelectedPersonality(){
    try {
        const selectedPersonalityProps = document.querySelector("input[name='personality']:checked + div");
        return {
            title: selectedPersonalityProps.querySelector(".personality-title").textContent,
            description: selectedPersonalityProps.querySelector(".personality-description").textContent,
            prompt: selectedPersonalityProps.querySelector(".personality-prompt").textContent,
            tone: []
        }
    } catch (error) {
        alert("No personality selected.");
        console.error(error);
        return;
    }
}

function getChatHistory(){
    let chatHistory = [];
    [...messageContainer.children].forEach(element => {
        const messageroleapi = element.querySelector(".message-role-api").innerText;
        const messagetext = element.querySelector(".message-text").innerText;
        chatHistory.push({
            role: messageroleapi,
            parts: [{ text: messagetext }]
        })
    });
    return chatHistory;
}

function insertChatHistory(chat) {
    const chatLabel = document.createElement("label");
    chatLabel.setAttribute("for", "chat" + chat.id);
    chatLabel.classList.add("title-chat");
    chatLabel.textContent = chat.title;

    const historyEntry = document.createElement("div");
    historyEntry.classList.add("label-currentchat");

    const chatIcon = document.createElement("span");
    chatIcon.classList.add("material-symbols-outlined");
    chatIcon.innerHTML = "chat_bubble";

    const deleteEntryButton = document.createElement("button");
    deleteEntryButton.classList.add("btn-textual", "material-symbols-outlined");
    deleteEntryButton.textContent = "delete";
    deleteEntryButton.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteChat(chat.id);
    })

    historyEntry.append(chatIcon);
    historyEntry.append(chatLabel);
    historyEntry.append(deleteEntryButton);

    chatHistorySection.prepend(historyEntry);

    const chatElement = document.createElement("input");
    chatElement.setAttribute("type", "radio");
    chatElement.setAttribute("name", "currentChat");
    chatElement.setAttribute("value", "chat" + chat.id);
    chatElement.id = "chat" + chat.id;
    chatElement.classList.add("input-radio-currentchat");
    chatHistorySection.prepend(chatElement);
    //
    historyEntry.addEventListener("click", async () => { await onChatSelect(chat.id, chatElement); });
}





