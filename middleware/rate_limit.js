const moment = require('moment');
const redis = require('redis');
const redis_client = redis.createClient();

const WINDOW_SIZE_IN_SECONDS = 60;
const MAX_REQUEST_PER_WINDOW = 10;

exports.rate_limit = function (req, res, next) {
  try {
    if(!redis){
      throw new Error('Redis client does not exist');
    }

    redis_client.get(req.ip, (error, record) => {
      if(error){
         throw error;
      }

      const curr_time = moment();
      if(!record){
        const new_record = {
          timestamp: curr_time.format('X'),
          tokens: MAX_REQUEST_PER_WINDOW
        }

        redis_client.set(req.ip, JSON.stringify(new_record));
        next();
        return true;
      }

      const existing_record = JSON.parse(record);
      const current_time_request = curr_time.diff(moment.unix(existing_record.timestamp), "seconds");
      
      if(current_time_request <= WINDOW_SIZE_IN_SECONDS && existing_record.tokens > 0 ){
        existing_record.tokens--;

        redis_client.set(req.ip, JSON.stringify(existing_record));
        next();
        return true;
      }else if(current_time_request > WINDOW_SIZE_IN_SECONDS){
        existing_record.timestamp = curr_time.format('X');
        existing_record.tokens = MAX_REQUEST_PER_WINDOW
        redis_client.set(req.ip, JSON.stringify(existing_record));
        next();
      }else{
        res.status(403).send(`You have exceeded the ${MAX_REQUEST_PER_WINDOW} requests in ${WINDOW_SIZE_IN_SECONDS} seconds limit!`);
        return false;
      }

    });
  } catch (error) {
    res.status(403).send(error.message);
  }
}