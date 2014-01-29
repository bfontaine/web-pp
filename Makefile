# Web-pp Makefile

.DEFAULT: all
.PHONY: all deploy populate run

all: deploy

deploy:
	git push

populate:
	\python scheduler.py

run:
	gunicorn app:app
