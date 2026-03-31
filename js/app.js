/* ========================================
   Survey App — Navigation & Validation v2
   ======================================== */

let currentStep = 1;
const totalSteps = 6;
const totalQuestions = 39;

// ===== "기타" 텍스트 입력 토글 =====
document.addEventListener('DOMContentLoaded', () => {
    // Q2, Q3의 "기타" 라디오 선택 시 텍스트 입력창 표시
    ['q2', 'q3'].forEach(qName => {
        const radios = document.querySelectorAll(`input[name="${qName}"]`);
        const otherInput = document.querySelector(`input[name="${qName}_other"]`);
        if (!otherInput) return;

        radios.forEach(radio => {
            radio.addEventListener('change', () => {
                if (radio.value === '기타' && radio.checked) {
                    otherInput.style.display = 'block';
                    otherInput.focus();
                    gsap.fromTo(otherInput, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.3 });
                } else {
                    otherInput.style.display = 'none';
                    otherInput.value = '';
                }
            });
        });
    });
});

// ===== Start Survey =====
function startSurvey() {
    const intro = document.getElementById('intro-screen');
    const survey = document.getElementById('survey-screen');

    gsap.to(intro, {
        opacity: 0,
        y: -30,
        duration: 0.5,
        ease: 'power2.in',
        onComplete: () => {
            intro.style.display = 'none';
            survey.style.display = 'block';
            gsap.fromTo(survey,
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
            );
            animateStep(1);
            updateProgress();
        }
    });
}

// ===== Step Navigation =====
function nextStep() {
    if (!validateStep(currentStep)) return;

    const current = document.querySelector(`.form-step[data-step="${currentStep}"]`);
    const next = document.querySelector(`.form-step[data-step="${currentStep + 1}"]`);
    if (!next) return;

    gsap.to(current, {
        opacity: 0, x: -40, duration: 0.3, ease: 'power2.in',
        onComplete: () => {
            current.style.display = 'none';
            next.style.display = 'block';
            currentStep++;
            updateProgress();
            updateNavButtons();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            gsap.fromTo(next, { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out' });
            animateStep(currentStep);
        }
    });
}

function prevStep() {
    if (currentStep <= 1) return;

    const current = document.querySelector(`.form-step[data-step="${currentStep}"]`);
    const prev = document.querySelector(`.form-step[data-step="${currentStep - 1}"]`);

    gsap.to(current, {
        opacity: 0, x: 40, duration: 0.3, ease: 'power2.in',
        onComplete: () => {
            current.style.display = 'none';
            prev.style.display = 'block';
            currentStep--;
            updateProgress();
            updateNavButtons();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            gsap.fromTo(prev, { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out' });
        }
    });
}

// ===== Progress Bar =====
function updateProgress() {
    const percent = Math.round((currentStep / totalSteps) * 100);
    document.getElementById('progress-fill').style.width = percent + '%';
    document.getElementById('progress-part').textContent = `PART ${currentStep} / ${totalSteps}`;
    document.getElementById('progress-percent').textContent = percent + '%';
}

// ===== Navigation Buttons =====
function updateNavButtons() {
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const btnSubmit = document.getElementById('btn-submit');

    btnPrev.style.display = currentStep > 1 ? 'inline-block' : 'none';

    if (currentStep === totalSteps) {
        btnNext.style.display = 'none';
        btnSubmit.style.display = 'inline-block';
    } else {
        btnNext.style.display = 'inline-block';
        btnSubmit.style.display = 'none';
    }
}

// ===== Step Animation =====
function animateStep(step) {
    const stepEl = document.querySelector(`.form-step[data-step="${step}"]`);
    const questions = stepEl.querySelectorAll('.question');

    gsap.fromTo(questions,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out', delay: 0.2 }
    );
}

// ===== Validation =====
function validateStep(step) {
    const stepEl = document.querySelector(`.form-step[data-step="${step}"]`);
    const questions = stepEl.querySelectorAll('.question');
    let valid = true;

    questions.forEach(q => {
        q.classList.remove('error');
        const qNum = q.dataset.q;
        const name = `q${qNum}`;

        // Text/email/tel inputs
        const textInputs = q.querySelectorAll(`input[type="text"][name="${name}"], input[type="email"][name="${name}"], input[type="tel"][name="${name}"]`);
        textInputs.forEach(input => {
            if (input.required && !input.value.trim()) {
                q.classList.add('error');
                valid = false;
            }
            if (input.type === 'email' && input.value.trim()) {
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) {
                    q.classList.add('error');
                    valid = false;
                }
            }
        });

        // Radio buttons
        const radios = q.querySelectorAll(`input[type="radio"][name="${name}"]`);
        if (radios.length > 0 && radios[0].required) {
            if (!q.querySelector(`input[type="radio"][name="${name}"]:checked`)) {
                q.classList.add('error');
                valid = false;
            }
        }

        // Checkboxes
        const checkboxes = q.querySelectorAll(`input[type="checkbox"][name="${name}"]`);
        if (checkboxes.length > 0) {
            if (!q.querySelector(`input[type="checkbox"][name="${name}"]:checked`)) {
                q.classList.add('error');
                valid = false;
            }
        }
    });

    if (!valid) {
        const firstError = stepEl.querySelector('.question.error');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            gsap.fromTo(firstError, { x: -5 }, { x: 5, duration: 0.05, repeat: 5, yoyo: true });
        }
    }

    return valid;
}

// ===== Collect All Responses =====
function collectResponses() {
    const responses = {};

    for (let i = 1; i <= totalQuestions; i++) {
        const name = `q${i}`;

        // Text/email/tel
        const textInput = document.querySelector(`input[name="${name}"][type="text"], input[name="${name}"][type="email"], input[name="${name}"][type="tel"]`);
        if (textInput) {
            let val = textInput.value.trim();
            // "기타" 선택 시 기타 입력값 병합
            const otherInput = document.querySelector(`input[name="${name}_other"]`);
            if (otherInput && otherInput.value.trim()) {
                val = '기타: ' + otherInput.value.trim();
            }
            responses[name] = val;
            continue;
        }

        // Radio
        const radio = document.querySelector(`input[name="${name}"][type="radio"]:checked`);
        if (radio) {
            let val = radio.value;
            // "기타" 라디오 선택 시 기타 입력값 병합
            if (val === '기타') {
                const otherInput = document.querySelector(`input[name="${name}_other"]`);
                if (otherInput && otherInput.value.trim()) {
                    val = '기타: ' + otherInput.value.trim();
                }
            }
            responses[name] = val;
            continue;
        }

        // Checkbox
        const checkboxes = document.querySelectorAll(`input[name="${name}"][type="checkbox"]:checked`);
        if (checkboxes.length > 0) {
            responses[name] = Array.from(checkboxes).map(cb => cb.value);
            continue;
        }

        responses[name] = '';
    }

    return responses;
}

// ===== Submit Survey =====
function submitSurvey() {
    if (!validateStep(currentStep)) return;

    const responses = collectResponses();
    const scores = calculateScores(responses);

    document.getElementById('survey-screen').style.display = 'none';
    const loading = document.getElementById('loading-screen');
    loading.style.display = 'flex';
    gsap.fromTo(loading, { opacity: 0 }, { opacity: 1, duration: 0.3 });

    const reportData = {
        responses: responses,
        scores: scores,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem('ai-diagnosis-data', JSON.stringify(reportData));

    sendToBackend(reportData);

    setTimeout(() => {
        window.location.href = 'report.html';
    }, 2000);
}
