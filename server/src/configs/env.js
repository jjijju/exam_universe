import dotenv from 'dotenv';

dotenv.config();

const env = {
	node_env: process.env.NODE_ENV,
	debug: process.env.DEBUG,
	port: process.env.PORT,
};

export default env;
