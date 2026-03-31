/* ========================================
   Scoring Algorithm v2
   수정된 문항 구조 반영 (39문항)
   ======================================== */

const DIMENSIONS = {
    basic: {
        name: '기본 활용',
        questions: ['q8', 'q9', 'q10', 'q11', 'q12', 'q13'],
        weight: 0.15
    },
    prompt: {
        name: '프롬프트',
        questions: ['q14', 'q15', 'q16', 'q17', 'q18', 'q19', 'q20'],
        weight: 0.25
    },
    multimodal: {
        name: '멀티모달 & 구조화',
        questions: ['q21', 'q22', 'q23', 'q24', 'q25', 'q26', 'q27'],
        weight: 0.20
    },
    integration: {
        name: '업무 통합 & 리터러시',
        questions: ['q28', 'q29', 'q30', 'q31', 'q32', 'q33'],
        weight: 0.20
    },
    automation: {
        name: '자동화',
        questions: ['q34', 'q35', 'q36', 'q37', 'q38', 'q39'],
        weight: 0.20
    }
};

// 복수선택 문항의 최대 선택지 수
const MULTI_SELECT_MAX = {
    q11: 24,
    q12: 14
};

// Q10 특별 배점 (유료 AI 서비스)
const Q10_SCORES = {
    '없음': 0,
    'ChatGPT': 1,
    'Claude': 1,
    'Gemini': 1,
    'Grok': 1,
    'Perplexity': 1,
    'GenSpark': 1,
    '뤼튼': 0.2,        // 최하점
    '무료플랫폼': 0.2,   // 최하점
    '기타AI': 0.5        // 하점
};

// Q24 VBA 퀴즈 채점
const Q24_SCORES = {
    'correct': 5,    // Alt+F11
    'wrong1': 1,
    'wrong2': 1,
    'wrong3': 1,
    'unknown': 1
};

// Q28 AI 활용 수준별 배점 (핵심 지표)
const Q28_SCORES = {
    '없음': 0,
    '채팅검색': 1,      // Level 1
    '문서작성': 2,      // Level 2
    '이미지영상': 2.5,   // Level 3
    '코드자동화': 4,     // Level 4
    '에이전트': 4.5,     // Level 5
    '서비스제공': 5      // Level 6
};

// 등급 테이블 (상향 조정: 일반인 50%+ 가 4등급 이하로 나오도록)
// 5점 척도에서 "3" 선택 = 60% → 이전 기준 6등급이었으나, 이제 4등급으로
const GRADE_TABLE = [
    { grade: 1, label: '입문 전', min: 0,  max: 20,  desc: 'AI 미경험 단계', color: '#dc2626' },
    { grade: 2, label: '입문',   min: 21, max: 35,  desc: '기초 인지 단계', color: '#ea580c' },
    { grade: 3, label: '초급 하', min: 36, max: 48,  desc: '기본 사용 시작', color: '#d97706' },
    { grade: 4, label: '초급 상', min: 49, max: 58,  desc: '기본 활용 가능', color: '#ca8a04' },
    { grade: 5, label: '중급 하', min: 59, max: 67,  desc: '업무 활용 시작', color: '#65a30d' },
    { grade: 6, label: '중급 상', min: 68, max: 75,  desc: '능숙한 활용',   color: '#16a34a' },
    { grade: 7, label: '고급 하', min: 76, max: 83,  desc: '고급 기능 활용', color: '#0d9488' },
    { grade: 8, label: '고급 상', min: 84, max: 91,  desc: '전문적 활용',   color: '#2563eb' },
    { grade: 9, label: '전문가',  min: 92, max: 100, desc: '자동화/통합 마스터', color: '#7c3aed' }
];

/**
 * 개별 문항 점수 산출 (1-5 정규화)
 */
