"use strict";(()=>{var I="Chatbot",D="#2563eb",A="#1e293b",F="#334155",z="#e2e8f0",R="Ask me anything to get started.";function S(s){let e=s.dataset,t=O(s.src),i=W(e.apiBase??t),n=e.position==="bottom-left"?"bottom-left":"bottom-right",a=f(e.accent)??D;return{apiBase:i,title:e.title??I,accent:a,launcherIcon:P(e.icon),panelColor:f(e.panel)??A,userBubbleColor:f(e.userBubble)??a,botBubbleColor:f(e.botBubble)??F,textColor:f(e.text)??z,position:n,allowSettings:e.allowSettings!=="false",greeting:e.greeting??R,storageKey:e.storageKey??`chatbot:${i||"self"}`,debug:e.debug==="true"}}function O(s){try{return new URL(s,location.href).origin}catch{return""}}function W(s){return s.endsWith("/")?s.slice(0,-1):s}function P(s){if(!s)return"";let e=s.trim();return/^(https?:|data:image\/|\/)/i.test(e)?e:""}function f(s){if(!s)return;let e=s.trim(),t=/^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i,i=/^(?:rgb|rgba|hsl|hsla)\(\s*[0-9.,%\s/]+\)$/i,n=/^[a-z]+$/i;if(t.test(e)||i.test(e)||n.test(e))return e}var v="[chatbot-widget]",w=!1;function L(s){w=s,s&&console.info(v,"verbose logging enabled")}var r={debug(...s){w&&console.debug(v,...s)},info(...s){console.info(v,...s)},warn(...s){console.warn(v,...s)},error(...s){console.error(v,...s)}};var y=class{constructor(e){this.historyKey=`${e}:history`,this.settingsKey=`${e}:settings`,this.themeKey=`${e}:theme`}loadConversation(){return this.read(this.historyKey)??{threadId:null,messages:[]}}saveConversation(e){this.write(this.historyKey,e)}loadSettings(){return this.read(this.settingsKey)}saveSettings(e){this.write(this.settingsKey,e)}loadTheme(){return this.read(this.themeKey)}saveTheme(e){this.write(this.themeKey,e)}read(e){try{let t=sessionStorage.getItem(e);return t?JSON.parse(t):null}catch(t){return r.warn("failed to read from session storage",{key:e,error:t}),null}}write(e,t){try{sessionStorage.setItem(e,JSON.stringify(t))}catch(i){r.warn("failed to write to session storage",{key:e,error:i})}}};function $(s){let e=[];for(let t of s.split(`

`)){let i="message",n=[];for(let a of t.split(`
`))if(a.startsWith("event:"))i=a.slice(6).trim();else if(a.startsWith("data:")){let o=a.slice(5);o.startsWith(" ")&&(o=o.slice(1)),n.push(o)}n.length>0&&e.push({event:i,data:n.join(`
`)})}return e}async function M(s,e,t,i,n,a){let o=await fetch(`${s}/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:e,threadId:t,overrides:i}),signal:a});if(r.debug("chat request sent",{apiBase:s,threadId:t,hasOverrides:i!==null}),!o.ok||!o.body)throw r.error("chat request failed",{status:o.status,hasBody:o.body!==null}),new Error(`Chat request failed with status ${o.status}.`);let c=o.body.getReader(),x=new TextDecoder,d="",u=0,b=0,g=0;for(;;){let{value:m,done:h}=await c.read();if(h)break;d+=x.decode(m,{stream:!0});let l=d.lastIndexOf(`

`);if(l===-1)continue;let C=d.slice(0,l+2);d=d.slice(l+2);for(let H of $(C)){let p=K(H);p.type==="thread"?(u+=1,n.onThread(p.data)):p.type==="delta"?(b+=1,n.onDelta(p.data)):p.type==="reasoning"?(g+=1,n.onReasoning(p.data)):r.debug("ignoring stream frame",{type:p.type})}}r.debug("chat stream complete",{threadEvents:u,deltaEvents:b,reasoningEvents:g})}function K(s){if(s.event&&s.event!=="message")return{type:s.event,data:s.data};try{let e=JSON.parse(s.data);if(e&&typeof e.eventType=="string")return{type:e.eventType,data:typeof e.data=="string"?e.data:""}}catch{}return{type:s.event,data:s.data}}async function k(s){try{let e=await fetch(`${s}/settings`);if(!e.ok)return r.warn("default settings request returned a non-OK status",{status:e.status}),null;let t=await e.json();return r.debug("default settings loaded",t.data??null),t.data??null}catch(e){return r.warn("failed to fetch default settings",e),null}}function B(s){let e=s.position==="bottom-left"?"left: 24px;":"right: 24px;",t=s.position==="bottom-left"?"flex-start":"flex-end";return`
:host {
    --cb-bg: #0f172a;
    --cb-panel: ${s.panelColor};
    --cb-panel-2: #182233;
    --cb-surface: #0f172a;
    --cb-user: ${s.userBubbleColor};
    --cb-bot: ${s.botBubbleColor};
    --cb-text: ${s.textColor};
    --cb-muted: #94a3b8;
    --cb-border: #334155;
    --cb-accent: ${s.accent};
    position: fixed;
    bottom: 24px;
    ${e}
    z-index: 2147483000;
    font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
}

/* Light theme palette: applied for the explicit "light" choice and for
   "system" when the OS prefers a light colour scheme. */
:host([data-cb-theme="light"]),
:host([data-cb-theme="system"]) {
    color-scheme: light dark;
}

:host([data-cb-theme="light"]) {
    --cb-bg: #f8fafc;
    --cb-panel: #ffffff;
    --cb-panel-2: #f1f5f9;
    --cb-surface: #ffffff;
    --cb-bot: #e2e8f0;
    --cb-text: #0f172a;
    --cb-muted: #64748b;
    --cb-border: #cbd5e1;
}

@media (prefers-color-scheme: light) {
    :host([data-cb-theme="system"]) {
        --cb-bg: #f8fafc;
        --cb-panel: #ffffff;
        --cb-panel-2: #f1f5f9;
        --cb-surface: #ffffff;
        --cb-bot: #e2e8f0;
        --cb-text: #0f172a;
        --cb-muted: #64748b;
        --cb-border: #cbd5e1;
    }
}

* {
    box-sizing: border-box;
}

.cb-root {
    display: flex;
    flex-direction: column;
    align-items: ${t};
    gap: 12px;
}

.cb-launcher {
    width: 60px;
    height: 60px;
    border: none;
    border-radius: 50%;
    background: var(--cb-accent);
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
    transition: transform 0.15s ease, filter 0.15s ease;
}

.cb-launcher:hover {
    filter: brightness(1.08);
    transform: translateY(-2px);
}

.cb-launcher svg {
    width: 26px;
    height: 26px;
}

.cb-launcher-icon {
    width: 30px;
    height: 30px;
    object-fit: contain;
    border-radius: 50%;
}

.cb-panel {
    width: 380px;
    height: 560px;
    max-height: calc(100vh - 120px);
    background: var(--cb-panel);
    border: 1px solid var(--cb-border);
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
    color: var(--cb-text);
}

.cb-panel[hidden] {
    display: none;
}

.cb-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    background: var(--cb-panel-2);
    border-bottom: 1px solid var(--cb-border);
}

.cb-title {
    font-weight: 600;
    font-size: 15px;
}

.cb-actions {
    display: flex;
    gap: 6px;
}

.cb-icon-btn {
    width: 30px;
    height: 30px;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: var(--cb-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    transition: background 0.15s ease, color 0.15s ease;
}

.cb-icon-btn:hover {
    background: rgba(148, 163, 184, 0.15);
    color: var(--cb-text);
}

.cb-icon-btn svg {
    width: 18px;
    height: 18px;
}

.cb-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.cb-empty {
    margin: auto;
    color: var(--cb-muted);
    font-size: 14px;
    text-align: center;
}

.cb-notice {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 14px;
    border: 1px solid var(--cb-accent);
    border-radius: 12px;
    background: color-mix(in srgb, var(--cb-accent) 14%, var(--cb-panel));
    color: var(--cb-text);
    font-size: 13px;
    line-height: 1.45;
}

.cb-notice-text {
    white-space: pre-wrap;
    word-wrap: break-word;
}

.cb-notice-btn {
    align-self: flex-start;
    border: none;
    border-radius: 8px;
    padding: 6px 12px;
    background: var(--cb-accent);
    color: #fff;
    font-size: 13px;
    cursor: pointer;
}

.cb-notice-btn:hover {
    filter: brightness(1.08);
}

.cb-message {
    max-width: 80%;
    padding: 10px 12px;
    border-radius: 12px;
    font-size: 14px;
    line-height: 1.45;
    white-space: pre-wrap;
    word-wrap: break-word;
}

.cb-message.user {
    align-self: flex-end;
    background: var(--cb-user);
    color: #fff;
    border-bottom-right-radius: 4px;
}

.cb-message.bot {
    align-self: flex-start;
    background: var(--cb-bot);
    color: var(--cb-text);
    border-bottom-left-radius: 4px;
}

.cb-thinking {
    margin: 0 0 8px;
    border: 1px solid var(--cb-border);
    border-radius: 8px;
    background: var(--cb-panel-2);
}

.cb-thinking-summary {
    cursor: pointer;
    list-style: none;
    padding: 6px 10px;
    font-size: 12px;
    font-weight: 600;
    color: var(--cb-muted);
    user-select: none;
}

.cb-thinking-summary::-webkit-details-marker {
    display: none;
}

.cb-thinking-summary::before {
    content: "\\25B8";
    display: inline-block;
    margin-right: 6px;
    transition: transform 0.15s ease;
}

.cb-thinking[open] .cb-thinking-summary::before {
    transform: rotate(90deg);
}

.cb-thinking-body {
    padding: 0 10px 8px;
    font-size: 12px;
    line-height: 1.4;
    color: var(--cb-muted);
    white-space: pre-wrap;
    word-wrap: break-word;
}

.cb-typing {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 0;
}

.cb-typing-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--cb-muted);
    animation: cb-typing-bounce 1.2s infinite ease-in-out both;
}

.cb-typing-dot:nth-child(2) {
    animation-delay: 0.15s;
}

.cb-typing-dot:nth-child(3) {
    animation-delay: 0.3s;
}

@keyframes cb-typing-bounce {
    0%, 60%, 100% {
        transform: translateY(0);
        opacity: 0.4;
    }
    30% {
        transform: translateY(-4px);
        opacity: 1;
    }
}

.cb-composer {
    display: flex;
    gap: 8px;
    padding: 12px;
    border-top: 1px solid var(--cb-border);
    background: var(--cb-panel-2);
}

.cb-composer textarea {
    flex: 1;
    resize: none;
    border: 1px solid var(--cb-border);
    border-radius: 10px;
    background: var(--cb-bg);
    color: var(--cb-text);
    padding: 10px 12px;
    font: inherit;
    font-size: 14px;
    max-height: 120px;
}

.cb-composer textarea:focus {
    outline: none;
    border-color: var(--cb-accent);
}

.cb-send {
    border: none;
    border-radius: 10px;
    background: var(--cb-accent);
    color: #fff;
    padding: 0 16px;
    font-weight: 600;
    cursor: pointer;
    transition: filter 0.15s ease;
}

.cb-send:hover:not(:disabled) {
    filter: brightness(1.08);
}

.cb-send:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.cb-dialog {
    position: fixed;
    inset: 0;
    margin: auto;
    width: min(420px, calc(100vw - 32px));
    max-height: min(560px, calc(100vh - 32px));
    padding: 0;
    border: 1px solid var(--cb-border);
    border-radius: 14px;
    background: var(--cb-surface);
    color: var(--cb-text);
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.45);
    overflow: hidden;
    flex-direction: column;
}

.cb-dialog[open] {
    display: flex;
}

.cb-dialog::backdrop {
    background: rgba(0, 0, 0, 0.5);
}

.cb-dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-bottom: 1px solid var(--cb-border);
    flex-shrink: 0;
}

