import  {createClient}  from 'redis';

const connectRedis = async () => {
    const redisClient = await createClient({
        url: process.env.REDIS_URL
    })
    .on('error', (err) => console.log('Redis Client Error', err))
    .on('connect', () => console.log('Redis Client Connected'))
    .connect();
    return redisClient;
}

export default connectRedis;