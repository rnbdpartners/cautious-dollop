/**
 * Google Apps Script — 메인 라우터 v3
 *
 * 배포 방법:
 * 1. https://script.google.com 에서 새 프로젝트 생성
 * 2. Code.gs, Sheets.gs, Email.gs 파일을 각각 추가
 * 3. Sheets.gs의 initializeSheet() 함수를 한 번 실행 (시트 헤더 셋업)
 * 4. 배포 > 새 배포 > 웹 앱 선택
 *    - 실행 사용자: 본인 (나)
 *    - 액세스 권한: 모든 사용자
 * 5. 배포된 URL을 js/api.js의 GAS_URL에 입력
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    if (action === 'submit') {
      // 1. 스프레드시트에 저장
      const sheetResult = saveToSheet(data);

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: '데이터 저장 완료',
        row: sheetResult
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'sendEmail') {
      // 2. 이메일 발송 (PDF + HTML 첨부)
      const emailResult = sendReportEmail(
        data.email,
        data.pdf || null,
        data.reportHtml || null
      );

      return ContentService.createTextOutput(JSON.stringify({
        success: emailResult,
        message: emailResult ? '이메일 발송 완료' : '이메일 발송 실패'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: '알 수 없는 액션: ' + action
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    message: 'AI 진단 서비스 API 정상 작동 중',
    version: 'v3'
  })).setMimeType(ContentService.MimeType.JSON);
}
