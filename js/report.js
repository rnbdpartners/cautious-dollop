/* ========================================
   Report Rendering v3
   페이지 꽉 채움, 상세분석 한 페이지, 등급+기준 합본
   ======================================== */

const EVAL_COMMENTS = {
    basic: {
        low: 'AI 도구를 아직 본격적으로 활용하지 않고 있습니다. 유료 구독과 매일 사용 습관 형성이 필요합니다.',
        mid: 'AI 도구를 기본적으로 사용하고 있으며, 주요 기능을 이해하고 있습니다. 다양한 도구 탐색으로 활용 범위를 넓혀보세요.',
        high: '다양한 AI 도구를 능숙하게 활용하며 목적에 맞게 선택적으로 사용하고 있습니다.'
    },
    prompt: {
        low: '프롬프트 핵심 개념(마크다운, Few-shot, 페르소나 등) 학습이 시급합니다. 구조화된 프롬프트가 AI 활용의 핵심입니다.',
        mid: '프롬프트 기본 원리를 이해하고 실천하고 있습니다. JSON 구조화, 시스템 프롬프트 등 고급 기법으로 확장해보세요.',
        high: '마크다운, Few-shot, 시스템 프롬프트 등 프롬프트 엔지니어링 전반을 능숙하게 활용합니다.'
    },
    multimodal: {
        low: '파일 분석, VBA, 코드 실행 등 AI 고급 기능 활용 경험이 부족합니다. 파일 업로드부터 시작해보세요.',
        mid: '멀티모달 기능을 일정 수준 활용 중입니다. VBA 자동화, 데이터 분석 등으로 확장해보세요.',
        high: '파일 분석, VBA, 데이터 시각화, 코드 실행 등 고급 기능을 능숙하게 활용합니다.'
    },
    integration: {
        low: 'AI를 실제 업무에 통합하는 것이 초기 단계입니다. 문서 작성, 보고서 초안부터 적용해보세요.',
        mid: 'AI를 다양한 업무에 활용하며 시간 절약 효과를 체감하고 있습니다. 코드 자동화 단계로 도약해보세요.',
        high: 'AI를 업무 전반에 효과적으로 통합하며, 에이전트 설계까지 활용하는 높은 수준입니다.'
    },
    automation: {
        low: '자동화 도구나 API 활용 경험이 부족합니다. GPTs 제작이나 Make.com부터 시작해보세요.',
        mid: '기본 자동화를 구현할 수 있습니다. 복잡한 워크플로우 자동화에 도전하면 효율이 크게 향상됩니다.',
        high: 'API, 자동화 도구, 프로그래밍으로 복잡한 업무 자동화 시스템을 구축·운영하고 있습니다.'
    }
};

const DIM_TAGS = {
    basic: { s: ['AI 도구 활용', '유료 서비스'], w: ['사용 빈도↑', '도구 탐색↑'] },
    prompt: { s: ['프롬프트 설계', '마크다운 활용'], w: ['프롬프트 기초', 'Few-shot 연습'] },
    multimodal: { s: ['멀티모달 활용', 'VBA 활용'], w: ['파일 분석 학습', 'VBA 기초'] },
    integration: { s: ['업무 통합', '워크플로우 구조화'], w: ['업무 적용 확대', '자동화 도전'] },
    automation: { s: ['자동화 시스템', 'API 활용'], w: ['GPTs 제작', '자동화 도구 학습'] }
};

function initReport() {
    const stored = localStorage.getItem('ai-diagnosis-data');
    if (!stored) {
        document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:Paperlogy,sans-serif;"><div style="text-align:center;"><h2>진단 데이터가 없습니다</h2><p style="margin:1rem 0;color:#737373;">설문을 먼저 완료해주세요.</p><a href="index.html" style="color:#0a0a0a;font-weight:700;">진단 시작하기 →</a></div></div>';
        return;
    }
    const data = JSON.parse(stored);
    renderCover(data.responses);
    renderOverview(data.scores, data.responses);
    renderDistribution(data.scores);
    renderDetails(data.scores);
    renderRecommendations(data.scores);
    setTimeout(() => generateAndSendEmail(data.responses.q6), 3000);
}

