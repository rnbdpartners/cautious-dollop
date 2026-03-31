/**
 * 이메일 발송 모듈 v3
 * HTML 보고서 본문 + PDF 첨부 파일 동시 발송
 *
 * GAS에서 GmailApp.sendEmail() 사용
 * replyTo: gpt@rnbdp.com
 * Gmail 설정에서 "다른 주소에서 메일 보내기"로 gpt@rnbdp.com 추가하면 from으로 발송 가능
 */

function sendReportEmail(email, pdfBase64, reportHtml) {
  try {
    if (!email) {
      Logger.log('이메일 주소가 없습니다.');
      return false;
    }

    const attachments = [];

    // PDF 첨부
    if (pdfBase64) {
      const pdfBlob = Utilities.newBlob(
        Utilities.base64Decode(pdfBase64),
        'application/pdf',
        'AI활용수준진단_보고서.pdf'
      );
      attachments.push(pdfBlob);
    }

    // HTML 보고서 파일 첨부
    if (reportHtml) {
      const htmlBlob = Utilities.newBlob(
        reportHtml,
        'text/html',
        'AI활용수준진단_보고서.html'
      );
      attachments.push(htmlBlob);
    }

    // 이메일 본문 (요약)
    const htmlBody = getEmailHtml();

    // from 사용 시도, 실패하면 기본 Gmail로 발송
    try {
      GmailApp.sendEmail(email, '[한국GPT협회] AI 활용 수준 진단 결과 보고서', '', {
        htmlBody: htmlBody,
        attachments: attachments,
        name: '한국GPT협회',
        from: 'pse@rnbdp.com',
        replyTo: 'gpt@rnbdp.com'
      });
    } catch (fromError) {
      Logger.log('pse@rnbdp.com 발송 실패, 기본 계정으로 재시도: ' + fromError);
      GmailApp.sendEmail(email, '[한국GPT협회] AI 활용 수준 진단 결과 보고서', '', {
        htmlBody: htmlBody,
        attachments: attachments,
        name: '한국GPT협회',
        replyTo: 'gpt@rnbdp.com'
      });
    }

    Logger.log('이메일 발송 완료: ' + email + ' (첨부: PDF=' + !!pdfBase64 + ', HTML=' + !!reportHtml + ')');
    return true;
  } catch (error) {
    Logger.log('이메일 발송 실패: ' + error.toString());
    return false;
  }
}

function getEmailHtml() {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0a0a0a; line-height: 1.6; margin: 0; padding: 0; background: #f5f5f5; }
  .container { max-width: 560px; margin: 0 auto; background: #ffffff; }
  .header { padding: 40px 32px 24px; text-align: center; border-bottom: 1px solid #e5e5e5; }
  .header h1 { font-size: 22px; font-weight: 800; margin: 0 0 8px; }
  .header p { font-size: 13px; color: #737373; margin: 0; }
  .body { padding: 32px; }
  .body p { font-size: 14px; margin: 0 0 16px; }
  .body ul { font-size: 14px; color: #525252; padding-left: 20px; }
  .body ul li { margin-bottom: 6px; }
  .footer { padding: 24px 32px; text-align: center; border-top: 1px solid #e5e5e5; }
  .footer p { font-size: 11px; color: #a3a3a3; margin: 0 0 4px; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>AI 활용 능력 진단 리포트</h1>
    <p>한국GPT협회</p>
  </div>
  <div class="body">
    <p>안녕하세요,</p>
    <p>AI 활용 수준 자가진단에 참여해주셔서 감사합니다.<br>
    귀하의 진단 결과 보고서를 첨부파일로 보내드립니다.</p>
    <p><strong>첨부 파일 안내:</strong></p>
    <ul>
      <li><strong>PDF 버전</strong> — 인쇄 및 공유에 최적화된 보고서</li>
      <li><strong>HTML 버전</strong> — 브라우저에서 열어 인터랙티브하게 확인 가능한 보고서</li>
    </ul>
    <p>보고서에는 다음 내용이 포함되어 있습니다:</p>
    <ul>
      <li>종합 등급 및 5차원 분석 (레이더 차트)</li>
      <li>등급 분포 및 포지셔닝</li>
      <li>차원별 상세 평가</li>
      <li>맞춤 추천 커리큘럼</li>
    </ul>
    <p style="font-size:13px; color:#737373; margin-top:32px;">
      문의: gpt@rnbdp.com | Tel. 02-562-1552<br>
      온라인 교육센터: gptkoreaclass.com<br>
      기업·기관 교육: kgpt.or.kr<br><br>
      한국GPT협회 | 500여 기업, 1,700여 교육 관련자가 함께하는 AI 교육 네트워크
    </p>
  </div>
  <div class="footer">
    <p>&copy; 2026 한국GPT협회</p>
    <p>본 메일은 AI 활용 수준 자가진단 서비스에 의해 자동 발송되었습니다.</p>
  </div>
</div>
</body>
</html>`;
}
