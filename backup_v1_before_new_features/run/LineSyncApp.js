// ==UserScript==
// @name         LineSync Plus - Native React Event Bot
// @namespace    http://tampermonkey.net/
// @version      21.0
// @description  บอทพิมพ์ข้อความและกระตุ้น State ฟอร์มของ LINE OA อย่างสมบูรณ์
// @match        https://chat.line.biz/*
// @grant        GM_xmlhttpRequest
// @connect      localhost
// ==/UserScript==

(function() {
    'use strict';

    const API_BASE = 'http://localhost:3000/api';
    const CHECK_INTERVAL = 4000;

    console.log("🤖 LineSync Plus Bot v21.0: พร้อมทำงาน...");

    function fetchAPI(endpoint, method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            const options = {
                method: method,
                url: `${API_BASE}${endpoint}`,
                headers: { 'Content-Type': 'application/json' },
                onload: function(response) {
                    if (response.status >= 200 && response.status < 300) {
                        try { resolve(JSON.parse(response.responseText)); }
                        catch (e) { resolve(response.responseText); }
                    } else {
                        reject(`Error: ${response.status}`);
                    }
                },
                onerror: function(err) { reject(err); }
            };
            if (data) options.data = JSON.stringify(data);
            GM_xmlhttpRequest(options);
        });
    }

    async function processQueue() {
        if (window.location.href.includes('/error')) {
            window.location.href = "https://chat.line.biz/";
            return;
        }

        try {
            const job = await fetchAPI('/campaign/next');
            if (job && job.status === 'processing') {
                console.log("📥 ได้คิวส่งหา User ID:", job.userId);

                sessionStorage.setItem('linesync_msg', job.message);
                sessionStorage.setItem('linesync_uid', job.userId);

                const match = window.location.pathname.match(/^\/([a-zA-Z0-9]+)/);
                if (match) {
                    const botId = match[1];
                    const targetUrl = `https://chat.line.biz/${botId}/chat/${job.userId}`;
                    if (window.location.href !== targetUrl) {
                        window.location.href = targetUrl;
                        return;
                    }
                }

                await executeChatBot(job.userId, job.message);

            } else {
                setTimeout(processQueue, CHECK_INTERVAL);
            }
        } catch (err) {
            console.log("❌ รอเชื่อมต่อเซิร์ฟเวอร์ NestJS...");
            setTimeout(processQueue, CHECK_INTERVAL);
        }
    }

    async function executeChatBot(userId, message) {
        console.log("🔍 กำลังค้นหาช่องพิมพ์ในห้องแชท...");

        let attempts = 0;
        const findAndType = setInterval(async () => {
            attempts++;

            function deepQuerySelector(selector, root = document) {
                let found = root.querySelector(selector);
                if (found) return found;

                const allElements = root.querySelectorAll('*');
                for (let el of allElements) {
                    if (el.shadowRoot) {
                        let target = deepQuerySelector(selector, el.shadowRoot);
                        if (target) return target;
                    }
                }
                return null;
            }

            const chatInput = deepQuerySelector('textarea[part="input"]') || deepQuerySelector('textarea');

            if (chatInput) {
                clearInterval(findAndType);
                chatInput.style.border = "3px solid red";
                console.log("✅ เจอช่องพิมพ์แล้ว กำลังพิมพ์ข้อความแบบบังคับ State...");

                try {
                    chatInput.focus();
                    chatInput.click();

                    // บังคับเปลี่ยนค่าผ่าน Native Setter ของเบราว์เซอร์
                    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
                    if (nativeInputValueSetter) {
                        nativeInputValueSetter.call(chatInput, message);
                    } else {
                        chatInput.value = message;
                    }

                    // ยิง Event ให้ครบทุกชุดเพื่ออัปเดต Framework State
                    chatInput.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
                    chatInput.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
                    chatInput.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: message }));

                    console.log("✍️ พิมพ์ข้อความสำเร็จ รอคลิกปุ่มส่งใน 1.5 วินาที...");

                    setTimeout(() => {
                        const submitBtn = deepQuerySelector('input[type="submit"].btn-primary') ||
                                          deepQuerySelector('input[type="submit"]') ||
                                          deepQuerySelector('input.btn-primary');

                        if (submitBtn) {
                            console.log("🚀 [DEBUG] สั่งคลิกปุ่ม Submit ส่งข้อความจริง!");
                            submitBtn.removeAttribute('disabled');
                            submitBtn.click();
                        } else {
                            console.warn("⚠️ [DEBUG] ไม่พบปุ่ม Submit ใช้การจำลอง Enter");
                            chatInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
                        }

                        setTimeout(async () => {
                            console.log("✅ ส่งข้อความสำเร็จ แจ้งหลังบ้าน...");
                            await finishJob(userId);
                        }, 2000);

                    }, 1500);

                } catch (e) {
                    console.error("❌ เกิด Error ตอนส่ง:", e);
                    await finishJob(userId);
                }
            } else if (attempts > 30) {
                clearInterval(findAndType);
                console.error("❌ หาช่องพิมพ์ไม่เจอ ข้ามคิวนี้...");
                await finishJob(userId);
            }
        }, 1000);
    }

    async function finishJob(userId) {
        try {
            sessionStorage.removeItem('linesync_msg');
            sessionStorage.removeItem('linesync_uid');
            await fetchAPI('/campaign/success', 'POST', { userId: userId });
        } catch(e) {
            console.error("❌ ส่งรายงานไม่สำเร็จ");
        } finally {
            setTimeout(processQueue, 3000);
        }
    }

    window.addEventListener('load', () => {
        setTimeout(() => {
            const savedMsg = sessionStorage.getItem('linesync_msg');
            const savedUid = sessionStorage.getItem('linesync_uid');
            if (savedMsg && savedUid && window.location.href.includes(savedUid)) {
                console.log("🚀 โหลดหน้าแชทสำเร็จ เริ่มพิมพ์ข้อความต่อ...");
                executeChatBot(savedUid, savedMsg);
            } else {
                processQueue();
            }
        }, 2000);
    });

})();