function getQuestionScore(name, value) {
    // Q10: 유료 AI 서비스 (특별 배점)
    if (name === 'q10') {
        if (Array.isArray(value)) {
            if (value.includes('없음')) return 1;
            let total = 0;
            value.forEach(v => { total += (Q10_SCORES[v] || 0); });
            // 3개 이상 프리미엄 서비스 = 만점
            return Math.min(Math.max((total / 3) * 5, 1), 5);
        }
        return 1;
    }

    // Q24: VBA 퀴즈
    if (name === 'q24') {
        return Q24_SCORES[value] || 1;
    }

    // Q28: AI 활용 수준 (핵심 지표, 특별 배점)
    if (name === 'q28') {
        if (Array.isArray(value)) {
            if (value.includes('없음')) return 1;
            let maxLevel = 0;
            value.forEach(v => {
                const score = Q28_SCORES[v] || 0;
                if (score > maxLevel) maxLevel = score;
            });
            return Math.max(maxLevel, 1);
        }
        return 1;
    }

    // 일반 복수선택 문항
    if (MULTI_SELECT_MAX[name]) {
        if (Array.isArray(value)) {
            if (value.includes('없음') || value.includes('미활용')) return 1;
            const maxItems = MULTI_SELECT_MAX[name];
            return Math.min(Math.max((value.length / maxItems) * 5, 1), 5);
        }
        return 1;
    }

    // 5점 척도 문항 (라디오)
    const num = parseInt(value);
    if (!isNaN(num) && num >= 1 && num <= 5) return num;

    return 1;
}

/**
 * 차원별 점수 산출 (0-100%)
 */
function calculateDimensionScore(dimKey, responses) {
    const dim = DIMENSIONS[dimKey];
    let totalScore = 0;
    let maxScore = dim.questions.length * 5;

    dim.questions.forEach(qName => {
        const value = responses[qName];
        if (value !== undefined && value !== '') {
            totalScore += getQuestionScore(qName, value);
        }
    });

    return Math.round((totalScore / maxScore) * 100);
}

/**
 * 퍼센트 → 등급 변환
 */
function percentToGrade(percent) {
    for (const g of GRADE_TABLE) {
        if (percent >= g.min && percent <= g.max) return g;
    }
    return GRADE_TABLE[0];
}

/**
 * Q10 유료 서비스 체크: 프리미엄 서비스가 하나도 없으면 true
 */
const PREMIUM_SERVICES = ['ChatGPT', 'Claude', 'Gemini', 'Grok', 'Perplexity', 'GenSpark'];

function hasNoPremiumAI(responses) {
    const q10 = responses.q10;
    if (!q10 || !Array.isArray(q10)) return true;
    // "없음"이거나, 프리미엄 서비스가 하나도 없으면 true
    if (q10.includes('없음')) return true;
    return !q10.some(v => PREMIUM_SERVICES.includes(v));
}

/**
 * 전체 채점
 */
function calculateScores(responses) {
    const dimensions = {};
    let weightedSum = 0;

    // 유료 프리미엄 AI 없으면 종합 등급 3등급 이하로 캡
    const noPremium = hasNoPremiumAI(responses);

    Object.keys(DIMENSIONS).forEach(key => {
        let percent = calculateDimensionScore(key, responses);

        // 프리미엄 없으면 기본활용 차원은 최대 40%로 제한
        if (noPremium && key === 'basic') {
            percent = Math.min(percent, 40);
        }

        const gradeInfo = percentToGrade(percent);
        dimensions[key] = {
            name: DIMENSIONS[key].name,
            percent: percent,
            grade: gradeInfo.grade,
            label: gradeInfo.label,
            desc: gradeInfo.desc,
            color: gradeInfo.color,
            weight: DIMENSIONS[key].weight
        };
        weightedSum += percent * DIMENSIONS[key].weight;
    });

    let overallPercent = Math.round(weightedSum);

    // 프리미엄 AI 없으면 종합 점수 최대 35% (= 2~3등급) 캡
    if (noPremium) {
        overallPercent = Math.min(overallPercent, 35);
    }

    const overallGrade = percentToGrade(overallPercent);

    return {
        dimensions: dimensions,
        overall: {
            name: '종합 디지털역량',
            percent: overallPercent,
            noPremium: noPremium,
            grade: overallGrade.grade,
            label: overallGrade.label,
            desc: overallGrade.desc,
            color: overallGrade.color
        }
    };
}

/**
 * 추천 커리큘럼 결정 (교육 제안서 기반 상세 버전)
 */
