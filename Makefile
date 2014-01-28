# Web-pp Makefile

.DEFAULT: all
.PHONY: all deploy

all: deploy

deploy:
	git push
	h run python scheduler.py