function renderCover(r) {
    document.getElementById('cover-name').textContent = r.q5 || '—';
    document.getElementById('cover-company').textContent = (r.q1 || '') + (r.q2 ? ' · ' + r.q2 : '');
    const d = new Date();
    document.getElementById('cover-date').textContent = `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일`;
}

function renderOverview(scores, r) {
    const o = scores.overall;
    const el = id => document.getElementById(id);
    el('grade-number').textContent = o.grade;
    el('grade-number').style.color = o.color;
    el('grade-label').textContent = o.label;
    el('grade-desc').textContent = o.desc;
    el('grade-percent').textContent = `종합 점수: ${o.percent}%`;

    // 설명문
    el('overview-narrative').innerHTML = genOverviewText(r, scores);

    // 레이더
    createRadarChart('radar-chart', scores);

    // 차원 요약
    const sum = el('dim-summary');
    sum.innerHTML = '';
    Object.keys(scores.dimensions).forEach(k => {
        const d = scores.dimensions[k];
        sum.innerHTML += `<div class="dim-item"><div class="dim-grade" style="background:${d.color}">${d.grade}</div><div class="dim-info"><div class="dim-name">${d.name}</div><div class="dim-bar"><div class="dim-bar-fill" style="width:${d.percent}%;background:${d.color}"></div></div><div class="dim-percent">${d.percent}% · ${d.label}</div></div></div>`;
    });

    // 인사이트 카드 (여백 채움)
    const dims = scores.dimensions;
    let strongest = null, weakest = null, maxP = 0, minP = 100;
    Object.keys(dims).forEach(k => {
        if (dims[k].percent > maxP) { maxP = dims[k].percent; strongest = k; }
        if (dims[k].percent < minP) { minP = dims[k].percent; weakest = k; }
    });

    // 인사이트 카드 3개
    el('insight-cards').innerHTML = `
        <div class="insight-card">
            <div class="insight-card-value" style="color:${o.color}">${o.grade}<span style="font-size:0.7rem;color:#a3a3a3">/9</span></div>
            <div class="insight-card-label">종합 등급</div>
        </div>
        <div class="insight-card">
            <div class="insight-card-value" style="color:${dims[strongest].color}">${dims[strongest].name}</div>
            <div class="insight-card-label">가장 우수한 영역 (${dims[strongest].grade}등급)</div>
        </div>
        <div class="insight-card">
            <div class="insight-card-value" style="color:${dims[weakest].color}">${dims[weakest].name}</div>
            <div class="insight-card-label">우선 개선 영역 (${dims[weakest].grade}등급)</div>
        </div>
    `;

    // AI 활용 성숙도 로드맵 (여백 채움)
    const nextGrade = Math.min(o.grade + 1, 9);
    const nextInfo = GRADE_TABLE.find(g => g.grade === nextGrade);
    const roadmapActions = {
        1: ['ChatGPT 무료 버전 가입 및 기본 사용 시작', 'AI에게 단순 질문/검색으로 습관 형성', '프롬프트 기본 개념 학습 (역할, 맥락, 조건)'],
        2: ['유료 AI 서비스 1개 구독 (ChatGPT Plus 등)', '매일 10분 이상 AI 활용 루틴 만들기', '마크다운 문법으로 프롬프트 구조화 연습'],
        3: ['프롬프트에 역할/맥락/조건 추가하여 질문', '파일 업로드(PDF/Excel) 분석 시도', 'AI로 이메일/보고서 초안 작성 실습'],
        4: ['Few-shot, 시스템 프롬프트 기법 적용', 'VBA 매크로 코드를 AI로 생성하여 실행', 'AI 결과물을 여러 도구로 교차 검증'],
        5: ['GPTs/Projects 직접 제작하여 팀에 배포', 'Make.com 또는 n8n으로 간단한 자동화 구현', 'API 기초 학습 (REST API, OpenAI API)'],
        6: ['5단계 이상 멀티스텝 워크플로우 자동화', 'Python/Apps Script 연동 자동화 구현', '팀 내 AI 활용 가이드 작성 및 전파'],
        7: ['AI Agent 아키텍처 설계 (Tool Use 활용)', 'RAG 시스템 기반 사내 지식 검색 구축', '데이터 분석 파이프라인 자동화'],
        8: ['Streamlit/Gradio로 AI 웹앱 프로토타이핑', '조직 전체 AI 전환 전략 및 거버넌스 수립', '외부 고객 대상 AI 서비스 제공'],
        9: ['AI 전략 컨설팅 및 조직 교육 리더십', '산업별 AI 혁신 사례 개발 및 발표', '차세대 멀티모달 에이전트 기술 연구']
    };
    const actions = roadmapActions[o.grade] || roadmapActions[5];

    el('roadmap-section').innerHTML = `
        <div class="roadmap-header">
            <h3 class="roadmap-title">다음 등급을 위한 로드맵</h3>
            <div class="roadmap-target">
                <span class="roadmap-current" style="color:${o.color}">${o.grade}등급</span>
                <span class="roadmap-arrow">→</span>
                <span class="roadmap-next" style="color:${nextInfo.color}">${nextGrade}등급 (${nextInfo.label})</span>
            </div>
        </div>
        <div class="roadmap-actions">
            ${actions.map((a, i) => `<div class="roadmap-action"><span class="roadmap-step">${i+1}</span><span class="roadmap-text">${a}</span></div>`).join('')}
        </div>
        <div class="roadmap-cta">
            <a href="https://gptkoreaclass.com/" target="_blank" class="roadmap-cta-btn">개인 역량 향상 → 온라인 교육센터</a>
            <a href="https://kgpt.or.kr/?utm_source=naver&utm_medium=cpc&utm_campaign=셀프진단&utm_content=홍보&utm_term=셀프진단&c_memo=자체제작" target="_blank" class="roadmap-cta-btn roadmap-cta-btn--dark">조직 역량 개선 → 맞춤 교육 상담</a>
        </div>
    `;
}