.cb-dialog-body {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.cb-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    color: var(--cb-muted);
}

.cb-field[hidden] {
    display: none;
}

.cb-field input,
.cb-field select,
.cb-field textarea {
    border: 1px solid var(--cb-border);
    border-radius: 8px;
    background: var(--cb-bg);
    color: var(--cb-text);
    padding: 8px 10px;
    font: inherit;
    font-size: 13px;
    font-weight: 400;
}

.cb-field input:focus,
.cb-field select:focus,
.cb-field textarea:focus {
    outline: none;
    border-color: var(--cb-accent);
}

.cb-field textarea {
    resize: vertical;
}

.cb-hint {
    margin: 0;
    font-size: 11px;
    color: var(--cb-muted);
    line-height: 1.4;
}

.cb-settings-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 14px 16px;
    border-top: 1px solid var(--cb-border);
    flex-shrink: 0;
}

.cb-settings-actions button {
    border: none;
    border-radius: 8px;
    padding: 8px 14px;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
}

.cb-ghost {
    background: transparent;
    color: var(--cb-muted);
    border: 1px solid var(--cb-border) !important;
}

.cb-ghost:hover {
    color: var(--cb-text);
}

.cb-primary {
    background: var(--cb-accent);
    color: #fff;
}

.cb-primary:hover {
    filter: brightness(1.08);
}

