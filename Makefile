all:
	cd src && tsc

pack: all
	pnpm pack

.PHONY: test
test: clean
	node ./node_modules/vitest/dist/cli.js run --coverage

clean:
	rm -f ./crazy-i18n-*.tgz
	rm -f ./src/*.js
	rm -f ./src/*.d.ts
