/* ========================================
   API — Google Apps Script Backend v3
   설문 제출 → Sheets 저장 + 이메일(PDF+HTML) 발송
   ======================================== */

// GAS Web App URL (배포 후 실제 URL로 교체)
const GAS_URL = 'https://script.google.com/macros/s/AKfycbxU7Dk0ryUwr307qiA73Fgc4r80Nu-WJZblKHe8_lzeLtoGUeXWnVFTwFxIy-599CKn/exec';

/**
 * 설문 완료 시 백엔드로 응답+점수 전송 (Sheets 저장)
 */
async function sendToBackend(reportData) {
    if (!GAS_URL) {
        console.warn('GAS_URL 미설정. 로컬 저장만 됩니다.');
        return;
    }

    try {
        await fetch(GAS_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
                action: 'submit',
                responses: reportData.responses,
                scores: reportData.scores,
                timestamp: reportData.timestamp
            })
        });
        console.log('Sheets 저장 요청 완료');
    } catch (error) {
        console.error('Sheets 저장 실패:', error);
    }
}

/**
 * 보고서 페이지에서 PDF + HTML을 생성하여 이메일 발송
 */
async function sendEmailWithReport(pdfBase64, email) {
    if (!GAS_URL || !email) {
        console.warn('GAS_URL 또는 이메일 미설정.');
        return;
    }

    // HTML 보고서 생성 (실패해도 이메일은 발송)
    let reportHtml = null;
    try {
        console.log('HTML 보고서 생성 중...');
        reportHtml = await buildFullReportHtml();
        console.log('HTML 보고서 생성 완료 (' + Math.round(reportHtml.length / 1024) + 'KB)');
    } catch (e) {
        console.warn('HTML 생성 실패, 본문만 발송:', e);
    }

    try {
        console.log('GAS로 이메일 요청 전송 중...');
        await fetch(GAS_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
                action: 'sendEmail',
                email: email,
                pdf: pdfBase64 || null,
                reportHtml: reportHtml
            })
        });
        console.log('이메일 요청 전송 완료');
    } catch (error) {
        console.error('이메일 요청 전송 실패:', error);
    }
}

/**
 * 완전한 자체 HTML 보고서 생성
 * - 모든 CSS 인라인 포함
 * - Canvas 차트 → 이미지로 변환
 * - Spline iframe 제거
 * - 폰트 CDN 포함
 */
async function buildFullReportHtml() {
    // 1. 모든 CSS 수집 (linked + inline)
    let allCss = '';
    for (const sheet of document.styleSheets) {
        try {
            for (const rule of sheet.cssRules) {
                allCss += rule.cssText + '\n';
            }
        } catch (e) {
            // 크로스오리진 스타일시트는 fetch로 가져옴
            if (sheet.href) {
                try {
                    const res = await fetch(sheet.href);
                    allCss += await res.text() + '\n';
                } catch (_) {}
            }
        }
    }

    // 2. Canvas → 이미지 변환 (클론에서 작업)
    const container = document.getElementById('report-container');
    const clone = container.cloneNode(true);

    // Canvas를 이미지로 교체
    const originalCanvases = container.querySelectorAll('canvas');
    const cloneCanvases = clone.querySelectorAll('canvas');
    cloneCanvases.forEach((cloneCanvas, i) => {
        const original = originalCanvases[i];
        if (original) {
            try {
                const img = document.createElement('img');
                img.src = original.toDataURL('image/png');
                img.style.width = '100%';
                img.style.height = 'auto';
                cloneCanvas.parentNode.replaceChild(img, cloneCanvas);
            } catch (_) {
                cloneCanvas.remove();
            }
        }
    });

    // 3. action-bar 제거
    clone.querySelectorAll('.action-bar').forEach(el => el.remove());

    // 4. 정적 표지 숨기기 (Spline iframe 유지)
    const staticCover = clone.querySelector('#cover-static');
    if (staticCover) staticCover.style.display = 'none';

    const bodyContent = clone.innerHTML;

    return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI 활용 능력 진단 리포트 | 한국GPT협회</title>
<style>
@font-face { font-family: 'Paperlogy'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2408-3@1.0/Paperlogy-4Regular.woff2') format('woff2'); font-weight: 400; font-display: swap; }
@font-face { font-family: 'Paperlogy'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2408-3@1.0/Paperlogy-5Medium.woff2') format('woff2'); font-weight: 500; font-display: swap; }
@font-face { font-family: 'Paperlogy'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2408-3@1.0/Paperlogy-7Bold.woff2') format('woff2'); font-weight: 700; font-display: swap; }
@font-face { font-family: 'Paperlogy'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2408-3@1.0/Paperlogy-8ExtraBold.woff2') format('woff2'); font-weight: 800; font-display: swap; }
@font-face { font-family: 'Paperlogy'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2408-3@1.0/Paperlogy-9Black.woff2') format('woff2'); font-weight: 900; font-display: swap; }
${allCss}
/* 이메일용 오버라이드 */
body { background: #f5f5f5 !important; }
.action-bar { display: none !important; }
.cover-static { display: none !important; }
.report-page { margin: 2rem auto !important; }
</style>
</head>
<body>
${bodyContent}
</body>
</html>`;
}
