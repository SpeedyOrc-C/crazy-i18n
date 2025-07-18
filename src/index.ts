type Split<s extends string> =
    s extends `${infer head}.${infer tail}`
        ? [head, ...Split<tail>]
        : [s]

type Field<obj extends {[k: string]: any}, keys extends any[]> =
    keys extends [infer head, ...infer tail]
        ? head extends string
            ? Field<NonNullable<obj[head]>, tail>
            : never
        : obj

type LeafToArgs<leaf extends NonNullable<Leaf>> =
    leaf extends string
        ? []
        : Parameters<Exclude<leaf, string>>

type GetArgs<obj extends {[k: string]: any}, key extends string> =
    LeafToArgs<Field<obj, Split<key>>>

type ObjectOfDepth<depth, a> =
    depth extends 1 ? {[key: string]: a                      } :
    depth extends 2 ? {[key: string]: a | ObjectOfDepth<1, a>} :
    depth extends 3 ? {[key: string]: a | ObjectOfDepth<2, a>} :
    depth extends 4 ? {[key: string]: a | ObjectOfDepth<3, a>} :
    depth extends 5 ? {[key: string]: a | ObjectOfDepth<4, a>} :
    depth extends 6 ? {[key: string]: a | ObjectOfDepth<5, a>} :
    depth extends 7 ? {[key: string]: a | ObjectOfDepth<6, a>} :
    depth extends 8 ? {[key: string]: a | ObjectOfDepth<7, a>} :
    depth extends 9 ? {[key: string]: a | ObjectOfDepth<8, a>} :
                              never

type Leaf
    = undefined
    | string
    | ((...args: any[]) => string)

type LanguagePack = ObjectOfDepth<9, Leaf>

type FlattenedKeysOf<obj> =
    obj extends LanguagePack
        ? _FlattenedKeysOf<obj, string & keyof obj>
        : never

type _FlattenedKeysOf<obj extends LanguagePack, key extends string> =
    key extends any
        ? obj[key] extends Leaf
            ? key
            : `${key}.${FlattenedKeysOf<obj[key]>}`
        : never

export function TranslatorFrom<LP extends LanguagePack>(languagePack: LP)
{
    return function <K extends FlattenedKeysOf<LP>>
    (key: K, ...args: GetArgs<LP, K>): string
    {
        const breadcrumbs = key.split(".")

        let packNow: any = languagePack

        while (true)
        {
            const path = breadcrumbs.shift()

            if (path != undefined)
            {
                packNow = packNow[path]

                if (packNow == undefined)
                    return key

                continue
            }

            if (typeof packNow == "string")
                return packNow

            if (typeof packNow == "function")
                return packNow(args)

            return key
        }
    }
}

export function TranslatorWithFallbacks<LP extends LanguagePack>
(...languagePacks: readonly LP[])
{
    return function <K extends FlattenedKeysOf<LP>>
    (key: K, ...args: GetArgs<LP, K>): string
    {
        const lps = new Array(...languagePacks)

        let breadcrumbs = key.split(".")

        let packNow: any = lps.shift()

        while (true)
        {
            const path = breadcrumbs.shift()

            if (path != undefined)
            {
                packNow = packNow[path]

                if (packNow == undefined)
                {
                    packNow = lps.shift()

                    if (packNow == undefined)
                        return key

                    breadcrumbs = key.split(".")
                }

                continue
            }

            if (typeof packNow == "string")
                return packNow

            if (typeof packNow == "function")
                return packNow(args)

            packNow = lps.shift()

            if (packNow == undefined)
                return key

            breadcrumbs = key.split(".")
        }
    }
}
