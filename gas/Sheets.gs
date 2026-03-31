/**
 * Google Sheets 저장 모듈 v3
 * 39문항 구조 (Q1-Q7 기본정보 + Q8-Q39 채점문항)
 *
 * 시트 셋업: initializeSheet() 함수를 GAS 에디터에서 수동 실행하면
 * 자가진단2026 시트가 생성되고 헤더가 자동으로 입력됩니다.
 */

const SPREADSHEET_ID = '1TqRam5rDQMQ22IREM9ehOZy2G73cAnDiiKNXfnWcdbg';
const SHEET_NAME = '자가진단2026';

function saveToSheet(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    initializeSheet();
    sheet = ss.getSheetByName(SHEET_NAME);
  }

  const r = data.responses || {};
  const s = data.scores || {};
  const d = s.dimensions || {};
  const o = s.overall || {};
  const arr = v => Array.isArray(v) ? v.join(', ') : (v || '');

  const row = [
    new Date().toLocaleString('ko-KR'),
    // PART 1: 기본 정보 (Q1-Q7)
    r.q1 || '',              // 기업명
    r.q2 || '',              // 업종
    r.q3 || '',              // 업무분야
    r.q4 || '',              // 직급
    r.q5 || '',              // 성명
    r.q6 || '',              // 이메일
    r.q7 || '',              // 연락처
    // PART 2: 기본 활용 (Q8-Q13)
    r.q8 || '',              // AI 사용 빈도
    r.q9 || '',              // 일평균 사용시간
    arr(r.q10),              // 유료 AI 서비스 (복수)
    arr(r.q11),              // AI 도구 인지 (복수)
    arr(r.q12),              // 활용 용도 (복수)
    r.q13 || '',             // 인터페이스 이해도
    // PART 3: 프롬프트 (Q14-Q20)
    r.q14 || '',             // 마크다운
    r.q15 || '',             // Few-shot
    r.q16 || '',             // 페르소나
    r.q17 || '',             // 시스템 프롬프트
    r.q18 || '',             // 구조화 출력
    r.q19 || '',             // 프롬프트 수준
    r.q20 || '',             // 프롬프트 개선
    // PART 4: 멀티모달 (Q21-Q27)
    r.q21 || '',             // 파일 업로드
    r.q22 || '',             // PDF 분석
    r.q23 || '',             // 엑셀 VBA
    r.q24 || '',             // VBA 단축키 퀴즈
    r.q25 || '',             // 데이터 분석
    r.q26 || '',             // 이미지 생성
    r.q27 || '',             // 구조화 능력
    // PART 5: 업무 통합 (Q28-Q33)
    arr(r.q28),              // AI 활용 수준 (복수, 핵심)
    r.q29 || '',             // 시간 절약
    r.q30 || '',             // 품질 향상
    r.q31 || '',             // AI 한계 인지
    r.q32 || '',             // 결과 검증
    r.q33 || '',             // 워크플로우 설명
    // PART 6: 자동화 (Q34-Q39)
    r.q34 || '',             // GPTs 제작
    r.q35 || '',             // API 활용
    r.q36 || '',             // 자동화 도구
    r.q37 || '',             // 코딩 경험
    r.q38 || '',             // 반복 자동화
    r.q39 || '',             // 도구 연동
    // 차원별 점수
    d.basic ? d.basic.percent : '',
    d.basic ? d.basic.grade : '',
    d.prompt ? d.prompt.percent : '',
    d.prompt ? d.prompt.grade : '',
    d.multimodal ? d.multimodal.percent : '',
    d.multimodal ? d.multimodal.grade : '',
    d.integration ? d.integration.percent : '',
    d.integration ? d.integration.grade : '',
    d.automation ? d.automation.percent : '',
    d.automation ? d.automation.grade : '',
    // 종합
    o.percent || '',
    o.grade || '',
    o.label || '',
    // 프리미엄 AI 여부
    o.noPremium ? 'N' : 'Y'
  ];

  sheet.appendRow(row);
  return sheet.getLastRow();
}

function getHeaders() {
  return [
    '타임스탬프',
    // 기본 정보
    '기업명', '업종', '업무분야', '직급', '성명', '이메일', '연락처',
    // PART 2
    'Q8_AI사용빈도', 'Q9_일평균시간', 'Q10_유료AI서비스',
    'Q11_AI도구인지', 'Q12_활용용도', 'Q13_인터페이스이해',
    // PART 3
    'Q14_마크다운', 'Q15_Few-shot', 'Q16_페르소나',
    'Q17_시스템프롬프트', 'Q18_구조화출력', 'Q19_프롬프트수준', 'Q20_프롬프트개선',
    // PART 4
    'Q21_파일업로드', 'Q22_PDF분석', 'Q23_엑셀VBA',
    'Q24_VBA단축키', 'Q25_데이터분석', 'Q26_이미지생성', 'Q27_구조화능력',
    // PART 5
    'Q28_AI활용수준', 'Q29_시간절약', 'Q30_품질향상',
    'Q31_AI한계인지', 'Q32_결과검증', 'Q33_워크플로우',
    // PART 6
    'Q34_GPTs', 'Q35_API', 'Q36_자동화도구',
    'Q37_코딩경험', 'Q38_반복자동화', 'Q39_도구연동',
    // 점수
    '기본활용_%', '기본활용_등급',
    '프롬프트_%', '프롬프트_등급',
    '멀티모달_%', '멀티모달_등급',
    '업무통합_%', '업무통합_등급',
    '자동화_%', '자동화_등급',
    '종합_%', '종합_등급', '종합_라벨',
    '프리미엄AI'
  ];
}

/**
 * 시트 초기화 — GAS 에디터에서 수동 실행
 * 실행 방법: GAS 에디터 상단에서 initializeSheet 선택 후 ▶ 실행
 */
function initializeSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  } else {
    // 기존 헤더 덮어쓰기
    sheet.getRange(1, 1, 1, sheet.getMaxColumns()).clearContent();
  }

  const headers = getHeaders();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // 스타일
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#f0f0f0');
  headerRange.setHorizontalAlignment('center');
  sheet.setFrozenRows(1);

  // 열 너비 자동 조정
  for (let i = 1; i <= headers.length; i++) {
    sheet.autoResizeColumn(i);
  }

  // 열 그룹 색상 (시각적 구분)
  sheet.getRange(1, 1, 1, 1).setBackground('#d9ead3');   // 타임스탬프 - 녹색
  sheet.getRange(1, 2, 1, 7).setBackground('#cfe2f3');   // 기본정보 - 파란색
  sheet.getRange(1, 9, 1, 6).setBackground('#fff2cc');   // PART2 - 노란색
  sheet.getRange(1, 15, 1, 7).setBackground('#fce5cd');  // PART3 - 주황색
  sheet.getRange(1, 22, 1, 7).setBackground('#d9d2e9');  // PART4 - 보라색
  sheet.getRange(1, 29, 1, 6).setBackground('#ead1dc');  // PART5 - 분홍색
  sheet.getRange(1, 35, 1, 6).setBackground('#c9daf8');  // PART6 - 연파랑
  sheet.getRange(1, 41, 1, 14).setBackground('#d9ead3'); // 점수 - 녹색

  Logger.log('✅ 시트 초기화 완료: ' + SHEET_NAME + ' (' + headers.length + '개 컬럼)');
}
