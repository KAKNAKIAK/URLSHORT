// DOM 요소 가져오기
const longUrlInput = document.getElementById('longUrlInput');
const shortenButton = document.getElementById('shortenButton');
const resultArea = document.getElementById('resultArea');
const loadingMessage = document.getElementById('loading');
const successResultDiv = document.getElementById('successResult');
const shortUrlLink = document.getElementById('shortUrlLink');
const copyButton = document.getElementById('copyButton');
const errorMessageP = document.getElementById('errorMessage');

// 단축하기 버튼 클릭 이벤트 리스너
shortenButton.addEventListener('click', async () => {
    const longUrl = longUrlInput.value.trim();

    // 입력값 유효성 검사 (빈 값 확인)
    if (!longUrl) {
        showError('URL을 입력해주세요.');
        return;
    }

    // 이전에 표시된 결과/오류 숨기기
    hideResults();
    loadingMessage.style.display = 'block'; // 로딩 메시지 표시

    try {
        // 서버리스 함수 호출 (Netlify 함수 경로: /.netlify/functions/함수이름)
        const response = await fetch('/.netlify/functions/shorten', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ long_url: longUrl }),
        });

        loadingMessage.style.display = 'none'; // 로딩 메시지 숨기기

        // 응답 상태 확인
        if (!response.ok) {
            // 실패 시 오류 메시지 처리
            const errorData = await response.json().catch(() => ({ error: '오류 응답 처리 중 문제가 발생했습니다.' }));
            throw new Error(errorData.error || `오류 발생: ${response.status}`);
        }

        // 성공 시 결과 처리
        const data = await response.json();
        showSuccess(data.short_url);

    } catch (error) {
        loadingMessage.style.display = 'none'; // 로딩 메시지 숨기기
        console.error('단축 실패:', error);
        showError(error.message || 'URL 단축 중 오류가 발생했습니다.');
    }
});

// 복사 버튼 클릭 이벤트 리스너
copyButton.addEventListener('click', () => {
    const urlToCopy = shortUrlLink.href;
    navigator.clipboard.writeText(urlToCopy).then(() => {
        // 복사 성공 시 사용자 피드백 (예: 버튼 텍스트 변경)
        const originalText = copyButton.textContent;
        copyButton.textContent = '복사됨!';
        setTimeout(() => {
            copyButton.textContent = originalText;
        }, 1500); // 1.5초 후 원래 텍스트로 복귀
    }).catch(err => {
        console.error('복사 실패:', err);
        // 사용자에게 복사 실패 알림 (필요 시)
        alert('클립보드 복사에 실패했습니다.');
    });
});

// 성공 결과 표시 함수
function showSuccess(shortUrl) {
    hideResults(); // 다른 결과 숨기기
    shortUrlLink.href = shortUrl;
    shortUrlLink.textContent = shortUrl;
    successResultDiv.style.display = 'block'; // 성공 결과 영역 표시
}

// 오류 메시지 표시 함수
function showError(message) {
    hideResults(); // 다른 결과 숨기기
    errorMessageP.textContent = message;
    errorMessageP.style.display = 'block'; // 오류 메시지 영역 표시
}

// 모든 결과/메시지 숨기기 함수
function hideResults() {
    loadingMessage.style.display = 'none';
    successResultDiv.style.display = 'none';
    errorMessageP.style.display = 'none';
}