@media (max-width: 480px) {
    :host {
        bottom: 16px;
        ${s.position==="bottom-left"?"left: 16px;":"right: 16px;"}
    }

    .cb-panel {
        width: calc(100vw - 32px);
        height: calc(100vh - 110px);
    }
}
`}var T={mode:"model",openAIEndpoint:"",deploymentName:"",foundryProjectEndpoint:"",foundryAgentId:"",foundryAgentVersion:"",systemPrompt:"",agentName:""},j='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3C6.48 3 2 6.94 2 11.5c0 2.3 1.13 4.37 2.96 5.86-.13 1.06-.6 2.45-1.62 3.4-.2.2-.06.55.22.53 1.9-.16 3.62-.86 4.9-1.86.78.2 1.6.31 2.45.31 5.52 0 10-3.94 10-8.5S17.52 3 12 3z"/></svg>',U='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.03 7.03 0 0 0-1.62-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.59.24-1.13.56-1.62.94l-2.39-.96a.5.5 0 0 0-.6.22L2.74 8.84a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.14.24.42.34.66.22l2.39-.96c.49.38 1.03.7 1.62.94l.36 2.54c.04.24.25.42.5.42h3.84c.25 0 .46-.18.5-.42l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.24.12.52.02.66-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z"/></svg>',_='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM8 9h8v10H8V9zm7.5-5l-1-1h-5l-1 1H5v2h14V4h-3.5z"/></svg>',N='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 1a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0V2a1 1 0 0 1 1-1zm0 18a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0v-2a1 1 0 0 1 1-1zM1 12a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2H2a1 1 0 0 1-1-1zm18 0a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2h-2a1 1 0 0 1-1-1zM4.22 4.22a1 1 0 0 1 1.42 0l1.41 1.41a1 1 0 0 1-1.42 1.42L4.22 5.64a1 1 0 0 1 0-1.42zm12.73 12.73a1 1 0 0 1 1.41 0l1.42 1.41a1 1 0 0 1-1.42 1.42l-1.41-1.42a1 1 0 0 1 0-1.41zM19.78 4.22a1 1 0 0 1 0 1.42l-1.41 1.41a1 1 0 0 1-1.42-1.42l1.42-1.41a1 1 0 0 1 1.41 0zM7.05 16.95a1 1 0 0 1 0 1.41l-1.41 1.42a1 1 0 0 1-1.42-1.42l1.42-1.41a1 1 0 0 1 1.41 0z"/></svg>',V='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.5 5.5 0 0 1-7.54-7.54A9.05 9.05 0 0 0 12 3z"/></svg>',E=class{constructor(e,t){this.settings={...T};this.theme="system";this.isOpen=!1;this.isBusy=!1;this.settingsLoaded=!1;this.configNotice=null;this.settingsToggle=null;this.themeToggleBtn=null;this.settingsInputs={};this.themeSelect=null;this.modelFields=[];this.agentFields=[];this.streamingEl=null;this.streamingMessage=null;this.streamFrame=0;this.streamDone=!1;this.shownTextLen=0;this.shownReasoningLen=0;this.streamTextEl=null;this.streamReasoningWrap=null;this.streamReasoningBody=null;this.streamTypingEl=null;this.streamTick=()=>{this.streamFrame=0;let e=this.streamingMessage,t=this.streamingEl;if(e===null||t===null)return;let i=e.reasoning??"",n=e.text;this.shownReasoningLen=this.advanceReveal(this.shownReasoningLen,i.length),this.shownTextLen=this.advanceReveal(this.shownTextLen,n.length);let a=this.isScrolledToBottom();if(this.shownReasoningLen>0&&(this.ensureReasoningNodes(t),this.streamReasoningBody.textContent=i.slice(0,this.shownReasoningLen)),this.shownTextLen>0&&(this.streamTypingEl!==null&&(this.streamTypingEl.remove(),this.streamTypingEl=null),this.ensureTextNode(t),this.streamTextEl.textContent=n.slice(0,this.shownTextLen)),a&&this.scrollToBottom(),this.shownTextLen>=n.length&&this.shownReasoningLen>=i.length){this.streamDone&&this.finalizeStreaming();return}this.streamFrame=requestAnimationFrame(this.streamTick)};this.config=t,this.store=new y(t.storageKey),this.conversation=this.store.loadConversation(),this.host=e,this.root=e.attachShadow({mode:"open"}),this.theme=this.store.loadTheme()??"system",this.build(),this.applyTheme(this.theme,!1),this.loadSettings(),this.renderMessages()}build(){let e=document.createElement("style");e.textContent=B(this.config),this.root.appendChild(e);let t=document.createElement("div");t.className="cb-root",this.panel=this.buildPanel(),this.launcher=this.buildLauncher(),t.appendChild(this.panel),t.appendChild(this.launcher),this.root.appendChild(t)}buildLauncher(){let e=document.createElement("button");return e.type="button",e.className="cb-launcher",e.title="Open chat",e.addEventListener("click",()=>this.toggleOpen()),this.launcher=e,this.renderLauncherIcon(),e}renderLauncherIcon(){if(this.isOpen){this.launcher.textContent="\u2715";return}let e=this.config.launcherIcon;if(e){let t=document.createElement("img");t.className="cb-launcher-icon",t.src=e,t.alt="",this.launcher.replaceChildren(t);return}this.launcher.innerHTML=j}buildPanel(){let e=document.createElement("div");return e.className="cb-panel",e.setAttribute("role","dialog"),e.setAttribute("aria-label",this.config.title),e.hidden=!0,e.appendChild(this.buildHeader()),this.messagesEl=document.createElement("div"),this.messagesEl.className="cb-messages",e.appendChild(this.messagesEl),this.composerEl=this.buildComposer(),e.appendChild(this.composerEl),this.settingsDialog=this.buildSettingsDialog(),e.appendChild(this.settingsDialog),e}buildHeader(){let e=document.createElement("div");e.className="cb-header";let t=document.createElement("span");t.className="cb-title",t.textContent=this.config.title;let i=document.createElement("div");i.className="cb-actions";let n=this.buildIconButton(_,"Clear chat",()=>this.clearChat());i.appendChild(n),this.themeToggleBtn=this.buildIconButton(N,"Toggle theme",()=>this.toggleTheme()),this.renderThemeToggleIcon(),i.appendChild(this.themeToggleBtn),this.config.allowSettings&&(this.settingsToggle=this.buildIconButton(U,"Settings",()=>this.openSettings()),i.appendChild(this.settingsToggle));let a=this.buildIconButton("\u2715","Close",()=>this.toggleOpen());return i.appendChild(a),e.appendChild(t),e.appendChild(i),e}buildIconButton(e,t,i){let n=document.createElement("button");return n.type="button",n.className="cb-icon-btn",n.title=t,e.startsWith("<")?n.innerHTML=e:n.textContent=e,n.addEventListener("click",i),n}buildComposer(){let e=document.createElement("form");return e.className="cb-composer",this.textarea=document.createElement("textarea"),this.textarea.rows=1,this.textarea.placeholder="Type a message\u2026",this.textarea.addEventListener("keydown",t=>{t.key==="Enter"&&!t.shiftKey&&(t.preventDefault(),this.submit())}),this.textarea.addEventListener("input",()=>this.refreshSendState()),this.sendButton=document.createElement("button"),this.sendButton.type="submit",this.sendButton.className="cb-send",this.sendButton.textContent="Send",this.sendButton.disabled=!0,e.addEventListener("submit",t=>{t.preventDefault(),this.submit()}),e.appendChild(this.textarea),e.appendChild(this.sendButton),e}buildSettingsDialog(){let e=document.createElement("dialog");e.className="cb-dialog",e.setAttribute("aria-label","Settings"),e.addEventListener("click",C=>{C.target===e&&this.closeSettings()});let t=document.createElement("div");t.className="cb-dialog-header";let i=document.createElement("span");i.className="cb-title",i.textContent="Settings";let n=this.buildIconButton("\u2715","Close",()=>this.closeSettings());t.appendChild(i),t.appendChild(n),e.appendChild(t);let a=document.createElement("div");a.className="cb-dialog-body",a.appendChild(this.buildThemeField());let o=this.buildSelectField("mode","Mode",[{value:"model",label:"Model"},{value:"agent",label:"Foundry Agent"}]);o.input.addEventListener("change",()=>this.applyModeVisibility()),a.appendChild(o.field);let c=this.buildTextField("openAIEndpoint","OpenAI Endpoint","https://...openai.azure.com/openai/v1"),x=this.buildTextField("deploymentName","Deployment Name","gpt-4o-mini");this.modelFields=[c,x];let d=this.buildTextField("foundryProjectEndpoint","Foundry Project Endpoint","https://...services.ai.azure.com/api/projects/..."),u=this.buildTextField("foundryAgentId","Agent Id","my-agent"),b=this.buildTextField("foundryAgentVersion","Agent Version","(latest)");this.agentFields=[d,u,b],a.appendChild(c),a.appendChild(x),a.appendChild(d),a.appendChild(u),a.appendChild(b),a.appendChild(this.buildTextField("agentName","Agent Name","ChatAgent")),a.appendChild(this.buildTextAreaField("systemPrompt","System Prompt","You are a friendly, concise assistant."));let g=document.createElement("p");g.className="cb-hint",g.textContent="Saving applies these settings to this browser session and starts a new conversation. Secrets are never overridable from the UI.",a.appendChild(g),e.appendChild(a);let m=document.createElement("div");m.className="cb-settings-actions";let h=document.createElement("button");h.type="button",h.className="cb-ghost",h.textContent="Cancel",h.addEventListener("click",()=>this.closeSettings());let l=document.createElement("button");return l.type="button",l.className="cb-primary",l.textContent="Save & restart",l.addEventListener("click",()=>this.saveSettings()),m.appendChild(h),m.appendChild(l),e.appendChild(m),e}buildTextField(e,t,i){let n=document.createElement("label");n.className="cb-field",n.appendChild(document.createTextNode(t));let a=document.createElement("input");return a.type="text",a.placeholder=i,n.appendChild(a),this.settingsInputs[e]=a,n}buildTextAreaField(e,t,i){let n=document.createElement("label");n.className="cb-field",n.appendChild(document.createTextNode(t));let a=document.createElement("textarea");return a.rows=3,a.placeholder=i,n.appendChild(a),this.settingsInputs[e]=a,n}buildThemeField(){let e=document.createElement("label");e.className="cb-field",e.appendChild(document.createTextNode("Theme"));let t=document.createElement("select"),i=[{value:"system",label:"System"},{value:"light",label:"Light"},{value:"dark",label:"Dark"}];for(let n of i){let a=document.createElement("option");a.value=n.value,a.textContent=n.label,t.appendChild(a)}return t.addEventListener("change",()=>this.applyTheme(t.value)),e.appendChild(t),this.themeSelect=t,e}applyTheme(e,t=!0){this.theme=e,this.host.setAttribute("data-cb-theme",e),this.themeSelect&&(this.themeSelect.value=e),this.renderThemeToggleIcon(),t&&this.store.saveTheme(e)}effectiveTheme(){return this.theme==="light"||this.theme==="dark"?this.theme:typeof window.matchMedia=="function"&&window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}toggleTheme(){let e=this.effectiveTheme()==="light"?"dark":"light";this.applyTheme(e)}renderThemeToggleIcon(){if(!this.themeToggleBtn)return;let e=this.effectiveTheme()==="light";this.themeToggleBtn.innerHTML=e?V:N,this.themeToggleBtn.title=e?"Switch to dark theme":"Switch to light theme"}buildSelectField(e,t,i){let n=document.createElement("label");n.className="cb-field",n.appendChild(document.createTextNode(t));let a=document.createElement("select");for(let o of i){let c=document.createElement("option");c.value=o.value,c.textContent=o.label,a.appendChild(c)}return n.appendChild(a),this.settingsInputs[e]=a,{field:n,input:a}}loadSettings(){let e=this.store.loadSettings();if(e){this.settings={...T,...e},this.settingsLoaded=!0;return}k(this.config.apiBase).then(t=>{t&&(this.settings={...T,...t},t.configured===!1&&(this.configNotice=t.configurationMessage??"The chatbot backend isn't fully configured yet. Open Settings to provide the required values.",this.renderMessages())),this.settingsLoaded=!0})}populateSettingsForm(){this.themeSelect&&(this.themeSelect.value=this.theme);for(let e of Object.keys(this.settingsInputs)){let t=this.settingsInputs[e];t&&(t.value=this.settings[e]??"")}this.applyModeVisibility()}applyModeVisibility(){let t=(this.settingsInputs.mode?.value??"model")==="model";for(let i of this.modelFields)i.hidden=!t;for(let i of this.agentFields)i.hidden=t}saveSettings(){let e={...T};for(let t of Object.keys(this.settingsInputs))e[t]=this.settingsInputs[t]?.value??"";this.settings=e,this.store.saveSettings(e),this.conversation={threadId:null,messages:[]},this.persist(),this.renderMessages(),this.closeSettings()}openSettings(){this.populateSettingsForm(),this.settingsDialog.showModal()}closeSettings(){this.settingsDialog.close()}toggleOpen(){this.isOpen=!this.isOpen,this.panel.hidden=!this.isOpen,this.renderLauncherIcon(),this.launcher.title=this.isOpen?"Close chat":"Open chat",this.isOpen&&(this.scrollToBottom(),this.textarea.focus())}refreshSendState(){this.sendButton.disabled=this.isBusy||this.textarea.value.trim().length===0}submit(){let e=this.textarea.value.trim();!e||this.isBusy||(this.textarea.value="",this.refreshSendState(),this.send(e))}async send(e){this.conversation.messages.push({role:"user",text:e});let t={role:"bot",text:""};this.conversation.messages.push(t),this.renderMessages(),this.setBusy(!0),this.beginStreaming(t);let i=this.settingsLoaded?this.settings:null;r.debug("sending message",{length:e.length,threadId:this.conversation.threadId});try{await M(this.config.apiBase,e,this.conversation.threadId,i,{onThread:n=>{this.conversation.threadId=n},onDelta:n=>{t.text+=n,this.startStreamLoop()},onReasoning:n=>{t.reasoning=(t.reasoning??"")+n,this.startStreamLoop()}}),r.debug("message exchange finished",{replyLength:t.text.length})}catch(n){r.error("chat request failed",n),t.text="Sorry, something went wrong. Please try again."}finally{this.finishStreaming(),this.setBusy(!1),this.persist()}}setBusy(e){this.isBusy=e,this.textarea.disabled=e,this.refreshSendState()}renderMessages(){if(this.messagesEl.replaceChildren(),this.configNotice&&this.messagesEl.appendChild(this.buildConfigNotice(this.configNotice)),this.conversation.messages.length===0){let e=document.createElement("div");e.className="cb-empty",e.textContent=this.config.greeting,this.messagesEl.appendChild(e);return}for(let e of this.conversation.messages){let t=document.createElement("div");t.className=`cb-message ${e.role}`,e.role==="bot"?this.renderBotMessage(t,e):t.textContent=e.text,this.messagesEl.appendChild(t)}this.scrollToBottom()}renderBotMessage(e,t){if(e.replaceChildren(),t.reasoning){let n=document.createElement("details");n.className="cb-thinking",n.open=this.isBusy;let a=document.createElement("summary");a.className="cb-thinking-summary",a.textContent=this.isBusy?"Thinking\u2026":"Thoughts";let o=document.createElement("div");o.className="cb-thinking-body",o.textContent=t.reasoning,n.append(a,o),e.appendChild(n)}if(!t.text&&this.isBusy){e.appendChild(this.buildTypingIndicator());return}let i=document.createElement("div");i.className="cb-text",i.textContent=t.text,e.appendChild(i)}buildTypingIndicator(){let e=document.createElement("div");e.className="cb-typing",e.setAttribute("aria-label","Processing");for(let t=0;t<3;t+=1){let i=document.createElement("span");i.className="cb-typing-dot",e.appendChild(i)}return e}buildConfigNotice(e){let t=document.createElement("div");t.className="cb-notice",t.setAttribute("role","status");let i=document.createElement("div");if(i.className="cb-notice-text",i.textContent=e,t.appendChild(i),this.config.allowSettings){let n=document.createElement("button");n.type="button",n.className="cb-notice-btn",n.textContent="Open Settings",n.addEventListener("click",()=>this.openSettings()),t.appendChild(n)}return t}scrollToBottom(){this.messagesEl.scrollTop=this.messagesEl.scrollHeight}beginStreaming(e){let t=this.messagesEl.lastElementChild;this.streamingEl=t instanceof HTMLDivElement?t:null,this.streamingMessage=e,this.streamDone=!1,this.shownTextLen=0,this.shownReasoningLen=0,this.streamTextEl=null,this.streamReasoningWrap=null,this.streamReasoningBody=null,this.streamTypingEl=null,this.streamingEl!==null&&(this.streamingEl.replaceChildren(),this.streamTypingEl=this.buildTypingIndicator(),this.streamingEl.appendChild(this.streamTypingEl)),this.startStreamLoop()}startStreamLoop(){this.streamFrame===0&&this.streamingEl!==null&&(this.streamFrame=requestAnimationFrame(this.streamTick))}advanceReveal(e,t){if(e>=t)return t;let i=t-e,n=Math.min(Math.max(2,Math.ceil(i/8)),24);return Math.min(t,e+n)}ensureReasoningNodes(e){if(this.streamReasoningWrap!==null)return;let t=document.createElement("details");t.className="cb-thinking",t.open=!0;let i=document.createElement("summary");i.className="cb-thinking-summary",i.textContent="Thinking\u2026";let n=document.createElement("div");n.className="cb-thinking-body",t.append(i,n),e.insertBefore(t,e.firstChild),this.streamReasoningWrap=t,this.streamReasoningBody=n}ensureTextNode(e){if(this.streamTextEl!==null)return;let t=document.createElement("div");t.className="cb-text",e.appendChild(t),this.streamTextEl=t}finishStreaming(){if(this.streamDone=!0,this.streamingEl===null||this.streamingMessage===null){this.clearStreamState(),this.renderMessages();return}this.startStreamLoop()}finalizeStreaming(){if(this.streamTypingEl!==null&&(this.streamTypingEl.remove(),this.streamTypingEl=null),this.streamReasoningWrap!==null){this.streamReasoningWrap.open=!1;let e=this.streamReasoningWrap.querySelector(".cb-thinking-summary");e!==null&&(e.textContent="Thoughts")}this.clearStreamState()}clearStreamState(){this.streamFrame!==0&&(cancelAnimationFrame(this.streamFrame),this.streamFrame=0),this.streamingEl=null,this.streamingMessage=null,this.streamTextEl=null,this.streamReasoningWrap=null,this.streamReasoningBody=null,this.streamTypingEl=null,this.streamDone=!1,this.shownTextLen=0,this.shownReasoningLen=0}isScrolledToBottom(){let{scrollTop:e,scrollHeight:t,clientHeight:i}=this.messagesEl;return t-(e+i)<=24}persist(){this.store.saveConversation(this.conversation)}clearChat(){this.isBusy||(this.conversation={threadId:null,messages:[]},this.persist(),this.renderMessages(),r.debug("conversation cleared"))}};function q(){let s=document.currentScript??Y();if(!s){r.error("could not locate the embedding <script> element; widget not mounted");return}let e=S(s);L(e.debug),r.debug("resolved configuration",e);let t=()=>{let i=document.createElement("div");i.setAttribute("data-chatbot-widget",""),document.body.appendChild(i),new E(i,e),r.info("widget mounted",{apiBase:e.apiBase})};document.readyState==="loading"?(r.debug("document still loading; deferring mount until DOMContentLoaded"),document.addEventListener("DOMContentLoaded",t,{once:!0})):t()}function Y(){let s=document.querySelectorAll("script[src*='chatbot-widget']");return s.length>0?s[s.length-1]:null}q();})();
