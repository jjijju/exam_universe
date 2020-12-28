import dotenv from 'dotenv';

dotenv.config();

const env = {
	node_env: process.env.NODE_ENV,
	debug: process.env.DEBUG,
	port: process.env.PORT,
	passport: {
		kakao: {
			clientID: '',
			clientSecret: '',
			callbackURL: '',
		},
		naver: {
			clientID: '',
			clientSecret: '',
			callbackURL: '',
		},
	},
	cors: {
		origin: 'http://localhost:3000', // 허락하고자 하는 요청 주소
		credentials: true, // true로 하면 설정한 내용을 response 헤더에 추가 해줍니다.
	},
};

export default env;