function genOverviewText(r, scores) {
    const o = scores.overall, dims = scores.dimensions;
    const name = r.q5 || '귀하', company = r.q1 || '', industry = r.q2 || '', job = r.q3 || '';
    let strongest = null, weakest = null, maxP = 0, minP = 100;
    Object.keys(dims).forEach(k => {
        if (dims[k].percent > maxP) { maxP = dims[k].percent; strongest = k; }
        if (dims[k].percent < minP) { minP = dims[k].percent; weakest = k; }
    });

    let t = `<strong>${name}</strong>님`;
    if (company || industry) t += `(${[company, industry].filter(Boolean).join(' · ')})`;
    if (job) t += ` ${job} 직군`;
    t += `의 AI 활용 종합 등급은 <strong>${o.grade}등급(${o.label})</strong>입니다. `;

    if (o.grade <= 4) {
        t += `기본 도구 사용법과 프롬프트 작성부터 체계적으로 학습하시면 빠르게 성장할 수 있습니다. `;
    } else if (o.grade <= 6) {
        t += `현재 기본기를 바탕으로 VBA 자동화, API 연동 등 고급 기능으로 확장하면 업무 효율이 크게 향상됩니다. `;
    } else {
        t += `자동화 시스템 구축과 AI 에이전트 설계 등 심화 영역으로의 확장을 권장합니다. `;
    }

    t += `강점: <strong>${dims[strongest].name}(${dims[strongest].grade}등급)</strong>, 개선 필요: <strong>${dims[weakest].name}(${dims[weakest].grade}등급)</strong>`;
    return t;
}

