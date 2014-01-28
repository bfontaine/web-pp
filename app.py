# -*- coding: UTF-8 -*-

import pp
import os
from flask import Flask

app = Flask(__name__)

@app.route('/')
def hello():
    return 'Hello World!'
