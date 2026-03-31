/* ========================================
   Charts — Radar + Normal Distribution
   ======================================== */

/**
 * 육각형 레이더 차트 생성
 */
function createRadarChart(canvasId, scores) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    const dims = scores.dimensions;

    const labels = Object.keys(dims).map(k => dims[k].name);
    const data = Object.keys(dims).map(k => dims[k].percent);
    const colors = Object.keys(dims).map(k => dims[k].color);

    return new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: '귀하의 점수',
                data: data,
                backgroundColor: 'rgba(10, 10, 10, 0.08)',
                borderColor: '#0a0a0a',
                borderWidth: 2,
                pointBackgroundColor: '#0a0a0a',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    min: 0,
                    ticks: {
                        stepSize: 20,
                        font: {
                            family: "'Paperlogy', sans-serif",
                            size: 9,
                            weight: '400'
                        },
                        color: '#a3a3a3',
                        backdropColor: 'transparent'
                    },
                    grid: {
                        color: '#e5e5e5',
                        lineWidth: 1
                    },
                    angleLines: {
                        color: '#e5e5e5',
                        lineWidth: 1
                    },
                    pointLabels: {
                        font: {
                            family: "'Paperlogy', sans-serif",
                            size: 11,
                            weight: '700'
                        },
                        color: '#0a0a0a',
                        padding: 15
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#0a0a0a',
                    titleFont: { family: "'Paperlogy', sans-serif", weight: '700' },
                    bodyFont: { family: "'Paperlogy', sans-serif" },
                    callbacks: {
                        label: function(context) {
                            return context.parsed.r + '%';
                        }
                    }
                }
            }
        }
    });
}

/**
 * 정규분포 곡선 생성
 */
function createDistributionChart(canvasId, userGrade) {
    const ctx = document.getElementById(canvasId).getContext('2d');

    // 정규분포 PDF 계산 (평균=5, 표준편차=1.5)
    const mean = 5;
    const stdDev = 1.5;

    function normalPDF(x) {
        return (1 / (stdDev * Math.sqrt(2 * Math.PI))) *
            Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
    }

    // 데이터 포인트 생성 (0.5 ~ 9.5)
    const points = [];
    const bgColors = [];
    const labels = [];

    for (let x = 0.5; x <= 9.5; x += 0.1) {
        const y = normalPDF(x);
        points.push({ x: x, y: y });
    }

    // 등급별 막대 데이터 (1-9등급)
    const gradeLabels = ['1등급', '2등급', '3등급', '4등급', '5등급', '6등급', '7등급', '8등급', '9등급'];
    const gradeValues = [];
    const gradeBgColors = [];

    for (let g = 1; g <= 9; g++) {
        gradeValues.push(normalPDF(g));
        if (g === userGrade) {
            gradeBgColors.push('#0a0a0a');
        } else {
            gradeBgColors.push('#e5e5e5');
        }
    }

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: gradeLabels,
            datasets: [{
                label: '분포',
                data: gradeValues,
                backgroundColor: gradeBgColors,
                borderWidth: 0,
                borderRadius: 2,
                barPercentage: 0.8,
                categoryPercentage: 0.9
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        font: {
                            family: "'Paperlogy', sans-serif",
                            size: 10,
                            weight: function(context) {
                                return context.index + 1 === userGrade ? '800' : '400';
                            }
                        },
                        color: function(context) {
                            return context.index + 1 === userGrade ? '#0a0a0a' : '#a3a3a3';
                        }
                    }
                },
                y: {
                    display: false,
                    beginAtZero: true
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#0a0a0a',
                    titleFont: { family: "'Paperlogy', sans-serif" },
                    bodyFont: { family: "'Paperlogy', sans-serif" },
                    callbacks: {
                        label: function(context) {
                            const grade = context.dataIndex + 1;
                            const gradeInfo = GRADE_TABLE.find(g => g.grade === grade);
                            return gradeInfo ? `${gradeInfo.label} (${gradeInfo.min}~${gradeInfo.max}%)` : '';
                        }
                    }
                }
            }
        }
    });
}
