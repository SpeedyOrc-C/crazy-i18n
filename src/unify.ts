import {ListOf} from "ts-toolbelt/out/Union/ListOf"

enum LeafType { String, Function }

type PackType = { [key: string]: PackType | LeafType }

type LanguagePack = { [key: string]: LanguagePack | string | ((...args: any[]) => string) }

type UnifyPackType<a, b> = {
    [key in keyof a | keyof b]:
    key extends keyof a
        ? key extends keyof b
            ? [a[key], b[key]] extends [LeafType.String, LeafType.String]
                ? LeafType.String
                : [a[key], b[key]] extends [LeafType.Function, LeafType.Function]
                    ? LeafType.Function
                    : UnifyPackType<a[key], b[key]>
            : a[key]
        : key extends keyof b
            ? b[key]
            : never
}

type UnionsUnifyPackType<ts> =
    ts extends []
        ? {}
        : ts extends [infer t]
            ? t
            : ts extends [infer a, infer b, ...infer tail]
                ? a extends PackType
                    ? b extends PackType
                        ? tail extends []
                            ? UnifyPackType<a, b>
                            : tail extends LanguagePack[]
                                ? UnionsUnifyPackType<[UnifyPackType<a, b>, ...tail]>
                                : never
                        : never
                    : never
                : never


type UnifyLanguagePack<a extends LanguagePack, b extends LanguagePack> = {
    [k in keyof a | keyof b]:
    k extends keyof a
        ? k extends keyof b
            ? [a[k], b[k]] extends [string, string]
                ? string
                : [a[k], b[k]] extends [(...args: infer p1) => string, (...args: infer p2) => string]
                    ? [p1, p2] extends [p2, p1]
                        ? (...args: p1) => string
                        : ["Type of parameters not matched", p1, p2]
                    : [a[k], b[k]] extends [infer ak, infer bk]
                        ? ak extends LanguagePack
                            ? bk extends LanguagePack
                                ? UnifyLanguagePack<ak, bk>
                                : never
                            : never
                        : ["Type of entry not matched", a[k], b[k]]
            : a[k]
        : k extends keyof b
            ? b[k]
            : never
}

type UnionsUnifyLanguagePack<ts> =
    ts extends []
        ? {}
        : ts extends [infer t]
            ? t
            : ts extends [infer a, infer b, ...infer tail]
                ? a extends LanguagePack
                    ? b extends LanguagePack
                        ? tail extends []
                            ? UnifyLanguagePack<a, b>
                            : tail extends LanguagePack[]
                                ? UnionsUnifyLanguagePack<[UnifyLanguagePack<a, b>, ...tail]>
                                : never
                        : never
                    : never
                : never

function TypeOfLanguagePack<P extends LanguagePack>(pack: P): PackType
{
    const type: PackType = {}

    for (const key in pack)
    {
        const value = pack[key]

        switch (typeof value)
        {
        case "string":
            type[key] = LeafType.String
            break
        case "function":
            type[key] = LeafType.Function
            break
        case "object":
            type[key] = TypeOfLanguagePack(value)
            break
        default:
            throw "This is not possible."
        }
    }

    return type
}

function UnifyPackType<P1 extends PackType, P2 extends PackType>
(pt1: P1, pt2: P2): UnifyPackType<P1, P2>
{
    const keys1 = Object.keys(pt1)
    const keys2 = Object.keys(pt2)
    const unifiedKeys = new Set([...keys1, ...keys2])

    const type: PackType = {}

    for (const key of unifiedKeys)
    {
        const value1 = pt1[key]
        const value2 = pt2[key]

        if (typeof value1 == "object" && typeof value2 == "object")
            type[key] = UnifyPackType(value1, value2)
        else if (value1 == LeafType.String && value2 == LeafType.String)
            type[key] = LeafType.String
        else if (value1 == LeafType.Function && value2 == LeafType.Function)
            type[key] = LeafType.Function
        else if (value1 != undefined && value2 == undefined)
            type[key] = value1
        else if (value1 == undefined && value2 != undefined)
            type[key] = value2
        else
            throw `Type mismatch for key: ${key}`
    }

    return type as UnifyPackType<P1, P2>
}

function UnionsPackType<Ps extends PackType[]>(ps: Ps): UnionsUnifyPackType<Ps>
{
    return ps.reduce((a, b) => UnifyPackType(a, b), {}) as UnionsUnifyPackType<Ps>
}

function FallbackStringFiller(path: string[]): string
{
    return path.join(".")
}

function FallbackFunctionFiller(path: string[])
{
    return function (...args: any[])
    {
        return `${FallbackStringFiller(path)}(${args.map(x => x.toString()).join(", ")})`
    }
}

type PopulateLanguagePacks<packs extends { [k: string]: LanguagePack }> = {
    [k in keyof packs]: UnionsUnifyLanguagePack<ListOf<packs[keyof packs]>>
}

export function PopulateLanguagePacks<packs extends { [k: string]: LanguagePack }>
(packs: packs): PopulateLanguagePacks<packs>
{
    const packsValues = Object.values(packs) as LanguagePack[]
    const unifiedPackType = UnionsPackType(packsValues.map(TypeOfLanguagePack)) as PackType
    const populatedPacks: { [k: string]: LanguagePack } = {}

    const path: string[] = []

    function Populate(pack: LanguagePack, type: PackType): LanguagePack
    {
        const populatedPack: LanguagePack = {}

        for (const key in type)
        {
            path.push(key)

            const packValue = pack[key]
            const typeValue = type[key]

            if (packValue == undefined)
                if (typeValue == LeafType.String)
                    populatedPack[key] = FallbackStringFiller([...path])
                else if (typeValue == LeafType.Function)
                    populatedPack[key] = FallbackFunctionFiller([...path])
                else
                    populatedPack[key] = Populate({}, typeValue)
            else if (typeof packValue == "object" && typeof typeValue == "object")
                populatedPack[key] = Populate(packValue, typeValue)
            else if (typeof packValue == "string" && typeValue == LeafType.String)
                populatedPack[key] = packValue
            else if (typeof packValue == "function" && typeValue == LeafType.Function)
                populatedPack[key] = packValue
            else
                throw "This is not possible."

            path.pop()
        }

        return populatedPack
    }

    for (const lang in packs)
        populatedPacks[lang] = Populate(packs[lang], unifiedPackType)

    return populatedPacks as PopulateLanguagePacks<packs>
}