function renderDistribution(scores) {
    createDistributionChart('dist-chart', scores.overall.grade);
    const o = scores.overall;

    let t = `귀하의 종합 등급은 <strong>${o.grade}등급(${o.label})</strong>, 종합 점수 <strong>${o.percent}%</strong>입니다. `;
    if (o.grade <= 4) t += `체계적인 교육을 통해 단기간에 실질적 성장이 가능합니다.`;
    else if (o.grade <= 6) t += `대부분의 기업 구성원보다 앞서 있으며, 고급 기능 학습으로 차별화가 가능합니다.`;
    else t += `AI 활용에 있어 선도적 위치에 있습니다. 전문 영역으로의 심화를 권장합니다.`;
    document.getElementById('dist-narrative').innerHTML = t;

    // 등급 테이블
    const tbody = document.getElementById('grade-table-body');
    tbody.innerHTML = '';
    GRADE_TABLE.forEach(g => {
        const tr = document.createElement('tr');
        if (g.grade === o.grade) tr.className = 'current-grade';
        tr.innerHTML = `<td>${g.grade}등급</td><td>${g.label}</td><td>${g.min}~${g.max}%</td><td>${g.desc}</td>`;
        tbody.appendChild(tr);
    });

    // 등급 시각 바
    const sv = document.getElementById('grade-scale-visual');
    sv.innerHTML = '';
    GRADE_TABLE.forEach(g => {
        const item = document.createElement('div');
        item.className = 'grade-scale-item' + (g.grade === o.grade ? ' current' : '');
        item.style.background = g.color;
        item.innerHTML = `<span>${g.grade}</span><span class="gs-label">${g.label}</span>`;
        sv.appendChild(item);
    });
}

function renderDetails(scores) {
    const dims = scores.dimensions;
    const grid = document.getElementById('detail-grid-all');
    grid.innerHTML = '';

    document.getElementById('detail-narrative').innerHTML =
        `각 평가 차원별 세부 역량 분석입니다. 등급이 낮은 영역부터 우선 학습하면 종합 등급 향상에 가장 효과적입니다.`;

    // 차원별 다음 단계 액션
    const NEXT_ACTIONS = {
        basic: { low: 'ChatGPT Plus 구독 → 매일 사용 습관', mid: '3개 이상 AI 도구 비교 활용', high: 'AI 도구 선택 가이드 작성' },
        prompt: { low: '마크다운 문법 + 페르소나 기법 학습', mid: '시스템 프롬프트 + JSON 출력 연습', high: '프롬프트 라이브러리 구축' },
        multimodal: { low: 'PDF 업로드 분석부터 시작', mid: 'VBA 자동화 + 데이터 시각화 실습', high: 'Python 데이터 파이프라인 구축' },
        integration: { low: '이메일/보고서 작성에 AI 적용', mid: '코드 자동화 + 에이전트 설계 도전', high: 'AI 서비스 설계 및 팀 확산' },
        automation: { low: 'GPTs 1개 만들어보기', mid: 'Make.com 워크플로우 3개 구현', high: 'API 기반 통합 자동화 시스템' }
    };

    Object.keys(dims).forEach(key => {
        const d = dims[key];
        const comment = d.grade <= 3 ? EVAL_COMMENTS[key].low : d.grade <= 6 ? EVAL_COMMENTS[key].mid : EVAL_COMMENTS[key].high;
        const tags = DIM_TAGS[key];
        const isStrong = d.grade >= 5;
        const tagHtml = (isStrong ? tags.s : tags.w).map(t =>
            `<span class="dcc-tag ${isStrong ? 'dcc-tag--s' : ''}">${t}</span>`
        ).join('');
        const nextAction = d.grade <= 3 ? NEXT_ACTIONS[key].low : d.grade <= 6 ? NEXT_ACTIONS[key].mid : NEXT_ACTIONS[key].high;

        grid.innerHTML += `
        <div class="detail-card-compact">
            <div class="dcc-grade" style="background:${d.color}">${d.grade}</div>
            <div class="dcc-body">
                <div class="dcc-title">${d.name}</div>
                <div class="dcc-bar"><div class="dcc-bar-fill" style="width:${d.percent}%;background:${d.color}"></div></div>
                <div class="dcc-comment">${comment}</div>
                <div class="dcc-next">→ ${nextAction}</div>
                <div class="dcc-tags">${tagHtml}</div>
            </div>
            <div class="dcc-meta">
                <div class="dcc-percent" style="color:${d.color}">${d.percent}%</div>
                <div class="dcc-label">${d.label}</div>
            </div>
        </div>`;
    });

    // 차원별 교육 매핑 테이블
    const EDU_MAP = {
        basic: '초급: AI 기초 & 세팅',
        prompt: '초급~중급: 프롬프트 엔지니어링',
        multimodal: '중급: VBA·데이터 분석 자동화',
        integration: '중급~고급: 업무 통합 실전',
        automation: '고급: Make.com·n8n 워크플로우'
    };

    document.getElementById('detail-edu-map').innerHTML = `
        <h3 class="edu-map-title">차원별 추천 교육 과정</h3>
        <div class="edu-map-grid">
            ${Object.keys(dims).map(k => {
                const d = dims[k];
                return `<div class="edu-map-row">
                    <span class="edu-map-dim" style="border-left:3px solid ${d.color}">${d.name} <span style="color:${d.color};font-weight:800">${d.grade}등급</span></span>
                    <span class="edu-map-course">${EDU_MAP[k]}</span>
                </div>`;
            }).join('')}
        </div>
        <div class="edu-map-cta-row">
            <a href="https://gptkoreaclass.com/" target="_blank" class="edu-map-cta-btn">개인 능력 향상 → 온라인 교육센터</a>
            <a href="https://kgpt.or.kr/?utm_source=naver&utm_medium=cpc&utm_campaign=셀프진단&utm_content=홍보&utm_term=셀프진단&c_memo=자체제작" target="_blank" class="edu-map-cta-btn edu-map-cta-btn--dark">조직 개선 → 맞춤 교육 상담</a>
        </div>
    `;
}

