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












