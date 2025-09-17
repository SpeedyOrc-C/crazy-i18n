import {expect, test} from "vitest"
import {PopulateLanguagePacks} from "../src/unify"

// Start translating them into Chinese...
const ZhCn = {
	hello: "你好。",
	greet: (name: string) => `你好${name}！`,
	good: {
		morning: "早上好。",
		afternoon: "下午好。",
		evening: "晚上好。",
		nested: {
			foo: "钝角"
		}
	}
}

// and English as well...
const En = {
	// hello: "Hello.",
	greet: (name: string) => `Hello ${name}!`,
	good: {
		morning: "Good morning.",
		afternoon: "Good afternoon.",
		evening: "Good evening.",
		nested: {
			foo: "Foo",
			bar: "Bar"
		}
	}
}

const packs = PopulateLanguagePacks({ZhCn, En})

test("Chinese", () =>
{
	// Get a magic translator from your selected language pack
	const t = packs.ZhCn

	// Drop a key to get the translation
	expect(t.hello).toBe("你好。")
	// Fill in the placeholder
	expect(t.greet("世界")).toBe("你好世界！")
	// Automatically fallback to the original string
	expect(t.good.nested.bar).toBe("good.nested.bar")
})

test("English", () =>
{
	const t = packs.En

	expect(t.hello).toBe("Hello.")
	expect(t.greet("world")).toBe("Hello world!")
	expect(t.good.nested.bar).toBe("Bar")
})
