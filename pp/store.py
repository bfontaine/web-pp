# -*- coding: UTF-8 -*-

import os
import redis

# https://devcenter.heroku.com/articles/redistogo#install-redis-in-python
redis_url = os.getenv('REDISTOGO_URL', 'redis://localhost:6379')
redis = redis.from_url(redis_url)