function getRecommendation(scores) {
    const grade = scores.overall.grade;
    const dims = scores.dimensions;
    const stored = JSON.parse(localStorage.getItem('ai-diagnosis-data') || '{}');
    const job = stored.responses?.q3 || '';
    const industry = stored.responses?.q2 || '';

    let weakest = null, weakestPercent = 100;
    Object.keys(dims).forEach(key => {
        if (dims[key].percent < weakestPercent) { weakestPercent = dims[key].percent; weakest = key; }
    });

    const recommendations = [];
    const noPremium = scores.overall.noPremium;

    // === 프리미엄 AI 미구독: 초급 과정으로 고정 ===
    if (noPremium) {
        recommendations.push({
            level: '초급',
            course: '생성형 AI 기초 & 프롬프트 마스터',
            desc: 'AI 도구 세팅부터 프롬프트 엔지니어링 기초, 문서 자동화, 이미지 생성까지 AI 활용의 첫걸음을 체계적으로 안내합니다. ChatGPT, Claude, Gemini 등 주요 AI 플랫폼을 직접 비교 체험합니다.',
            duration: '12시간 (3일 × 4시간)',
            modules: [
                'Day 1: AI 기초 & 세팅 — AI 개념, 주요 플랫폼(GPT/Claude/Gemini) 비교, 보안 주의사항',
                'Day 1: 프롬프트 엔지니어링 기초 — 명확한 지시, 맥락 제공, 역할(페르소나) 부여법',
                'Day 2: 업무 문서 자동화 — Word 문서 구조화, 보고서/기획서 초안, 이메일 자동 작성',
                'Day 2: 데이터 활용 기초 — Excel 함수 생성, 데이터 정리, 간단한 시각화',
                'Day 3: 이미지 생성 & 프레젠테이션 — DALL-E/Midjourney 활용, PPT 자동 구성',
                'Day 3: 실전 프로젝트 — 업무 문서 + PPT + 이미지 패키지 제작 실습'
            ],
            outcomes: [
                '주요 AI 플랫폼 3종 이상 기본 활용 가능',
                '구조화된 프롬프트로 원하는 결과를 효과적으로 도출',
                '문서 작성 시간 40~60% 절감 체감',
                '업무에 즉시 적용 가능한 AI 활용 루틴 확립'
            ]
        });

        const jobRec = getJobRecommendation(job, industry, grade);
        const weaknessRec = getWeaknessRecommendation(weakest, dims[weakest]);
        return {
            main: recommendations,
            job: jobRec,
            weakness: weaknessRec,
            weakestDimension: weakest
        };
    }

    // === 등급별 핵심 추천 과정 ===
    if (grade <= 4) {
        recommendations.push({
            level: '초급',
            course: '생성형 AI 기초 & 프롬프트 마스터',
            desc: 'AI 도구 세팅부터 프롬프트 엔지니어링 기초, 문서 자동화, 이미지 생성까지 AI 활용의 첫걸음을 체계적으로 안내합니다. ChatGPT, Claude, Gemini 등 주요 AI 플랫폼을 직접 비교 체험합니다.',
            duration: '12시간 (3일 × 4시간)',
            modules: [
                'Day 1: AI 기초 & 세팅 — AI 개념, 주요 플랫폼(GPT/Claude/Gemini) 비교, 보안 주의사항',
                'Day 1: 프롬프트 엔지니어링 기초 — 명확한 지시, 맥락 제공, 역할(페르소나) 부여법',
                'Day 2: 업무 문서 자동화 — Word 문서 구조화, 보고서/기획서 초안, 이메일 자동 작성',
                'Day 2: 데이터 활용 기초 — Excel 함수 생성, 데이터 정리, 간단한 시각화',
                'Day 3: 이미지 생성 & 프레젠테이션 — DALL-E/Midjourney 활용, PPT 자동 구성',
                'Day 3: 실전 프로젝트 — 업무 문서 + PPT + 이미지 패키지 제작 실습'
            ],
            outcomes: [
                '주요 AI 플랫폼 3종 이상 기본 활용 가능',
                '구조화된 프롬프트로 원하는 결과를 효과적으로 도출',
                '문서 작성 시간 40~60% 절감 체감',
                '업무에 즉시 적용 가능한 AI 활용 루틴 확립'
            ]
        });
    }

    if (grade >= 3 && grade <= 6) {
        recommendations.push({
            level: '중급',
            course: 'AI 업무 자동화 전문가',
            desc: 'Excel VBA 자동화, API 연동, Google Apps Script, 맞춤형 GPTs 제작을 통해 반복 업무를 체계적으로 자동화하는 역량을 갖춥니다.',
            duration: '12시간 (3일 × 4시간)',
            modules: [
                'Day 1: Excel 고급 자동화 — ChatGPT 활용 복합 함수, 조건부 서식, 피벗 테이블 최적화',
                'Day 1: VBA 매크로 자동화 — AI가 생성한 VBA 코드로 반복 업무 자동화, 매크로 수정/디버깅',
                'Day 2: API 기초 & 활용 — REST API 개념, OpenAI/Claude API 호출, Google Apps Script 연동',
                'Day 2: 맞춤형 GPTs 제작 — 업무 전용 챗봇 설계, 지식 베이스(RAG) 활용, 시스템 프롬프트 작성',
                'Day 3: 데이터 분석 & 대시보드 — 데이터 전처리, 통계 분석, 시각화 대시보드 구축',
                'Day 3: 통합 자동화 프로젝트 — 업무 데이터 수집→분석→보고서 자동 생성 파이프라인'
            ],
            outcomes: [
                'VBA 매크로를 직접 작성하고 수정하여 엑셀 업무 자동화',
                'API를 활용한 외부 서비스 연동 구현',
                '업무 전용 GPTs를 직접 설계하고 팀에 배포',
                '반복 업무 처리 시간 70% 이상 절감'
            ]
        });
    }

    if (grade >= 5 && grade <= 8) {
        recommendations.push({
            level: '고급',
            course: '노코드 자동화 시스템 마스터',
            desc: 'Make.com, n8n을 활용한 워크플로우 자동화와 멀티 서비스 통합 시스템을 직접 설계하고 운영합니다. Webhook, API 기반 실시간 데이터 처리 파이프라인을 구축합니다.',
            duration: '12시간 (3일 × 4시간)',
            modules: [
                'Day 1: Make.com 시나리오 설계 — 워크플로우 개념, 모듈 구성, 트리거/액션 설계, 조건 분기',
                'Day 1: n8n 워크플로우 구축 — 오픈소스 자동화, 노드 연결, 데이터 변환, 에러 핸들링',
                'Day 2: 멀티 서비스 통합 — Google Workspace 연동, Slack/이메일 자동 알림, CRM 데이터 동기화',
                'Day 2: Webhook & API 실시간 연동 — 외부 이벤트 수신, 실시간 데이터 처리, 자동 응답 시스템',
                'Day 3: 업무 전체 자동화 프로젝트 — 고객 문의→분류→응답→보고 전 과정 자동화',
                'Day 3: 운영 & 모니터링 — 자동화 시스템 안정성 관리, 오류 감지, 성능 최적화'
            ],
            outcomes: [
                'Make.com/n8n으로 복잡한 멀티스텝 워크플로우 설계',
                '5개 이상 SaaS 도구를 하나의 자동화 파이프라인으로 연동',
                '수작업 대비 업무 처리 속도 5~10배 향상',
                '자동화 시스템을 팀/부서에 확산 적용'
            ]
        });
    }

    if (grade >= 7) {
        recommendations.push({
            level: '전문가',
            course: 'AI Agent 개발 & 고급 데이터 분석',
            desc: 'AI 에이전트 아키텍처 설계, RAG 시스템 구축, Python 기반 고급 데이터 분석으로 조직 내 AI 혁신을 주도하는 전문가 역량을 완성합니다.',
            duration: '16시간 (4일 × 4시간)',
            modules: [
                'Day 1: AI Agent 설계 — 에이전트 아키텍처, 도구 사용(Tool Use), 멀티 에이전트 시스템',
                'Day 1: RAG 시스템 구축 — 벡터 DB, 임베딩, 문서 검색 증강 생성 파이프라인',
                'Day 2: Python + AI 자동화 — PDF 추출, OCR, 대량 문서 처리 파이프라인',
                'Day 2: 고급 데이터 분석 — Pandas/NumPy 전처리, 통계 분석, 머신러닝 기초',
                'Day 3: 데이터 시각화 & 리포팅 — Matplotlib/Seaborn, 대시보드, 자동 보고서 생성',
                'Day 3: AI 서비스 프로토타이핑 — Streamlit/Gradio로 AI 웹앱 구축',
                'Day 4: 실전 프로젝트 — 기업 데이터 기반 AI 서비스 설계→구현→배포',
                'Day 4: 발표 & 운영 전략 — 팀 데모, 실무 적용 전략, 유지보수 로드맵'
            ],
            outcomes: [
                '기업 맞춤형 AI 에이전트를 직접 개발하고 배포',
                '사내 데이터 기반 RAG 시스템 구축으로 지식 검색 혁신',
                'Python으로 대량 데이터 분석 파이프라인 자동화',
                'AI 서비스를 프로토타이핑하여 타 부서/고객에 제공'
            ]
        });
    }

    // === 직무 + 업종 특화 추천 ===
    const jobRec = getJobRecommendation(job, industry, grade);

    const weaknessRecommendation = getWeaknessRecommendation(weakest, dims[weakest]);

    return {
        main: recommendations,
        job: jobRec,
        weakness: weaknessRecommendation,
        weakestDimension: weakest
    };
}

