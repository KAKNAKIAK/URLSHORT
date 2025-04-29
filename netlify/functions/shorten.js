// node-fetch를 사용해야 할 경우 주석 해제 (Netlify는 최신 Node 버전을 지원하므로 내장 fetch 사용 가능성 높음)
// const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    // POST 요청만 허용
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        // 요청 본문에서 long_url 추출
        const { long_url } = JSON.parse(event.body);

        // 간단한 URL 유효성 검사 (필요 시 정규식 강화)
        if (!long_url || !/^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(long_url)) {
           return { statusCode: 400, body: JSON.stringify({ error: '유효하지 않은 URL 형식입니다.' }) };
        }

        // 환경 변수에서 Bitly 토큰 가져오기 (★★★ Netlify UI에서 설정 필수 ★★★)
        const BITLY_TOKEN = process.env.BITLY_TOKEN;
        if (!BITLY_TOKEN) {
            console.error('Bitly 토큰이 설정되지 않았습니다.');
            return { statusCode: 500, body: JSON.stringify({ error: '서버 설정 오류입니다.' }) };
        }

        // Bitly API 호출
        const response = await fetch('https://api-ssl.bitly.com/v4/shorten', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${BITLY_TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json' // 응답 형식을 JSON으로 명시
            },
            body: JSON.stringify({
                long_url: long_url,
                domain: 'bit.ly' // 필요 시 다른 Bitly 도메인 사용
            }),
        });

        // Bitly API 응답 상태 확인
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Bitly API 오류 응답 처리 실패' }));
            console.error('Bitly API 오류:', response.status, errorData);
             // 사용자에게 더 친절한 오류 메시지를 반환할 수 있습니다.
            let userErrorMessage = `Bitly API 오류 (${response.status})`;
            if (errorData.message) {
                 // 흔한 오류 케이스 처리 (예: INVALID_ARG_LONG_URL)
                if (errorData.message === 'INVALID_ARG_LONG_URL') {
                   userErrorMessage = '입력하신 URL이 유효하지 않습니다. Bitly에서 처리할 수 없는 형식입니다.';
                } else {
                   userErrorMessage = `Bitly 오류: ${errorData.message}`;
                }
            }
            return { statusCode: response.status, body: JSON.stringify({ error: userErrorMessage }) };
        }

        // Bitly API 성공 응답 처리
        const data = await response.json();

        // 프론트엔드로 단축 URL 반환
        return {
            statusCode: 200,
            body: JSON.stringify({ short_url: data.link }),
        };

    } catch (error) {
        console.error('서버리스 함수 오류:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: '서버 내부 오류가 발생했습니다.', details: error.message }),
        };
    }
};
