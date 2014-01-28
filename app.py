# -*- coding: UTF-8 -*-

import os
from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('main.html')
