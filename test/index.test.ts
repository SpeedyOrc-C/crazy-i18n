import {expect, test} from "vitest"
import { TranslatorFrom, TranslatorWithFallbacks } from "../src/index.js"
import {FallbackFunctionFiller, FallbackStringFiller, PopulateLanguagePacks} from "../src/unify.js";

// Start by defining a template for every entry you want to translate...
type Template = {
    hello: string
    greet: (name: string) => string
    optional?: string
    good: {
        morning: string
        afternoon: string
        evening: string
        nested: {
            foo?: string
            bar?: string
        }
    }
    optionalNested?: {
        foo: string
        bar?: string
    }
}

// Start translating them into Chinese...
const ZhCn: Template = {
    hello: "你好。",
    greet: name => `你好${name}！`,
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
const En: Template = {
    hello: "Hello.",
    greet: name => `Hello ${name}!`,
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

test("Chinese", () =>
{
    // Get a magic translator from your selected language pack
    const t = TranslatorFrom(ZhCn)

    // Drop a key to get the translation
    expect(t("hello")).toBe("你好。")
    // Fill in the placeholder
    expect(t("greet", "世界")).toBe("你好世界！")
    // Automatically fallback to the original string
    expect(t("good.nested.bar")).toBe("good.nested.bar")
    expect(t("optionalNested.foo")).toBe("optionalNested.foo")
})

test("English", () =>
{
    const t = TranslatorFrom(En)

    expect(t("hello")).toBe("Hello.")
    expect(t("greet", "world")).toBe("Hello world!")
    expect(t("good.nested.bar")).toBe("Bar")
})

test("Fallback", () =>
{
    const t = TranslatorWithFallbacks(ZhCn, En)

    expect(t("hello")).toBe("你好。")
    expect(t("greet", "世界")).toBe("你好世界！")
    expect(t("good.nested.bar")).toBe("Bar")
    expect(t("optional")).toBe("optional")
})

test("", () =>
{
    const t = PopulateLanguagePacks({ZhCn, En}).ZhCn

    expect(t.hello).toBe("你好。")
    expect(t.greet("世界")).toBe("你好世界！")
    expect(t.good.nested.bar).toBe("good.nested.bar")
    expect(t.optionalNested?.foo).toBe("optionalNested.foo")
})