// 전체 교육 과정 테이블 데이터
const ALL_COURSES = [
    {
        level: '초급', course: '생성형 AI 기초 & 프롬프트 마스터', duration: '12시간 (3일)',
        rows: [
            ['AI 기초 & 세팅', 'AI 개념 이해, ChatGPT·Claude·Gemini 주요 플랫폼 비교 체험, 계정 세팅 및 보안 주의사항 학습'],
            ['프롬프트 엔지니어링 기초', '역할 부여, 맥락 제공, 조건 명시 등 구조화된 프롬프트 작성법. 마크다운 문법 활용 실습'],
            ['업무 문서 자동화', 'Word 보고서·기획서·이메일 초안 AI 자동 생성. 문서 구조화와 톤앤매너 설정 실습'],
            ['데이터 활용 기초', 'Excel 함수 생성, 데이터 정리·분류·요약. 간단한 차트 및 피벗 테이블 AI 활용'],
            ['이미지 생성 & PPT', 'DALL-E·Midjourney 활용 업무 이미지 생성. AI 기반 PPT 슬라이드 자동 구성'],
            ['실전 프로젝트', '업무 문서 + PPT + 이미지 통합 패키지 제작 실습. 피드백 기반 결과물 개선']
        ]
    },
    {
        level: '중급', course: 'AI 업무 자동화 전문가', duration: '12시간 (3일)',
        rows: [
            ['Excel 고급 자동화', 'ChatGPT 활용 복합 함수·조건부 서식·피벗 테이블 최적화. 대량 데이터 전처리 자동화'],
            ['VBA 매크로 자동화', 'AI가 생성한 VBA 코드로 반복 업무 자동화. 매크로 수정·디버깅 실습 (Alt+F11 활용)'],
            ['API 기초 & 활용', 'REST API 개념, OpenAI·Claude API 호출 실습. Google Apps Script 연동 자동화'],
            ['맞춤형 GPTs 제작', '업무 전용 AI 챗봇 설계. 시스템 프롬프트 작성, 지식 베이스(RAG) 활용, 팀 배포'],
            ['데이터 분석 & 대시보드', '데이터 전처리, 통계 분석, 시각화 대시보드 구축. AI 기반 인사이트 추출'],
            ['통합 자동화 프로젝트', '업무 데이터 수집→분석→보고서 자동 생성 파이프라인 구축 실습']
        ]
    },
    {
        level: '고급', course: '노코드 자동화 시스템 마스터', duration: '12시간 (3일)',
        rows: [
            ['Make.com 시나리오 설계', '워크플로우 개념, 모듈 구성, 트리거·액션 설계, 조건 분기 및 에러 핸들링'],
            ['n8n 워크플로우 구축', '오픈소스 자동화 플랫폼 활용. 노드 연결, 데이터 변환, 외부 API 연동'],
            ['멀티 서비스 통합', 'Google Workspace·Slack·이메일·CRM 데이터 자동 동기화. 실시간 알림 시스템'],
            ['Webhook & API 실시간 연동', '외부 이벤트 수신, 실시간 데이터 처리, 자동 응답 시스템 구축'],
            ['업무 전체 자동화 프로젝트', '고객 문의→AI 분류→담당자 배정→자동 응답→주간 리포트 전 과정 자동화'],
            ['운영 & 모니터링', '자동화 시스템 안정성 관리, 오류 감지·알림, 성능 최적화 및 유지보수 전략']
        ]
    },
    {
        level: '전문가', course: 'AI Agent & 고급 데이터 분석', duration: '16시간 (4일)',
        rows: [
            ['AI Agent 설계', '에이전트 아키텍처, Tool Use 활용, 멀티 에이전트 시스템 설계 및 구현'],
            ['RAG 시스템 구축', '벡터 DB, 임베딩 개념 이해. 사내 문서 기반 검색 증강 생성 파이프라인 구축'],
            ['Python + AI 자동화', 'PDF 텍스트 추출, OCR, 대량 문서 처리 파이프라인. AI 코드 생성 및 실행'],
            ['고급 데이터 분석', 'Pandas·NumPy 전처리, 통계 분석, 머신러닝 기초. 비즈니스 인사이트 도출'],
            ['데이터 시각화 & 리포팅', 'Matplotlib·Seaborn 차트, 자동 대시보드, AI 기반 보고서 자동 생성'],
            ['AI 서비스 프로토타이핑', 'Streamlit·Gradio로 AI 웹앱 구축. 실전 프로젝트 설계→구현→배포→발표']
        ]
    }
];