function getJobRecommendation(job, industry, grade) {
    // 직무별 상세 커리큘럼
    const jobCourses = {
        '사무/관리': {
            course: '사무직 AI 문서 자동화 특화',
            desc: `사무/관리 직군에 최적화된 AI 활용 교육입니다. 회의록, 보고서, 기획서, 예산안 등 핵심 업무 문서를 AI로 자동 생성하고, Excel VBA 매크로로 반복 데이터 처리를 자동화합니다.`,
            duration: '6~12시간',
            modules: ['업무 문서(보고서/기획서/회의록) AI 자동 생성', 'Excel 데이터 정리 및 VBA 자동화', '예산/성과 분석 보고서 자동화', '사내 공문/공지사항 템플릿 자동화', '업무 전용 GPTs 챗봇 제작']
        },
        '영업/마케팅': {
            course: '영업/마케팅 AI 콘텐츠 & 분석',
            desc: `영업/마케팅 직군 맞춤 교육입니다. 고객 제안서 자동 생성, SNS 콘텐츠 제작, 고객 데이터 분석, 경쟁사 벤치마킹, 캠페인 성과 분석까지 영업/마케팅 전 과정을 AI로 혁신합니다.`,
            duration: '6~12시간',
            modules: ['고객 제안서/견적서 자동 생성', 'SNS/블로그 마케팅 콘텐츠 자동 제작', '고객 리뷰 분석 & 페인포인트 추출', '경쟁사 분석 및 시장 트렌드 리서치', 'Make.com 활용 마케팅 자동화 워크플로우']
        },
        '연구/개발': {
            course: '연구직 AI 논문분석 & 데이터 활용',
            desc: `연구/개발 직군에 특화된 교육입니다. SciSpace/Consensus 등 학술 AI 도구를 활용한 논문 분석, Python 데이터 분석, 연구 보고서 자동화, 연구 전용 GPTs 개발을 학습합니다.`,
            duration: '6~12시간',
            modules: ['SciSpace/Consensus 학술 AI 활용 논문 분석', 'PDF 논문 대화형 분석 및 핵심 추출', 'Python 실험 데이터 통계 분석 & 시각화', '연구 보고서/학술 발표 자료 자동 생성', '연구 전용 GPTs & 지식 DB 구축']
        },
        '생산/품질': {
            course: '생산/품질 AI 관리 시스템',
            desc: `생산/품질 직군 맞춤 교육입니다. HACCP 관리 문서 자동화, 품질 검사 데이터 분석, 불량률 예측 모델링, 생산 모니터링 자동화 시스템 구축을 학습합니다.`,
            duration: '6~12시간',
            modules: ['품질 관리 문서(HACCP/ISO) 자동화', '품질 검사 데이터 분석 & 불량률 예측', '생산 효율 분석 및 공정 최적화', '원재료 조달 최적화 & 재고 관리', 'Make.com 품질 모니터링 자동 알림']
        },
        '재무/회계': {
            course: '재무/회계 AI 분석 자동화',
            desc: `재무/회계 직군 맞춤 교육입니다. 예산 분석, 재무제표 분석, KPI 대시보드, 비용 절감 분석, 경영진 보고서 자동 생성을 학습합니다.`,
            duration: '6~12시간',
            modules: ['예산 계획 및 재무 분석 보고서 자동화', '부서별 KPI 설정 & 성과 분석 대시보드', 'ROI 분석 및 투자 의사결정 지원', 'Excel VBA 기반 월말 정산 자동화', '경영진 주간/월간 자동 보고서 시스템']
        },
        'IT/시스템': {
            course: 'IT 전문가 AI 개발 통합',
            desc: `IT/시스템 직군 맞춤 교육입니다. AI 코딩 어시스턴트(Cursor, Claude Code, GitHub Copilot) 활용, API 설계, 자동화 파이프라인 구축, AI 서비스 배포를 학습합니다.`,
            duration: '6~16시간',
            modules: ['AI 코딩 어시스턴트 활용 (Cursor/Claude Code/Copilot)', 'API 설계 및 마이크로서비스 자동화', 'CI/CD 파이프라인 AI 통합', 'RAG 시스템 & AI Agent 개발', 'AI 서비스 프로토타이핑 & 배포']
        },
        '디자인/크리에이티브': {
            course: '크리에이티브 AI 콘텐츠 제작',
            desc: `디자인/크리에이티브 직군 맞춤 교육입니다. Midjourney/DALL-E 이미지 생성, Sora/Runway 영상 제작, AI 기반 디자인 워크플로우, 콘텐츠 자동 생산 파이프라인을 학습합니다.`,
            duration: '6~12시간',
            modules: ['Midjourney/DALL-E 고급 이미지 프롬프트 엔지니어링', 'Sora/Runway AI 영상 제작 & 편집', 'AI 기반 브랜드 디자인 시스템 구축', 'Canva AI + HeyGen 아바타 콘텐츠', 'Make.com 콘텐츠 자동 배포 파이프라인']
        }
    };

    let rec = jobCourses[job];
    if (!rec) {
        rec = {
            course: '맞춤형 직무 AI 교육',
            desc: '귀사의 업무 특성과 산업 환경에 맞는 맞춤형 AI 활용 교육 프로그램을 설계해 드립니다. 한국GPT협회는 500여 기업의 산업별 교육 레퍼런스를 보유하고 있습니다.',
            duration: '상담 후 결정',
            modules: []
        };
    }

    // 업종 반영 (있을 경우 설명에 추가)
    if (industry && industry !== '기타') {
        rec.industry = industry;
        rec.industryNote = `${industry} 산업 맞춤 사례와 실습 데이터를 활용하여 교육을 진행합니다.`;
    }

    return rec;
}

