# Web-pp Makefile

.DEFAULT: all
.PHONY: all deploy

all: deploy

deploy:
	git push
	heroku run python scheduler.py
