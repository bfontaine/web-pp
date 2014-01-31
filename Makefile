# Web-pp Makefile

.DEFAULT: all
.PHONY: all deploy populate run

all: deploy

deploy:
	git push

populate:
	\python scheduler.py

run:
	CLOSURE_COMPRESSOR_OPTIMIZATION=ADVANCED_OPTIMIZATIONS \
	gunicorn app:app
