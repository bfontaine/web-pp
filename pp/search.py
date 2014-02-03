# -*- coding: UTF-8 -*-
"""
This module provides basic server-side search.
"""

import re
import json
from store import redis

def search_url(kw):
    h = json.loads(redis.get('people.json'), 'utf8')

    rx = re.compile(kw.strip(), re.IGNORECASE|re.UNICODE)

    for p in h.values():
        if 'fuzzy' in p and re.search(rx, p['fuzzy']):
            return p['url']