function renderRecommendations(scores) {
    const rec = getRecommendation(scores);
    const page1 = document.getElementById('recommend-content-1');
    const page2 = document.getElementById('recommend-content-2');
    page1.innerHTML = '';
    page2.innerHTML = '';

    const stored = JSON.parse(localStorage.getItem('ai-diagnosis-data') || '{}');
    const job = stored.responses?.q3 || '', industry = stored.responses?.q2 || '';

    // --- PAGE 1: 핵심 추천 과정 + 상세 테이블 ---
    if (job || industry) {
        page1.innerHTML += `<p class="rec-intro-text">${[industry, job].filter(Boolean).join(' · ')} 직군의 진단 결과를 바탕으로, 귀하에게 가장 적합한 교육 과정을 추천합니다.<br>한국GPT협회는 500여 기업의 산업별 맞춤 교육 레퍼런스를 보유하고 있습니다.</p>`;
    }

    // 핵심 추천 카드 (검정 배경)
    if (rec.main.length > 0) {
        const c = rec.main[0];
        const courseData = ALL_COURSES.find(ac => ac.level === c.level) || ALL_COURSES[0];
        page1.innerHTML += `
        <div class="rec-hero">
            <span class="rec-hero-badge">★ 핵심 추천 과정</span>
            <h3 class="rec-hero-course">${c.course}</h3>
            <p class="rec-hero-level">${c.level} 과정 · ${c.duration}</p>
            <p class="rec-hero-desc">${c.desc}</p>
        </div>
        <table class="rec-table">
            <thead><tr><th>모듈</th><th>상세 내용</th></tr></thead>
            <tbody>${courseData.rows.map(r => `<tr><td class="rec-table-module">${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</tbody>
        </table>`;

        // 기대 성과
        if (c.outcomes) {
            page1.innerHTML += `
            <div class="rec-outcomes-box">
                <h4>기대 성과</h4>
                <div class="rec-outcomes-grid">
                    ${c.outcomes.map(o => `<div class="rec-outcome-item">→ ${o}</div>`).join('')}
                </div>
            </div>`;
        }
    }

    // 보조 추천 (있으면)
    if (rec.main.length > 1) {
        const c2 = rec.main[1];
        page1.innerHTML += `
        <div class="rec-card" style="margin-top:0.75rem;">
            <span class="rec-level">다음 단계 · ${c2.level} 과정</span>
            <h3 class="rec-course">${c2.course}</h3>
            <p class="rec-desc">${c2.desc}</p>
            <p class="rec-duration">교육 시간: ${c2.duration}</p>
        </div>`;
    }

    // --- PAGE 2: 직무특화 + 로드맵 + 약점 ---

    // 직무특화 카드 (상세)
    if (rec.job) {
        page2.innerHTML += `
        <div class="rec-card rec-card--job">
            <span class="rec-level">직무특화 교육${rec.job.industry ? ' · '+rec.job.industry+' 산업' : ''}</span>
            <h3 class="rec-course">${rec.job.course}</h3>
            <p class="rec-desc">${rec.job.desc}</p>
            ${rec.job.duration ? `<p class="rec-duration">교육 시간: ${rec.job.duration}</p>` : ''}
            ${rec.job.modules?.length ? `
            <div class="rec-detail-section">
                <h4>주요 학습 내용</h4>
                <ul class="rec-modules-list">${rec.job.modules.map(m=>`<li>${m}</li>`).join('')}</ul>
            </div>` : ''}
        </div>`;
    }

    // 전체 교육 과정 로드맵 테이블
    page2.innerHTML += `
    <div class="rec-roadmap-table">
        <h3 class="rec-roadmap-title">한국GPT협회 교육 과정 전체 로드맵</h3>
        <p style="font-size:0.7rem;color:#737373;margin-bottom:0.5rem;line-height:1.6;">4단계 체계적 과정으로 AI 입문부터 전문가까지 성장할 수 있습니다. 귀하에게 추천된 과정은 강조 표시됩니다.</p>
        <table class="rec-table rec-table--roadmap">
            <thead><tr><th>단계</th><th>과정명</th><th>시간</th><th>핵심 학습 모듈</th></tr></thead>
            <tbody>
                ${ALL_COURSES.map(ac => {
                    const isRec = rec.main.some(m => m.level === ac.level);
                    return `<tr class="${isRec ? 'rec-table-highlight' : ''}">
                        <td class="rec-table-level">${ac.level}</td>
                        <td class="rec-table-module">${ac.course}</td>
                        <td style="white-space:nowrap">${ac.duration}</td>
                        <td>${ac.rows.map(r => r[0]).join(' · ')}</td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>
    </div>`;

    // 우선 개선 (검정 배경)
    if (rec.weakness) {
        const wd = scores.dimensions[rec.weakestDimension];
        page2.innerHTML += `
        <div class="rec-improve">
            <h4 class="rec-improve-title">우선 개선 영역: ${wd.name} (${wd.grade}등급, ${wd.percent}%)</h4>
            <p class="rec-improve-tip">${rec.weakness.tip}</p>
            <p class="rec-improve-action">${rec.weakness.action}</p>
        </div>`;
    }
}

// PDF/인쇄 공통: Spline 숨기고 정적 표지로 교체
function switchToPrintMode() {
    const spSection = document.getElementById('spline-section');
    const staticCover = document.getElementById('cover-static');
    if (spSection) spSection.style.display = 'none';
    if (staticCover) staticCover.style.display = 'flex';
}

function switchToWebMode() {
    const spSection = document.getElementById('spline-section');
    const staticCover = document.getElementById('cover-static');
    if (spSection) spSection.style.display = 'block';
    if (staticCover) staticCover.style.display = 'none';
}

async function downloadPDF() {
    if (!window.jspdf || !window.html2canvas) {
        alert('PDF 생성 라이브러리를 로딩 중입니다. 잠시 후 다시 시도해주세요.');
        return;
    }

    const bar = document.getElementById('action-bar');
    bar.style.display = 'none';
    switchToPrintMode();

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pages = document.querySelectorAll('.report-page');
    const A4_W = 210, A4_H = 297;

    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];

        const canvas = await html2canvas(page, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            width: page.offsetWidth,
            height: page.offsetHeight
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.92);
        // 캡처된 이미지의 실제 비율로 PDF 높이 계산
        const realH = (canvas.height / canvas.width) * A4_W;

        if (i > 0) pdf.addPage('a4', 'portrait');

        if (realH <= A4_H + 5) {
            // A4 이내: 비율 유지하여 삽입
            pdf.addImage(imgData, 'JPEG', 0, 0, A4_W, realH);
        } else {
            // A4보다 긴 콘텐츠: 여러 PDF 페이지에 분할
            const totalPages = Math.ceil(realH / A4_H);
            const sliceH = canvas.height / totalPages;

            for (let p = 0; p < totalPages; p++) {
                if (p > 0) pdf.addPage('a4', 'portrait');

                // 캔버스에서 해당 영역만 잘라서 삽입
                const tmpCanvas = document.createElement('canvas');
                tmpCanvas.width = canvas.width;
                tmpCanvas.height = sliceH;
                const ctx = tmpCanvas.getContext('2d');
                ctx.drawImage(canvas, 0, -p * sliceH);

                const sliceImg = tmpCanvas.toDataURL('image/jpeg', 0.92);
                const slicePdfH = (sliceH / canvas.width) * A4_W;
                pdf.addImage(sliceImg, 'JPEG', 0, 0, A4_W, Math.min(slicePdfH, A4_H));
            }
        }
    }

    const name = JSON.parse(localStorage.getItem('ai-diagnosis-data')||'{}').responses?.q5 || '진단결과';
    pdf.save(`AI활용수준진단_${name}.pdf`);

    bar.style.display = 'flex';
    switchToWebMode();
}

async function generateAndSendEmail(email) {
    if (!email || !GAS_URL) {
        console.log('이메일 발송 건너뜀: email=' + email + ', GAS_URL=' + !!GAS_URL);
        return;
    }
    console.log('이메일 발송 시작: ' + email);
    try {
        // PDF 생성 (백그라운드, 화면 전환 없이)
        let pdfBase64 = null;
        if (window.jspdf && window.html2canvas) {
            console.log('PDF 생성 중...');
            switchToPrintMode();
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pages = document.querySelectorAll('.report-page');

            for (let i = 0; i < pages.length; i++) {
                const c = await html2canvas(pages[i], {
                    scale: 1.5, useCORS: true, logging: false, backgroundColor: '#fff',
                    width: pages[i].offsetWidth, height: pages[i].offsetHeight
                });
                const realH = (c.height / c.width) * 210;
                if (i > 0) pdf.addPage('a4', 'portrait');
                pdf.addImage(c.toDataURL('image/jpeg', 0.85), 'JPEG', 0, 0, 210, realH);
            }
            pdfBase64 = pdf.output('datauristring').split(',')[1];
            switchToWebMode();
            console.log('PDF 생성 완료');
        }

        await sendEmailWithReport(pdfBase64, email);
        console.log('이메일 발송 요청 완료');
    } catch (e) {
        console.error('이메일 발송 실패:', e);
        switchToWebMode();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    (document.fonts?.ready || Promise.resolve()).then(() => initReport());
});
