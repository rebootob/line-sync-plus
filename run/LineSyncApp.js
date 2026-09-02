// ==UserScript==
// @name         LineSync Plus - Native React Event Bot
// @namespace    http://tampermonkey.net/
// @version      27.0
// @description  บอทพิมพ์ข้อความ แนบรูปภาพ LINE OA อัตโนมัติ (รองรับ Auto Return to Main Chat List ป้องกันค้างหน้าแชทผู้ใช้)
// @match        https://chat.line.biz/*
// @match        https://manager.line.biz/*
// @grant        GM_xmlhttpRequest
// @connect      *
// ==/UserScript==

(function() {
    'use strict';

    const API_BASE = 'http://localhost:3005/api';
    const CHECK_INTERVAL = 4000;

    let consecutiveErrorCount = parseInt(sessionStorage.getItem('linesync_consecutive_errors') || '0', 10);

    console.log("🤖 LineSync Plus Bot v27.0: พร้อมทำงาน (Auto Return to Main Chat List System)...");

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

    function deepQuerySelectorAll(selector, root = document) {
        let results = Array.from(root.querySelectorAll(selector));
        const allElements = root.querySelectorAll('*');
        for (let el of allElements) {
            if (el.shadowRoot) {
                results = results.concat(deepQuerySelectorAll(selector, el.shadowRoot));
            }
        }
        return results;
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 🛑 ตรวจจับข้อความเตือนโควต้า LINE OA เต็มบนหน้าจอ
    function checkQuotaLimitExceeded() {
        const allEls = deepQuerySelectorAll('p, div, span, alert, ui-alert, section, h1, h2, h3');
        const limitBanner = allEls.find(el => {
            try {
                const txt = String(el.textContent || el.innerText || '').trim();
                if (txt.length > 250) return false;
                return txt.includes('ส่งข้อความเกินโควต้า') || 
                       txt.includes('โควต้าเต็ม') || 
                       txt.includes('บรอดแคสต์เต็มโควต้าแล้ว') || 
                       txt.includes('Quota limit exceeded') || 
                       txt.includes('Reached monthly limit') ||
                       txt.includes('โควต้าคงเหลือไม่เพียงพอ') ||
                       txt.includes('ไม่สามารถส่งบรอดแคสต์เพิ่มได้') ||
                       txt.includes('โควต้าข้อความของเดือนนี้หมดแล้ว');
            } catch(e) { return false; }
        });
        return !!limitBanner;
    }

    // สแกนตรวจสอบว่าผู้ใช้บล็อก/แชทถูกปิดไม่สามารถส่งข้อความได้หรือไม่
    function checkIfChatDisabledOrBlocked(chatInput) {
        if (chatInput) {
            if (chatInput.disabled || chatInput.readOnly) return true;
            const ph = String(chatInput.placeholder || '').toLowerCase();
            if (ph.includes('ไม่สามารถส่งข้อความ') || ph.includes('cannot send') || ph.includes('blocked') || ph.includes('บล็อก')) {
                return true;
            }
        }

        const allEls = deepQuerySelectorAll('p, div, span, alert, ui-alert, section');
        const blockedBanner = allEls.find(el => {
            try {
                const txt = String(el.textContent || el.innerText || '').trim();
                if (txt.length > 200) return false;
                return txt.includes('ไม่สามารถส่งข้อความได้') || 
                       txt.includes('ไม่สามารถส่งข้อความในห้องแชทนี้ได้') || 
                       txt.includes('ผู้ใช้บล็อกอยู่') || 
                       txt.includes('Cannot send message') || 
                       txt.includes('User blocked') ||
                       txt.includes('บัญชีนี้ถูกระงับ') ||
                       txt.includes('ไม่สามารถตอบกลับ');
            } catch(e) { return false; }
        });

        return !!blockedBanner;
    }

    // ฟังก์ชันยิงกดปุ่มยืนยันส่งรูปภาพเพียง 1 ครั้งถ้วน (Single Fire Strict - ห้ามวนลูปกดซ้ำเด็ดขาด)
    async function confirmAndCloseImageModal() {
        console.log("⏳ [DEBUG] 1. รอป๊อปอัปยืนยันรูปภาพปรากฏขึ้นมาบนหน้าจอ...");

        let confirmBtn = null;
        for (let i = 0; i < 15; i++) {
            const dialogs = deepQuerySelectorAll('ui-dialog, [role="dialog"], [class*="modal"], [class*="Dialog"]');
            if (dialogs.length > 0) {
                for (let dialog of dialogs) {
                    const btns = deepQuerySelectorAll('button, ui-button, [role="button"], span', dialog);
                    confirmBtn = btns.find(b => {
                        const txt = String(b.textContent || b.innerText || '').trim();
                        return txt === 'ส่ง' || txt === 'Send';
                    }) || (btns.length > 0 ? btns[btns.length - 1] : null);

                    if (confirmBtn) break;
                }
            }
            if (confirmBtn) break;
            await sleep(200);
        }

        if (!confirmBtn) {
            console.log("⚠️ ไม่พบป๊อปอัปยืนยันรูปภาพ ดำเนินการขั้นตอนถัดไป...");
            return;
        }

        console.log("🚀 [DEBUG] 2. พบป๊อปอัปแล้ว! สั่งกดปุ่ม [ส่ง] รูปภาพเพียง 1 ครั้งเท่านั้น (Single Fire)...");

        let target = confirmBtn;
        if (target.shadowRoot && target.shadowRoot.querySelector('button')) {
            target = target.shadowRoot.querySelector('button');
        }

        const opts = { bubbles: true, cancelable: true, composed: true, view: window };
        try { target.focus(); } catch(e){}
        try { target.dispatchEvent(new PointerEvent('pointerdown', opts)); } catch(e){}
        try { target.dispatchEvent(new MouseEvent('mousedown', opts)); } catch(e){}
        try { target.dispatchEvent(new PointerEvent('pointerup', opts)); } catch(e){}
        try { target.dispatchEvent(new MouseEvent('mouseup', opts)); } catch(e){}
        try { target.click(); } catch(e){}
        try { target.dispatchEvent(new MouseEvent('click', opts)); } catch(e){}

        console.log("✅ 3. สั่งกดส่งรูปภาพ 1 ครั้งสำเร็จ! รอ 4.5 วินาที ให้รูปภาพส่งลงห้องแชทเสร็จสมบูรณ์...");
        await sleep(4500);
        console.log("✅ 4. รูปภาพส่งลงห้องแชตเป็นอันดับแรกเรียบร้อยแล้ว!");
    }

    // ฟังก์ชันสั่งส่งข้อความในช่องแชท
    function sendChatMessage(chatInput) {
        console.log("🚀 [DEBUG] สั่งส่งข้อความในช่องแชท...");

        const allButtons = deepQuerySelectorAll('button, input[type="submit"], [role="button"], div, span');
        const chatSendBtns = allButtons.filter(el => {
            const txt = String(el.textContent || el.value || el.innerText || '').trim();
            if (txt !== 'ส่ง' && txt !== 'Send') return false;
            const rect = el.getBoundingClientRect();
            // ปุ่มส่งของช่องแชตอยู่บริเวณล่างขวา (top > 400)
            return rect.width > 0 && rect.height > 0 && rect.width < 150 && rect.top > 400;
        });

        if (chatSendBtns.length > 0) {
            let sendBtn = chatSendBtns.find(b => b.tagName.toLowerCase() === 'button') || chatSendBtns[0];
            if (sendBtn.shadowRoot && sendBtn.shadowRoot.querySelector('button')) {
                sendBtn = sendBtn.shadowRoot.querySelector('button');
            }

            console.log("✅ เจอและสั่งคลิกปุ่มส่งสีเขียวที่มุมล่างขวาช่องพิมพ์สำเร็จ!");
            const opts = { bubbles: true, cancelable: true, composed: true, view: window };
            try { sendBtn.focus(); } catch(e){}
            try { sendBtn.dispatchEvent(new PointerEvent('pointerdown', opts)); } catch(e){}
            try { sendBtn.dispatchEvent(new MouseEvent('mousedown', opts)); } catch(e){}
            try { sendBtn.dispatchEvent(new PointerEvent('pointerup', opts)); } catch(e){}
            try { sendBtn.dispatchEvent(new MouseEvent('mouseup', opts)); } catch(e){}
            try { sendBtn.click(); } catch(e){}
            try { sendBtn.dispatchEvent(new MouseEvent('click', opts)); } catch(e){}
        } else {
            const enterOpts = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true, composed: true, shiftKey: false };
            try { chatInput.dispatchEvent(new KeyboardEvent('keydown', enterOpts)); } catch(e){}
            try { chatInput.dispatchEvent(new KeyboardEvent('keypress', enterOpts)); } catch(e){}
            try { chatInput.dispatchEvent(new KeyboardEvent('keyup', enterOpts)); } catch(e){}
        }
    }

    function fetchImageBlob(url) {
        return new Promise((resolve) => {
            if (!url) return resolve(null);

            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                responseType: 'blob',
                onload: function(res) {
                    if (res.status === 200 && res.response) {
                        const blob = res.response;
                        if (blob.type && blob.type.includes('html')) {
                            const reader = new FileReader();
                            reader.onload = function() {
                                const htmlText = reader.result;
                                const parser = new DOMParser();
                                const doc = parser.parseFromString(htmlText, 'text/html');
                                const imgTag = doc.querySelector('meta[property="og:image"]') || 
                                               doc.querySelector('meta[name="twitter:image"]') || 
                                               doc.querySelector('img[src*="image"]');
                                if (imgTag) {
                                    let directSrc = imgTag.getAttribute('content') || imgTag.getAttribute('src');
                                    if (directSrc) {
                                        if (directSrc.startsWith('//')) directSrc = 'https:' + directSrc;
                                        else if (directSrc.startsWith('/')) {
                                            const u = new URL(url);
                                            directSrc = u.origin + directSrc;
                                        }
                                        console.log("🔍 สกัดเจอ Direct Image URL จากหน้าเว็บ:", directSrc);
                                        return fetchImageBlob(directSrc).then(resolve);
                                    }
                                }
                                resolve(null);
                            };
                            reader.readAsText(blob);
                        } else {
                            resolve({ blob: blob, contentType: blob.type });
                        }
                    } else {
                        resolve(null);
                    }
                },
                onerror: function() { resolve(null); }
            });
        });
    }

    async function processQueue() {
        if (window.location.href.includes('/tagaudience') || window.location.href.includes('/error')) {
            console.log("🔀 เด้งกลับจากหน้า tagaudience เข้าสู่หน้าหลัก LINE OA Chat...");
            window.location.href = "https://chat.line.biz/";
            return;
        }

        // 🛑 ตรวจจับโควต้าเต็มก่อนดึงคิวงานใหม่
        if (checkQuotaLimitExceeded()) {
            console.error("🛑 [CRITICAL] ตรวจพบการเตือนโควต้า LINE OA เต็ม! หยุดคิวงาน...");
            sessionStorage.clear();
            return;
        }

        try {
            const job = await fetchAPI('/campaign/next');
            if (job && job.status === 'processing') {
                console.log("📥 ได้คิวส่งหา User ID:", job.userId, "ประเภท:", job.messageType);

                sessionStorage.setItem('linesync_jobid', job.jobId || '');
                sessionStorage.setItem('linesync_msg', job.message || '');
                sessionStorage.setItem('linesync_uid', job.userId);
                sessionStorage.setItem('linesync_type', job.messageType || 'text');
                sessionStorage.setItem('linesync_img', job.imageUrl || '');
                sessionStorage.setItem('linesync_link', job.linkUrl || '');

                if (window.location.hostname.includes('manager.line.biz')) {
                    const matchBot = window.location.pathname.match(/account\/@?([a-zA-Z0-9]+)/);
                    const botId = matchBot ? matchBot[1] : '';
                    const targetUrl = botId ? `https://chat.line.biz/${botId}/chat/${job.userId}` : `https://chat.line.biz/`;
                    console.log("🔀 สลับจาก Manager ไปยังหน้าแชต LINE OA:", targetUrl);
                    window.location.href = targetUrl;
                    return;
                }

                const match = window.location.pathname.match(/^\/([a-zA-Z0-9]+)\/chat/);
                if (match) {
                    const botId = match[1];
                    const targetUrl = `https://chat.line.biz/${botId}/chat/${job.userId}`;
                    if (window.location.href !== targetUrl) {
                        window.location.href = targetUrl;
                        return;
                    }
                } else {
                    const matchBot = window.location.pathname.match(/^\/([a-zA-Z0-9]+)/);
                    if (matchBot) {
                        const botId = matchBot[1];
                        const targetUrl = `https://chat.line.biz/${botId}/chat/${job.userId}`;
                        if (window.location.href !== targetUrl) {
                            window.location.href = targetUrl;
                            return;
                        }
                    }
                }

                await executeChatBot(job);

            } else {
                // หากไม่มีงานคิวให้รันขณะนี้ และยังค้างอยู่ที่หน้าแชทผู้ใช้ ให้สลับกลับหน้าแชทหลัก
                if (window.location.pathname.includes('/chat/U') || window.location.pathname.includes('/chat/u')) {
                    closeUserChatAndReturnToMain();
                }
                setTimeout(processQueue, CHECK_INTERVAL);
            }
        } catch (err) {
            console.log("❌ รอเชื่อมต่อเซิร์ฟเวอร์ NestJS...");
            setTimeout(processQueue, CHECK_INTERVAL);
        }
    }

    // 🔙 ปิดหน้าต่างผู้ใช้และเปลี่ยนเส้นทางกลับสู่หน้าแชทหลัก (Main Chat List Page)
    function closeUserChatAndReturnToMain() {
        console.log("🔙 จบรอบการส่ง ปิดหน้าต่างผู้ใช้และกลับสู่หน้าแชทหลัก...");

        // 1. ลองหากดปุ่มปิดแชต (X) บนหน้าจอถ้ามี
        const closeBtns = deepQuerySelectorAll('button, a, [role="button"]').filter(el => {
            const aria = (el.getAttribute('aria-label') || '').toLowerCase();
            const text = String(el.textContent || el.innerText || '').trim().toLowerCase();
            const cls = String(el.className || '').toLowerCase();
            return aria.includes('close') || aria.includes('ปิด') || text === '✕' || text === 'x' || text === 'ปิด' || cls.includes('close-btn') || cls.includes('btn-close');
        });

        if (closeBtns.length > 0) {
            try {
                closeBtns[0].click();
                console.log("✅ กดปุ่มปิดแชทผู้ใช้สำเร็จ");
            } catch(e) {}
        }

        // 2. ถ้า URL ยังค้างในหน้าแชทรายคน (/chat/U...) ให้ redirect กลับไปยังหน้าหลักของบอตทันที
        if (window.location.pathname.includes('/chat/U') || window.location.pathname.includes('/chat/u')) {
            const basePath = window.location.pathname.split('/chat/U')[0].split('/chat/u')[0];
            const mainChatUrl = window.location.origin + (basePath || '/') + (basePath.endsWith('/') ? '' : '/');
            console.log(`🌐 สลับหน้ากลับเข้าสู่หน้าแชทหลัก: ${mainChatUrl}`);
            window.location.href = mainChatUrl;
        }
    }

    async function executeChatBot(jobData) {
        console.log("🔍 กำลังค้นหาช่องพิมพ์ในห้องแชท LINE OA...");

        // 🛑 ตรวจสอบข้อความเตือนโควต้าเต็มบนหน้าแชต
        if (checkQuotaLimitExceeded()) {
            console.error("🛑 [CRITICAL] ตรวจพบการเตือนโควต้า LINE OA เต็ม! สั่งหยุดส่งแคมเปญทันที...");
            await fetchAPI('/campaign/stop', 'POST', {
                jobId: jobData.jobId,
                reason: '🛑 สั่งหยุดแคมเปญทันทีเนื่องจากโควต้าข้อความ LINE OA เต็ม (Quota Exceeded Limit)',
                limitReached: true
            });
            sessionStorage.clear();
            alert('🛑 ระบบหยุดส่งแคมเปญอัตโนมัติ เนื่องจากโควต้าข้อความ LINE OA ของคุณเต็มแล้ว');
            return;
        }

        let attempts = 0;
        const maxAttempts = 50;

        const findAndType = setInterval(async () => {
            attempts++;

            if (attempts % 3 === 0) {
                const userListItems = deepQuerySelectorAll('li, a, div, span');
                const targetUserEl = userListItems.find(el => {
                    const href = el.getAttribute('href') || '';
                    return href.includes(jobData.userId);
                });
                if (targetUserEl) {
                    targetUserEl.click();
                }
            }

            const chatInput = deepQuerySelector('textarea[part="input"]') || deepQuerySelector('textarea');

            if (chatInput) {
                clearInterval(findAndType);
                chatInput.style.border = "3px solid #00c300";

                // 🚫 ตรวจสอบสถานะว่าผู้ใช้บล็อกแชท หรือ แชทถูกปิดไม่ให้ส่งข้อความหรือไม่
                if (checkIfChatDisabledOrBlocked(chatInput)) {
                    console.warn(`🚫 ตรวจพบผู้ใช้นี้บล็อก/ไม่สามารถส่งข้อความได้แล้ว (LINE UserId: ${jobData.userId})`);
                    await finishJob(jobData.jobId, jobData.userId, false, '🚫 บล็อก / ไม่สามารถส่งข้อความได้แล้ว', true);
                    return;
                }

                try {
                    let hasImageToSend = (jobData.messageType === 'image_link' || jobData.messageType === 'image_only') && jobData.imageUrl;

                    if (hasImageToSend) {
                        console.log("📸 1. กำลังแนบรูปภาพส่งขึ้นเป็นอันดับแรก...");
                        const imageData = await fetchImageBlob(jobData.imageUrl);
                        if (imageData && imageData.blob) {
                            const file = new File([imageData.blob], 'broadcast_image.png', { type: imageData.contentType || 'image/png' });
                            
                            const fileInput = deepQuerySelector('input[type="file"][accept*="image"]') || deepQuerySelector('input[type="file"]');
                            if (fileInput) {
                                const dt = new DataTransfer();
                                dt.items.add(file);
                                fileInput.files = dt.files;
                                fileInput.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
                                console.log("✅ แนบไฟล์รูปภาพผ่าน File Input สำเร็จ!");
                            } else {
                                const dt = new DataTransfer();
                                dt.items.add(file);
                                const pasteEvent = new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: dt });
                                chatInput.dispatchEvent(pasteEvent);
                                console.log("✅ จำลอง Paste รูปภาพใส่ช่องพิมพ์สำเร็จ!");
                            }

                            // สั่งเจาะกดปุ่มยืนยันส่งรูปภาพเพียง 1 ครั้งถ้วน (Single Fire Strict)
                            await confirmAndCloseImageModal();
                        }
                    }

                    let textToSend = '';
                    if (jobData.messageType === 'image_only') {
                        textToSend = ''; // รูปภาพอย่างเดียว ไม่ส่งข้อความใดๆ ตามหลัง
                    } else if (jobData.messageType === 'link_only') {
                        if (jobData.linkUrl) {
                            textToSend = (jobData.message && jobData.message !== '🖼️ [ส่งรูปภาพเดี่ยว]') 
                                ? `${jobData.message}\n\n🔗 ${jobData.linkUrl}` 
                                : jobData.linkUrl;
                        } else {
                            textToSend = jobData.message || '';
                        }
                    } else {
                        textToSend = (jobData.message && jobData.message !== '🖼️ [ส่งรูปภาพเดี่ยว]') ? jobData.message : '';
                        if (jobData.linkUrl) {
                            textToSend += textToSend ? `\n\n🔗 ดูรายละเอียดเพิ่มเติม: ${jobData.linkUrl}` : `🔗 ดูรายละเอียดเพิ่มเติม: ${jobData.linkUrl}`;
                        }
                    }

                    if (textToSend && textToSend.trim() !== '') {
                        console.log("✍️ 5. พิมพ์ข้อความ/ลิงก์ลงในช่องแชต...");
                        chatInput.focus();
                        chatInput.click();

                        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
                        if (nativeInputValueSetter) {
                            nativeInputValueSetter.call(chatInput, textToSend);
                        } else {
                            chatInput.value = textToSend;
                        }

                        chatInput.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
                        chatInput.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
                        chatInput.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: textToSend }));

                        await sleep(1200);
                        sendChatMessage(chatInput);

                        await sleep(3000);
                        console.log("✅ ส่งแคมเปญสำเร็จ 100%!");
                        await finishJob(jobData.jobId, jobData.userId, true);
                    } else {
                        await sleep(2000);
                        console.log("✅ ส่งแคมเปญรูปภาพอย่างเดียวสำเร็จ 100%!");
                        await finishJob(jobData.jobId, jobData.userId, true);
                    }

                } catch (e) {
                    console.error("❌ เกิด Error ตอนส่ง:", e);
                    await finishJob(jobData.jobId, jobData.userId, false, e.message || 'Error ในกระบวนการพิมพ์');
                }
            } else if (attempts > maxAttempts) {
                clearInterval(findAndType);
                const isBlocked = checkIfChatDisabledOrBlocked(null);
                const reason = isBlocked ? '🚫 บล็อก / ไม่สามารถส่งข้อความได้แล้ว' : 'หาช่องพิมพ์ไม่เจอภายในเวลาที่กำหนด';
                console.error(`❌ ${reason} ข้ามคิวนี้...`);
                await finishJob(jobData.jobId, jobData.userId, false, reason, isBlocked);
            }
        }, 1000);
    }

    async function finishJob(jobId, userId, success, reason = '', isBlocked = false) {
        try {
            if (success) {
                consecutiveErrorCount = 0;
                sessionStorage.setItem('linesync_consecutive_errors', '0');
                await fetchAPI('/campaign/success', 'POST', { jobId: jobId, userId: userId });
            } else {
                // 🚫 กรณีล้มเหลวเพราะผู้ใช้บล็อกแชท/ส่งไม่ได้ ไม่นับเป็น Error ระบบ (ไม่เพิ่มตัวนับ Circuit Breaker)
                const isUserBlocked = isBlocked || (reason && (reason.includes('บล็อก') || reason.includes('ไม่สามารถส่งข้อความ')));

                if (isUserBlocked) {
                    console.log(`ℹ️ ผู้ใช้บล็อกแชท/ส่งไม่ได้ (ไม่นับเป็น Error ระบบ): ${userId}`);
                } else {
                    consecutiveErrorCount++;
                    sessionStorage.setItem('linesync_consecutive_errors', String(consecutiveErrorCount));
                    console.warn(`⚠️ เกิด Error สะสมติดต่อกันแล้ว ${consecutiveErrorCount}/10 รายการ (${reason})`);
                }

                await fetchAPI('/campaign/fail', 'POST', { jobId: jobId, userId: userId, reason: reason, isBlocked: isBlocked });

                // 🚨 2. ตรวจสอบระบบเซฟตี้ Circuit Breaker (พบ Error ติดต่อกันเกิน 10 รายการ)
                if (consecutiveErrorCount >= 10) {
                    console.error("🚨 [CRITICAL] พบ Error ติดต่อกันเกิน 10 รายการ! สั่งหยุดสคริปต์ฉุกเฉิน (Circuit Breaker)...");
                    await fetchAPI('/campaign/stop', 'POST', {
                        jobId: jobId,
                        reason: '🚨 สคริปต์หยุดทำงานอัตโนมัติเนื่องจากพบ Error ติดต่อกันเกิน 10 รายการ',
                        errorOverflow: true
                    });
                    sessionStorage.clear();
                    alert('🚨 ระบบเซฟตี้หยุดสคริปต์อัตโนมัติ เนื่องจากพบ Error ติดต่อกันเกิน 10 รายการเพื่อความปลอดภัยของบัญชี LINE OA');
                    return;
                }
            }
        } catch(e) {
            console.error("❌ ส่งรายงานไม่สำเร็จ");
        } finally {
            sessionStorage.removeItem('linesync_jobid');
            sessionStorage.removeItem('linesync_msg');
            sessionStorage.removeItem('linesync_uid');
            sessionStorage.removeItem('linesync_type');
            sessionStorage.removeItem('linesync_img');
            sessionStorage.removeItem('linesync_link');

            // 🔙 จบรอบการส่ง 1 คน สลับหน้าจอกลับเข้าสู่หน้าแชตหลัก ป้องกันการเปิดแชตผู้ใช้ค้างไว้
            closeUserChatAndReturnToMain();
            setTimeout(processQueue, 3500);
        }
    }

    window.addEventListener('load', () => {
        setTimeout(() => {
            const savedJobId = sessionStorage.getItem('linesync_jobid');
            const savedMsg = sessionStorage.getItem('linesync_msg');
            const savedUid = sessionStorage.getItem('linesync_uid');
            const savedType = sessionStorage.getItem('linesync_type');
            const savedImg = sessionStorage.getItem('linesync_img');
            const savedLink = sessionStorage.getItem('linesync_link');

            if (savedMsg && savedUid && window.location.href.includes(savedUid)) {
                console.log("🚀 โหลดหน้าแชทสำเร็จ เริ่มพิมพ์ข้อความต่อ...");
                executeChatBot({
                    jobId: savedJobId,
                    userId: savedUid,
                    messageType: savedType,
                    message: savedMsg,
                    imageUrl: savedImg,
                    linkUrl: savedLink
                });
            } else {
                processQueue();
            }
        }, 2000);
    });

})();