function getWeaknessRecommendation(dimKey, dimData) {
    const recs = {
        basic: { tip: 'AI 도구의 기본 사용법부터 시작하세요.', action: '매일 10분씩 ChatGPT/Claude를 활용해보세요. 유료 구독으로 고급 기능을 체험해보는 것을 추천합니다.' },
        prompt: { tip: '프롬프트 작성 능력이 AI 활용의 핵심입니다.', action: '마크다운 문법, 페르소나 부여, Few-shot 기법 등 구조화된 프롬프트 작성을 연습하세요.' },
        multimodal: { tip: '파일 분석, 코드 실행 등 AI의 고급 기능을 활용해보세요.', action: 'PDF 업로드 분석, VBA 코드 생성, 데이터 시각화 등 멀티모달 기능을 시도해보세요.' },
        integration: { tip: '실제 업무에 AI를 적극적으로 통합해보세요.', action: '이메일 작성, 보고서 요약부터 시작해 코드 자동화, 에이전트 설계까지 단계적으로 확장하세요.' },
        automation: { tip: 'AI를 활용한 업무 자동화에 도전해보세요.', action: 'GPTs 제작부터 시작해 Make.com/n8n 자동화, API 연동까지 단계적으로 학습하세요.' }
    };
    return recs[dimKey] || recs.basic;
}
